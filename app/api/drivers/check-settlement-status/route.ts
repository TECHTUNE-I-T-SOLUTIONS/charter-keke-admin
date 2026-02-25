import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find driver record by user_id
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (driverError || !driver) {
      return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
    }

    // Compute unpaid/overdue settlements
    const { data: unpaid, error: unpaidError } = await supabase
      .from('driver_daily_settlement')
      .select('id, settlement_date, total_platform_fees, settlement_status, payment_due_date')
      .eq('driver_id', driver.id)
      .in('settlement_status', ['pending', 'overdue'])
      .order('settlement_date', { ascending: false });

    if (unpaidError) {
      console.error('Error fetching settlements', unpaidError);
    }

    // Determine if driver should be forced offline
    const hasOutstanding = Array.isArray(unpaid) && unpaid.length > 0 && unpaid.some((s: any) => {
      if (!s) return false;
      return s.settlement_status !== 'paid' && (s.payment_due_date && new Date(s.payment_due_date) <= new Date() || s.settlement_status === 'overdue');
    });

    // Update driver availability accordingly
    const newStatus = hasOutstanding ? 'offline' : 'online';
    if (driver.availability_status !== newStatus) {
      await supabase.from('drivers').update({ availability_status: newStatus, updated_at: new Date().toISOString() }).eq('id', driver.id);
    }

    // Gather today's remittable rides (not yet remitted)
    const today = new Date().toISOString().slice(0, 10);
    const { data: rides, error: ridesError } = await supabase
      .from('rides')
      .select('id, fare_amount, platform_fee, completed_at, status')
      .eq('driver_id', driver.id)
      .eq('remitted', false)
      .gte('completed_at', `${today} 00:00:00`)
      .lte('completed_at', `${today} 23:59:59`)
      .order('completed_at', { ascending: true });

    if (ridesError) console.error('Error fetching rides for remittance', ridesError);

    const totalDue = (rides || []).reduce((acc: number, r: any) => acc + (Number(r.platform_fee || 0)), 0);

    return NextResponse.json({
      driver: { id: driver.id, availability_status: newStatus },
      hasOutstanding,
      settlementsDue: unpaid || [],
      ridesDueToday: rides || [],
      totalPlatformFeeDueToday: Number(totalDue.toFixed(2)),
    });
  } catch (error) {
    console.error('check-settlement-status error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
