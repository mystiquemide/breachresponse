import { NextResponse } from 'next/server';
import { sseEmitter } from '@/lib/eventEmitter';
import { recordTelemetryLog } from '@/lib/db';
import { publishTelemetryEvent } from '@/lib/telemetry';

export const runtime = 'nodejs';

type AgentLogPayload = {
  text?: string;
  level?: string;
  txHash?: string;
  protocol?: string;
  type?: string;
  gasSaved?: string;
  status?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AgentLogPayload;
    const timestamp = new Date().toISOString();

    if (body.text) {
      const event = await publishTelemetryEvent({
        type: 'LOG',
        timestamp,
        data: {
          text: body.text,
          level: body.level || 'INFO',
        },
      });

      sseEmitter.emit('log', event);
      await recordTelemetryLog(body);

      return NextResponse.json({ success: true });
    }

    if (body.txHash && body.protocol && body.type && body.status) {
      const eventType = body.status === 'MITIGATED' ? 'ALERT' : 'LOG';
      const isProposal = body.status === 'PROPOSED';
      const isTelemetry = eventType === 'LOG' && !isProposal;

      const event = await publishTelemetryEvent({
        type: eventType,
        timestamp,
        data: eventType === 'LOG'
          ? {
              text: isProposal
                ? `[SENTINEL] Proposal recorded for ${body.protocol}: ${body.type} (${body.gasSaved || 'pending operator approval'})`
                : `[SCAN] ${body.protocol}: ${body.type} (${body.status}, ${body.gasSaved || '0 mETH'})`,
              level: isTelemetry ? 'INFO' : 'WARN',
            }
          : {
              txHash: body.txHash,
              protocol: body.protocol,
              type: body.type,
              gasSaved: body.gasSaved || 'n/a',
              status: body.status,
            },
      });

      sseEmitter.emit('log', event);
      await recordTelemetryLog(body);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid log payload' }, { status: 400 });
  } catch (error) {
    console.error('Log ingest error:', error);
    return NextResponse.json({ success: false, error: 'Failed to ingest log' }, { status: 400 });
  }
}
