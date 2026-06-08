import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { address, name } = body;

    const node = await prisma.sentinelNode.upsert({
      where: { address },
      update: {
        lastHeartbeat: new Date(),
        status: 'ACTIVE'
      },
      create: {
        address,
        name: name || 'Sentinel Node',
        status: 'ACTIVE',
        latency: '8ms'
      }
    });

    return NextResponse.json({ success: true, node });
  } catch (error) {
    console.error("Heartbeat Error:", error);
    return NextResponse.json({ success: false, error: 'Failed to record heartbeat' }, { status: 400 });
  }
}
