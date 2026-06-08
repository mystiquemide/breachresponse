import { sseEmitter } from '@/lib/eventEmitter';
import { getRecentTelemetryEvents, type TelemetryEvent } from '@/lib/telemetry';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const encoder = new TextEncoder();
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let poller: ReturnType<typeof setInterval> | undefined;
  let onLog: ((payload: unknown) => void) | undefined;
  let isClosed = false;
  const sentIds = new Set<string>();

  const cleanup = () => {
    isClosed = true;
    if (heartbeat) {
      clearInterval(heartbeat);
      heartbeat = undefined;
    }
    if (poller) {
      clearInterval(poller);
      poller = undefined;
    }
    if (onLog) {
      sseEmitter.off('log', onLog);
      onLog = undefined;
    }
  };

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: unknown) => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        } catch {
          cleanup();
        }
      };

      const sendTelemetryEvent = (event: TelemetryEvent) => {
        if (sentIds.has(event.id)) return;
        sentIds.add(event.id);
        send(event);
      };

      const flushRecent = async () => {
        try {
          const events = await getRecentTelemetryEvents(50);
          events.forEach(sendTelemetryEvent);
        } catch (error) {
          console.error('Telemetry stream poll error:', error);
        }
      };

      heartbeat = setInterval(() => {
        send({
          type: 'heartbeat',
          timestamp: new Date().toISOString(),
          message: 'Sentinel telemetry stream healthy',
        });
      }, 15000);

      poller = setInterval(flushRecent, 3000);
      onLog = (payload: unknown) => send(payload);
      sseEmitter.on('log', onLog);

      send({
        type: 'system',
        timestamp: new Date().toISOString(),
        message: 'Sentinel telemetry stream connected',
      });
      await flushRecent();
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
