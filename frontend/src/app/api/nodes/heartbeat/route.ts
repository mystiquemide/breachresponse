import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { address, name } = body;

    const existing = await prisma.sentinelNode.findUnique({ where: { address } });
    const node = existing
      ? await prisma.sentinelNode.update({
          where: { id: existing.id },
          data: {
            lastHeartbeat: new Date(),
            status: 'ACTIVE',
            events: existing.events + 1
          }
        })
      : await prisma.sentinelNode.create({
          data: {
            address,
            name: name || 'Sentinel Node',
            status: 'ACTIVE',
            latency: '8ms',
            events: 1
          }
        });

    return NextResponse.json({ success: true, node });
  } catch (error) {
    console.error("Heartbeat Error:", error);
    return NextResponse.json({ success: false, error: 'Failed to record heartbeat' }, { status: 400 });
  }
}
