import { randomUUID } from 'crypto';
import { Pool, type QueryResultRow } from 'pg';

type SentinelStatus = 'ACTIVE' | 'PAUSED' | 'OFFLINE';

export type Alert = {
  id: string;
  txHash: string;
  protocol: string | null;
  type: string | null;
  gasSaved: string | null;
  status: string | null;
  timestamp: string;
  createdAt: Date;
};

type AlertCreateInput = {
  txHash?: string;
  protocol?: string;
  type?: string;
  gasSaved?: string;
  status?: string;
  timestamp?: string;
};

export type SentinelNode = {
  id: string;
  name: string;
  address: string;
  owner: string | null;
  status: SentinelStatus;
  latency: string;
  events: number;
  lastHeartbeat: Date;
  registeredAt: Date;
};

type SentinelCreateInput = Partial<Omit<SentinelNode, 'id' | 'registeredAt'>> & {
  address: string;
  owner?: string | null;
};

type SentinelUpdateInput = Partial<Omit<SentinelNode, 'id' | 'registeredAt'>>;

type Store = {
  sentinelNodes: SentinelNode[];
  alerts: Alert[];
};

const globalStore = globalThis as unknown as {
  breachResponseStore?: Store;
  breachResponsePgPool?: Pool;
  breachResponseSchemaReady?: Promise<void>;
};

const seedNodes: SentinelNode[] = [
  {
    id: 'sentinel-ax-node',
    name: 'Sentinel.ax Node',
    address: '0x9f758be3ae3D985713964339E2f0bD783fC6015c',
    owner: null,
    status: 'ACTIVE',
    latency: '8ms',
    events: 939,
    lastHeartbeat: new Date(),
    registeredAt: new Date('2026-01-03T00:00:00.000Z')
  }
];

const databaseUrl = process.env.DATABASE_URL;

// Verify the database server certificate by default. Managed providers whose
// chain is not in the system trust store can opt out with
// DATABASE_SSL_REJECT_UNAUTHORIZED=false, keeping the insecure path explicit.
const rejectUnauthorized =
  (process.env.DATABASE_SSL_REJECT_UNAUTHORIZED ?? 'true').toLowerCase() !== 'false';

function getPool() {
  if (!databaseUrl) return undefined;

  if (!globalStore.breachResponsePgPool) {
    globalStore.breachResponsePgPool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized },
      max: 3
    });
  }

  return globalStore.breachResponsePgPool;
}

function getMemoryStore(): Store {
  if (!globalStore.breachResponseStore) {
    globalStore.breachResponseStore = {
      sentinelNodes: [...seedNodes],
      alerts: []
    };
  }

  return globalStore.breachResponseStore;
}

function createSentinelNode(data: SentinelCreateInput): SentinelNode {
  const now = new Date();

  return {
    id: randomUUID(),
    name: data.name ?? 'Custom Sentinel',
    address: data.address,
    owner: data.owner ?? null,
    status: data.status ?? 'ACTIVE',
    latency: data.latency ?? '6.4ms',
    events: data.events ?? 0,
    lastHeartbeat: data.lastHeartbeat ?? now,
    registeredAt: now
  };
}

function mapNode(row: QueryResultRow): SentinelNode {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    owner: row.owner ?? null,
    status: row.status,
    latency: row.latency,
    events: Number(row.events ?? 0),
    lastHeartbeat: new Date(row.last_heartbeat),
    registeredAt: new Date(row.registered_at)
  };
}

function mapAlert(row: QueryResultRow): Alert {
  const createdAt = new Date(row.created_at || Date.now());
  return {
    id: row.id,
    txHash: row.tx_hash ?? '0x...',
    protocol: row.protocol ?? null,
    type: row.verification_type ?? null,
    gasSaved: row.gas_saved ?? null,
    status: row.status ?? null,
    timestamp: createdAt.toISOString(),
    createdAt
  };
}

async function ensureSchema() {
  const pool = getPool();
  if (!pool) return;

  if (!globalStore.breachResponseSchemaReady) {
    globalStore.breachResponseSchemaReady = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS sentinel_nodes (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          address TEXT NOT NULL UNIQUE,
          owner TEXT,
          status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'PAUSED', 'OFFLINE')),
          latency TEXT NOT NULL DEFAULT '6.4ms',
          events INTEGER NOT NULL DEFAULT 0,
          last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS telemetry_logs (
          id TEXT PRIMARY KEY,
          text TEXT,
          level TEXT,
          tx_hash TEXT,
          protocol TEXT,
          verification_type TEXT,
          gas_saved TEXT,
          status TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      // Migration: add owner column if it doesn't exist yet
      await pool.query(`ALTER TABLE sentinel_nodes ADD COLUMN IF NOT EXISTS owner TEXT`);

      const count = await pool.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM sentinel_nodes');
      if (Number(count.rows[0]?.count ?? 0) === 0) {
        for (const node of seedNodes) {
          await pool.query(
            `INSERT INTO sentinel_nodes (id, name, address, owner, status, latency, events, last_heartbeat, registered_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (address) DO NOTHING`,
            [node.id, node.name, node.address, node.owner, node.status, node.latency, node.events, node.lastHeartbeat, node.registeredAt]
          );
        }
      }
    })();
  }

  await globalStore.breachResponseSchemaReady;
}

function postgresCode(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: unknown }).code)
    : undefined;
}

export async function recordTelemetryLog(data: {
  text?: string;
  level?: string;
  txHash?: string;
  protocol?: string;
  type?: string;
  gasSaved?: string;
  status?: string;
}) {
  const pool = getPool();
  if (!pool) return;

  await ensureSchema();
  await pool.query(
    `INSERT INTO telemetry_logs (id, text, level, tx_hash, protocol, verification_type, gas_saved, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      randomUUID(),
      data.text ?? null,
      data.level ?? null,
      data.txHash ?? null,
      data.protocol ?? null,
      data.type ?? null,
      data.gasSaved ?? null,
      data.status ?? null
    ]
  );
}

export const prisma = {
  sentinelNode: {
    async findMany(options?: { orderBy?: { registeredAt?: 'asc' | 'desc' }; where?: { owner?: string } }) {
      const direction = options?.orderBy?.registeredAt ?? 'desc';
      const ownerFilter = options?.where?.owner;
      const pool = getPool();

      if (pool) {
        await ensureSchema();
        const query = ownerFilter
          ? `SELECT * FROM sentinel_nodes WHERE LOWER(owner) = LOWER($1) ORDER BY registered_at ${direction === 'asc' ? 'ASC' : 'DESC'}`
          : `SELECT * FROM sentinel_nodes ORDER BY registered_at ${direction === 'asc' ? 'ASC' : 'DESC'}`;
        const params = ownerFilter ? [ownerFilter] : [];
        const result = await pool.query(query, params);
        return result.rows.map(mapNode);
      }

      return [...getMemoryStore().sentinelNodes]
        .filter((n) => !ownerFilter || n.owner?.toLowerCase() === ownerFilter.toLowerCase())
        .sort(
        (a, b) => direction === 'desc'
          ? b.registeredAt.getTime() - a.registeredAt.getTime()
          : a.registeredAt.getTime() - b.registeredAt.getTime()
      );
    },

    async create({ data }: { data: SentinelCreateInput }) {
      const pool = getPool();
      const node = createSentinelNode(data);

      if (pool) {
        await ensureSchema();
        try {
          const result = await pool.query(
            `INSERT INTO sentinel_nodes (id, name, address, owner, status, latency, events, last_heartbeat, registered_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [node.id, node.name, node.address, node.owner, node.status, node.latency, node.events, node.lastHeartbeat, node.registeredAt]
          );
          return mapNode(result.rows[0]);
        } catch (error) {
          if (postgresCode(error) === '23505') {
            const duplicate = new Error('Sentinel already registered') as Error & { code: string };
            duplicate.code = 'P2002';
            throw duplicate;
          }
          throw error;
        }
      }

      const store = getMemoryStore();
      const exists = store.sentinelNodes.some(
        (item) => item.address.toLowerCase() === data.address.toLowerCase()
      );

      if (exists) {
        const error = new Error('Sentinel already registered') as Error & { code: string };
        error.code = 'P2002';
        throw error;
      }

      store.sentinelNodes.unshift(node);
      return node;
    },

    async findUnique({ where }: { where: { id?: string; address?: string } }) {
      const pool = getPool();

      if (pool) {
        await ensureSchema();
        const result = where.id
          ? await pool.query('SELECT * FROM sentinel_nodes WHERE id = $1 LIMIT 1', [where.id])
          : await pool.query('SELECT * FROM sentinel_nodes WHERE LOWER(address) = LOWER($1) LIMIT 1', [where.address]);
        return result.rows[0] ? mapNode(result.rows[0]) : null;
      }

      return getMemoryStore().sentinelNodes.find((node) => {
        if (where.id) return node.id === where.id;
        if (where.address) return node.address.toLowerCase() === where.address.toLowerCase();
        return false;
      }) ?? null;
    },

    async update({ where, data }: { where: { id: string }; data: SentinelUpdateInput }) {
      const pool = getPool();

      if (pool) {
        await ensureSchema();
        const existing = await this.findUnique({ where });
        if (!existing) {
          throw new Error('Sentinel node not found');
        }

        const merged = { ...existing, ...data };
        const result = await pool.query(
          `UPDATE sentinel_nodes
           SET name = $2, address = $3, owner = $4, status = $5, latency = $6, events = $7, last_heartbeat = $8
           WHERE id = $1
           RETURNING *`,
          [where.id, merged.name, merged.address, merged.owner, merged.status, merged.latency, merged.events, merged.lastHeartbeat]
        );
        return mapNode(result.rows[0]);
      }

      const store = getMemoryStore();
      const node = store.sentinelNodes.find((item) => item.id === where.id);

      if (!node) {
        throw new Error('Sentinel node not found');
      }

      Object.assign(node, data);
      return node;
    },

    async upsert({
      where,
      update,
      create
    }: {
      where: { address: string };
      update: SentinelUpdateInput;
      create: SentinelCreateInput;
    }) {
      const existing = await this.findUnique({ where });

      if (existing) {
        return this.update({ where: { id: existing.id }, data: update });
      }

      return this.create({ data: create });
    },

    async updateMany({
      where,
      data
    }: {
      where: { address?: { contains?: string } };
      data: { events?: { increment?: number } };
    }) {
      const contains = where?.address?.contains;
      const increment = data?.events?.increment ?? 0;
      const pool = getPool();

      if (pool) {
        await ensureSchema();
        const query = contains
          ? `UPDATE sentinel_nodes SET events = events + $1 WHERE LOWER(address) LIKE LOWER($2)`
          : `UPDATE sentinel_nodes SET events = events + $1`;
        const params = contains ? [increment, `%${contains}%`] : [increment];
        const result = await pool.query(query, params);
        return { count: result.rowCount ?? 0 };
      }

      let count = 0;
      for (const node of getMemoryStore().sentinelNodes) {
        if (!contains || node.address.toLowerCase().includes(contains.toLowerCase())) {
          node.events += increment;
          count++;
        }
      }
      return { count };
    }
  },

  alert: {
    async findMany(options?: { orderBy?: { createdAt?: 'asc' | 'desc' }; take?: number }) {
      const direction = options?.orderBy?.createdAt ?? 'desc';
      const limit = options?.take ?? 100;
      const pool = getPool();

      if (pool) {
        await ensureSchema();
        const result = await pool.query(
          `SELECT * FROM telemetry_logs ORDER BY created_at ${direction === 'asc' ? 'ASC' : 'DESC'} LIMIT $1`,
          [limit]
        );
        return result.rows.map(mapAlert);
      }

      const sorted = [...getMemoryStore().alerts].sort((a, b) =>
        direction === 'desc'
          ? b.createdAt.getTime() - a.createdAt.getTime()
          : a.createdAt.getTime() - b.createdAt.getTime()
      );
      return sorted.slice(0, limit);
    },

    async create({ data }: { data: AlertCreateInput }) {
      const id = randomUUID();
      const createdAt = new Date();
      const pool = getPool();

      if (pool) {
        await ensureSchema();
        const result = await pool.query(
          `INSERT INTO telemetry_logs (id, tx_hash, protocol, verification_type, gas_saved, status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [id, data.txHash ?? null, data.protocol ?? null, data.type ?? null, data.gasSaved ?? null, data.status ?? null, createdAt]
        );
        return mapAlert(result.rows[0]);
      }

      const alert: Alert = {
        id,
        txHash: data.txHash ?? '0x...',
        protocol: data.protocol ?? null,
        type: data.type ?? null,
        gasSaved: data.gasSaved ?? null,
        status: data.status ?? null,
        timestamp: createdAt.toISOString(),
        createdAt
      };
      getMemoryStore().alerts.unshift(alert);
      return alert;
    }
  }
};
