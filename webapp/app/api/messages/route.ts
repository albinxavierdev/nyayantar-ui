import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const conversationId = req.nextUrl.searchParams.get('conversationId') || undefined
  if (!conversationId) return NextResponse.json({ error: 'conversationId required' }, { status: 400 })
  const items = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    take: 500
  })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { conversationId, role, content, phaseInfo } = body ?? {}
  if (!conversationId || !role || typeof content !== 'string') {
    return NextResponse.json({ error: 'conversationId, role, content required' }, { status: 400 })
  }
  const msg = await prisma.message.create({
    data: { conversationId, role, content, phaseInfo }
  })
  return NextResponse.json(msg, { status: 201 })
}
