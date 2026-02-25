import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

function isValidDateInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(parsed.getTime())
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: driver } = await supabaseAdmin!
      .from('drivers')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    if (!driver?.id) return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const settlementId = searchParams.get('settlement_id')
    const dateString = searchParams.get('date') || undefined

    let settlement: any = null
    if (settlementId) {
      const { data, error } = await supabaseAdmin!.from('driver_daily_settlement').select('*').eq('id', settlementId).single()
      if (error || !data) return NextResponse.json({ error: 'Settlement not found' }, { status: 404 })
      if (data.driver_id !== driver.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      settlement = data
    } else if (dateString) {
      if (!isValidDateInput(dateString)) return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
      const { data, error } = await supabaseAdmin!.from('driver_daily_settlement').select('*').eq('driver_id', driver.id).eq('settlement_date', dateString).limit(1).single()
      if (error || !data) return NextResponse.json({ error: 'Settlement not found for date' }, { status: 404 })
      settlement = data
    } else {
      return NextResponse.json({ error: 'Provide settlement_id or date' }, { status: 400 })
    }

    // If settlement has a linked log, use it to fetch ride ids
    let rides: any[] = []
    if (settlement.log_id) {
      const { data: log } = await supabaseAdmin!.from('driver_daily_rides_log').select('ride_ids').eq('id', settlement.log_id).single()
      const rideIds: string[] = (log?.ride_ids) || []
      if (Array.isArray(rideIds) && rideIds.length > 0) {
        const { data: rideRows, error: ridesError } = await supabaseAdmin!
          .from('rides')
          .select('id, fare_amount, platform_fee, driver_earnings, status, pickup_zone, destination_zone, completed_at, created_at')
          .in('id', rideIds)
          .order('completed_at', { ascending: true })
        if (ridesError) console.error('Error fetching rides by ids', ridesError)
        rides = rideRows || []
      }
    } else {
      // fallback: fetch rides by settlement_date
      const start = new Date(`${settlement.settlement_date}T00:00:00.000Z`).toISOString()
      const end = new Date(new Date(`${settlement.settlement_date}T00:00:00.000Z`).getTime() + 24 * 3600 * 1000).toISOString()
      const { data: rideRows, error: ridesError } = await supabaseAdmin!
        .from('rides')
        .select('id, fare_amount, platform_fee, driver_earnings, status, pickup_zone, destination_zone, completed_at, created_at')
        .eq('driver_id', driver.id)
        .in('status', ['accepted', 'in_progress', 'completed'])
        .gte('updated_at', start)
        .lt('updated_at', end)
        .order('completed_at', { ascending: true })
      if (ridesError) console.error('Error fetching rides by date', ridesError)
      rides = rideRows || []
    }

    return NextResponse.json({ settlement, rides })
  } catch (error) {
    console.error('[SettlementRides] error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
