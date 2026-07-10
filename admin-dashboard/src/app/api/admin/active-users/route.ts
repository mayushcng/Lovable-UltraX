import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase';
import jwt from 'jsonwebtoken';

function verifyAuth(request: Request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const adminSecret = process.env.ADMIN_SECRET || 'fallback_secret';
  try {
    return jwt.verify(token, adminSecret);
  } catch {
    throw new Error('Unauthorized');
  }
}

/**
 * GET /api/admin/active-users
 * 
 * Returns list of currently active users with online/offline status.
 * Uses last_seen_at from license_devices to determine status.
 *
 * Status logic:
 * - Online (green): last_seen_at < 3 minutes ago
 * - Idle (yellow): last_seen_at 3-10 minutes ago
 * - Offline (red): last_seen_at > 10 minutes ago
 */
export async function GET(request: Request) {
  try {
    verifyAuth(request);

    const supabase = getSupabaseAdmin();
    const now = new Date();

    // Fetch all device sessions with license info
    const { data: devices, error } = await supabase
      .from('license_devices')
      .select(`
        id,
        license_id,
        device_id,
        hw_fingerprint,
        last_seen_at,
        first_seen_at,
        is_online,
        status,
        ip_address,
        extension_version,
        os_platform,
        current_project_url,
        licenses (
          id,
          customer_name,
          customer_email,
          plan_name,
          status,
          max_devices
        )
      `)
      .order('last_seen_at', { ascending: false })
      .limit(200);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Process and categorize
    let totalOnline = 0;
    let totalIdle = 0;
    let totalOffline = 0;

    const users = (devices || []).map((d: any) => {
      const lastSeen = d.last_seen_at ? new Date(d.last_seen_at) : null;
      const diffMs = lastSeen ? now.getTime() - lastSeen.getTime() : Infinity;
      const diffMinutes = diffMs / 60000;

      let computedStatus: 'online' | 'idle' | 'offline';
      if (diffMinutes < 3) {
        computedStatus = 'online';
        totalOnline++;
      } else if (diffMinutes < 10) {
        computedStatus = 'idle';
        totalIdle++;
      } else {
        computedStatus = 'offline';
        totalOffline++;
      }

      const license = d.licenses || {};

      return {
        id: d.id,
        license_id: d.license_id,
        customer_name: license.customer_name || '',
        customer_email: license.customer_email || '',
        plan_name: license.plan_name || '',
        license_status: license.status || '',
        device_id: d.device_id || '',
        hw_fingerprint: d.hw_fingerprint || '',
        computed_status: computedStatus,
        last_seen_at: d.last_seen_at,
        first_seen_at: d.first_seen_at,
        ip_address: d.ip_address || '',
        extension_version: d.extension_version || '',
        os_platform: d.os_platform || '',
        current_project_url: d.current_project_url || '',
      };
    });

    return NextResponse.json({
      success: true,
      users,
      total_online: totalOnline,
      total_idle: totalIdle,
      total_offline: totalOffline,
      total: users.length,
    });
  } catch (err: any) {
    const status = err.message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
