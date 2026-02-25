import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'

async function safeFetchJson(url: string, init?: RequestInit) {
  try {
    const res = await fetch(url, init)
    const text = await res.text()
    try {
      return { status: res.status, body: JSON.parse(text) }
    } catch (e) {
      return { status: res.status, body: text }
    }
  } catch (error: any) {
    return { status: 0, error: String(error?.message || error) }
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const origin = new URL(request.url).origin
    const headers: Record<string, string> = {}
    const auth = request.headers.get('authorization')
    if (auth) headers['authorization'] = auth

    const [check, daily, status] = await Promise.all([
      safeFetchJson(`${origin}/api/drivers/check-settlement-status`, { headers }),
      safeFetchJson(`${origin}/api/driver/settlement/daily`, { headers }),
      safeFetchJson(`${origin}/api/driver/settlement/status`, { headers }),
    ])

    return NextResponse.json({
      meta: { requestedBy: session.user.id, origin },
      drivers_check: check,
      daily_settlement: daily,
      status_settlement: status,
    })
  } catch (error) {
    console.error('[debug/compare-settlement-sources] error', error)
    return NextResponse.json({ error: 'Failed to compare endpoints' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
