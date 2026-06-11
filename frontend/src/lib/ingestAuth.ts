import { timingSafeEqual } from 'crypto';

/**
 * Authorization guard for agent-only telemetry endpoints (log ingest, node
 * heartbeat). These are written to by the sentinel agent, never by the browser.
 *
 * Behaviour is opt-in and backwards compatible:
 *   - If INGEST_TOKEN is not configured, requests are allowed (existing setups
 *     keep working with no change).
 *   - If INGEST_TOKEN is set, callers must present a matching
 *     `Authorization: Bearer <token>` header or they are rejected.
 *
 * Set the same INGEST_TOKEN on the Next.js deployment and the agent to lock
 * these endpoints down.
 */
export function isAuthorizedIngest(request: Request): boolean {
  const expected = process.env.INGEST_TOKEN;
  if (!expected) return true;

  const header = request.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';
  if (!token) return false;

  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
