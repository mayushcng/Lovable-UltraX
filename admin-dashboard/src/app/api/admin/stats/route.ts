import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase';
import jwt from 'jsonwebtoken';

export async function GET(request: Request) {
  try {
    // Auth Check
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const adminSecret = process.env.ADMIN_SECRET || 'fallback_secret';

    try {
      jwt.verify(token, adminSecret);
    } catch (e) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // Run counts in parallel
    const [
      { count: totalLicenses },
      { count: activeLicenses },
      { count: suspendedLicenses },
      { count: revokedLicenses },
      { count: expiredLicenses },
      { count: deviceCount },
      { data: creditsData },
    ] = await Promise.all([
      supabase.from('licenses').select('*', { count: 'exact', head: true }),
      supabase.from('licenses').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('licenses').select('*', { count: 'exact', head: true }).eq('status', 'suspended'),
      supabase.from('licenses').select('*', { count: 'exact', head: true }).eq('status', 'revoked'),
      supabase.from('licenses').select('*', { count: 'exact', head: true }).eq('status', 'expired'),
      supabase.from('devices').select('*', { count: 'exact', head: true }),
      supabase.from('licenses').select('credits_saved'),
    ]);

    const totalCreditsSaved = creditsData?.reduce((acc, curr) => acc + (curr.credits_saved || 0), 0) || 0;

    // Count active users (heartbeat within last 3 minutes)
    let activeUsersNow = 0;
    try {
      const threeMinAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();
      const { count: onlineCount } = await supabase
        .from('license_devices')
        .select('*', { count: 'exact', head: true })
        .gte('last_seen_at', threeMinAgo);
      activeUsersNow = onlineCount || 0;
    } catch {
      // Table may not exist yet
    }

    // Get recent activity (recent licenses created)
    const { data: recentEvents } = await supabase
      .from('licenses')
      .select('id, customer_name, plan_name, created_at, status')
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      success: true,
      stats: {
        total: totalLicenses || 0,
        active: activeLicenses || 0,
        suspended: suspendedLicenses || 0,
        revoked: revokedLicenses || 0,
        expired: expiredLicenses || 0,
        devices: deviceCount || 0,
        credits_saved: totalCreditsSaved,
        active_users_now: activeUsersNow,
      },
      recentEvents: recentEvents || [],
    });
  } catch (err: any) {
    console.error('[API Stats Error]:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
