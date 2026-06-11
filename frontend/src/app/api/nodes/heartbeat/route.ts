import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isAuthorizedIngest } from '@/lib/ingestAuth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!isAuthorizedIngest(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { address, name } = body;

    if (typeof address !== 'string' || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json({ success: false, error: 'Invalid address' }, { status: 400 });
    }
    if (name !== undefined && (typeof name !== 'string' || name.length > 200)) {
      return NextResponse.json({ success: false, error: 'Invalid name' }, { status: 400 });
    }

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
