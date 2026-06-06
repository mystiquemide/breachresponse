import { EventEmitter } from 'events';

// Create a singleton EventEmitter to use across the Next.js dev server.
// In a true serverless environment, this would be replaced with Redis Pub/Sub,
// but for our VC wow-factor demo, this gives us true 0ms latency SSE.

const globalForEvents = globalThis as unknown as {
  sseEmitter: EventEmitter | undefined;
};

export const sseEmitter = globalForEvents.sseEmitter ?? new EventEmitter();

if (process.env.NODE_ENV !== 'production') {
  globalForEvents.sseEmitter = sseEmitter;
}
