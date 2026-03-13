import { NextRequest, NextResponse } from 'next/server'
import { runFullSync } from '@/lib/sync'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('x-sync-secret')
  if (authHeader !== process.env.SYNC_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const results = await runFullSync()
    return NextResponse.json({ success: true, results })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
