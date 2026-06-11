import { NextResponse } from 'next/server';
import { sseEmitter } from '@/lib/eventEmitter';
import { recordTelemetryLog } from '@/lib/db';
import { publishTelemetryEvent } from '@/lib/telemetry';
import { isAuthorizedIngest } from '@/lib/ingestAuth';

export const runtime = 'nodejs';

const MAX_FIELD_LENGTH = 2000;

type AgentLogPayload = {
  text?: string;
  level?: string;
  txHash?: string;
  protocol?: string;
  type?: string;
  gasSaved?: string;
  status?: string;
};

function withinLimits(body: AgentLogPayload): boolean {
  return Object.values(body).every(
    (value) =>
      value === undefined || value === null || (typeof value === 'string' && value.length <= MAX_FIELD_LENGTH)
  );
}

export async function POST(request: Request) {
  if (!isAuthorizedIngest(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = (await request.json()) as AgentLogPayload;

    if (typeof body !== 'object' || body === null || !withinLimits(body)) {
      return NextResponse.json({ success: false, error: 'Invalid log payload' }, { status: 400 });
    }

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
