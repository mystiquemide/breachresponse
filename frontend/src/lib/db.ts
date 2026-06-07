import { randomUUID } from 'crypto';

type SentinelStatus = 'ACTIVE' | 'PAUSED' | 'OFFLINE';

type SentinelNode = {
  id: string;
  name: string;
  address: string;
  status: SentinelStatus;
  latency: string;
  events: number;
  lastHeartbeat: Date;
  registeredAt: Date;
};

type SentinelCreateInput = Partial<Omit<SentinelNode, 'id' | 'registeredAt'>> & {
  address: string;
};

type SentinelUpdateInput = Partial<Omit<SentinelNode, 'id' | 'registeredAt'>>;

type Store = {
  sentinelNodes: SentinelNode[];
};

const globalStore = globalThis as unknown as {
  breachResponseStore?: Store;
};

const seedNodes: SentinelNode[] = [
  {
    id: 'mantleswap-sentinel',
    name: 'MantleSwap Sentinel',
    address: '0x5e8c000000000000000000000000000000001a2f',
    status: 'ACTIVE',
    latency: '6.4ms',
    events: 128,
    lastHeartbeat: new Date(),
    registeredAt: new Date('2026-01-01T00:00:00.000Z')
  },
  {
    id: 'lendx-sentinel',
    name: 'LendX Sentinel',
    address: '0x8b3f000000000000000000000000000000009c4d',
    status: 'ACTIVE',
    latency: '7.1ms',
    events: 93,
    lastHeartbeat: new Date(),
    registeredAt: new Date('2026-01-02T00:00:00.000Z')
  }
];

function getStore(): Store {
  if (!globalStore.breachResponseStore) {
    globalStore.breachResponseStore = {
      sentinelNodes: [...seedNodes]
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
    status: data.status ?? 'ACTIVE',
    latency: data.latency ?? '6.4ms',
    events: data.events ?? 0,
    lastHeartbeat: data.lastHeartbeat ?? now,
    registeredAt: now
  };
}

export const prisma = {
  sentinelNode: {
    async findMany(options?: { orderBy?: { registeredAt?: 'asc' | 'desc' } }) {
      const direction = options?.orderBy?.registeredAt ?? 'desc';
      return [...getStore().sentinelNodes].sort(
        (a, b) => direction === 'desc'
          ? b.registeredAt.getTime() - a.registeredAt.getTime()
          : a.registeredAt.getTime() - b.registeredAt.getTime()
      );
    },

    async create({ data }: { data: SentinelCreateInput }) {
      const store = getStore();
      const exists = store.sentinelNodes.some(
        (node) => node.address.toLowerCase() === data.address.toLowerCase()
      );

      if (exists) {
        const error = new Error('Sentinel already registered') as Error & { code: string };
        error.code = 'P2002';
        throw error;
      }

      const node = createSentinelNode(data);
      store.sentinelNodes.unshift(node);
      return node;
    },

    async findUnique({ where }: { where: { id?: string; address?: string } }) {
      const store = getStore();
      return store.sentinelNodes.find((node) => {
        if (where.id) return node.id === where.id;
        if (where.address) return node.address.toLowerCase() === where.address.toLowerCase();
        return false;
      }) ?? null;
    },

    async update({ where, data }: { where: { id: string }; data: SentinelUpdateInput }) {
      const store = getStore();
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
        Object.assign(existing, update);
        return existing;
      }

      return this.create({ data: create });
    }
  }
};
