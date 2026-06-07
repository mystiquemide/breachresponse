import { EventEmitter } from 'events';

// Singleton EventEmitter for local SSE delivery. Production deployments should
// replace this with Redis Pub/Sub or another durable event bus.
const globalForEvents = globalThis as unknown as {
  sseEmitter: EventEmitter | undefined;
};

export const sseEmitter = globalForEvents.sseEmitter ?? new EventEmitter();

if (process.env.NODE_ENV !== 'production') {
  globalForEvents.sseEmitter = sseEmitter;
}
