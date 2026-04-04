import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const items = await prisma.conversation.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 50
  })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { userId, title, meta } = body ?? {}
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
  const conv = await prisma.conversation.create({
    data: { userId, title, meta }
  })
  return NextResponse.json(conv, { status: 201 })
}
