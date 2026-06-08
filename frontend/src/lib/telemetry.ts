export type TelemetryEvent = {
  id: string;
  type: 'LOG' | 'ALERT' | 'heartbeat' | 'system';
  timestamp: string;
  data?: unknown;
  message?: string;
};

const telemetryKey = 'breachresponse:telemetry';
const maxTelemetryEvents = 200;

const globalTelemetry = globalThis as unknown as {
  breachResponseTelemetryEvents?: TelemetryEvent[];
};

type UpstashResponse<T> = {
  result?: T;
  error?: string;
};

function hasRedisEnv() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

async function redisCommand<T>(command: unknown[]) {
  if (!hasRedisEnv()) return undefined;

  const response = await fetch(process.env.UPSTASH_REDIS_REST_URL!, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(command),
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`Upstash command failed with HTTP ${response.status}`);
  }

  const body = (await response.json()) as UpstashResponse<T>;
  if (body.error) {
    throw new Error(body.error);
  }

  return body.result;
}

function getMemoryEvents() {
  if (!globalTelemetry.breachResponseTelemetryEvents) {
    globalTelemetry.breachResponseTelemetryEvents = [];
  }

  return globalTelemetry.breachResponseTelemetryEvents;
}

export async function publishTelemetryEvent(event: Omit<TelemetryEvent, 'id'>) {
  const payload: TelemetryEvent = {
    id: crypto.randomUUID(),
    ...event
  };

  if (hasRedisEnv()) {
    await redisCommand<number>(['LPUSH', telemetryKey, JSON.stringify(payload)]);
    await redisCommand<string>(['LTRIM', telemetryKey, 0, maxTelemetryEvents - 1]);
    return payload;
  }

  const events = getMemoryEvents();
  events.unshift(payload);
  events.splice(maxTelemetryEvents);
  return payload;
}

export async function getRecentTelemetryEvents(limit = 50) {
  if (hasRedisEnv()) {
    const rawEvents = await redisCommand<string[]>(['LRANGE', telemetryKey, 0, Math.max(0, limit - 1)]);
    return (rawEvents ?? [])
      .map((item) => {
        try {
          return JSON.parse(item) as TelemetryEvent;
        } catch {
          return undefined;
        }
      })
      .filter((item): item is TelemetryEvent => Boolean(item))
      .reverse();
  }

  return [...getMemoryEvents()].slice(0, limit).reverse();
}
