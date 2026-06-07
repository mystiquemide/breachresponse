import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const nodes = await prisma.sentinelNode.findMany({
      orderBy: { registeredAt: 'desc' }
    });
    return NextResponse.json(nodes);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch sentinel nodes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.address || !body.address.startsWith('0x')) {
      return NextResponse.json({ error: 'Invalid contract address' }, { status: 400 });
    }

    const node = await prisma.sentinelNode.create({
      data: {
        name: body.name || 'Custom Sentinel',
        address: body.address,
        status: 'ACTIVE',
        latency: '6.4ms',
        events: 0
      }
    });
    return NextResponse.json(node);
  } catch (error: unknown) {
    const code = error instanceof Error && 'code' in error ? (error as { code?: string }).code : undefined;
    if (code === 'P2002') {
      return NextResponse.json({ error: 'Sentinel already registered for this address' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to register sentinel node' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: 'Missing node ID' }, { status: 400 });
    }

    const existing = await prisma.sentinelNode.findUnique({
      where: { id: body.id }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Sentinel node not found' }, { status: 404 });
    }

    const updated = await prisma.sentinelNode.update({
      where: { id: body.id },
      data: {
        status: existing.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
      }
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Failed to toggle sentinel status' }, { status: 500 });
  }
}
