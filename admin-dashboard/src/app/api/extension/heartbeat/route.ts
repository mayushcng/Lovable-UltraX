import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase';

/**
 * POST /api/extension/heartbeat
 * 
 * Called by the extension every 2 minutes to:
 * 1. Report device is alive (updates last_heartbeat_at, is_online)
 * 2. Check if the session is still valid
 * 3. Check for per-user kill signals
 * 4. Return any admin messages
 *
 * Request body:
 * {
 *   session_id: string,
 *   device_id: string,
 *   hw_fingerprint: string,
 *   composite_id: string,
 *   license_key: string,
 *   status: "active" | "idle" | "offline",
 *   extension_version: string,
 *   tab_url?: string,
 *   os_platform?: string,
 *   credits_used_session?: number
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      session_id,
      device_id,
      hw_fingerprint,
      composite_id,
      license_key,
      status = 'active',
      extension_version = '',
      tab_url = '',
      os_platform = '',
      credits_used_session = 0,
    } = body;

    if (!session_id && !license_key) {
      return NextResponse.json({ valid: false, message: 'No session or license key.' });
    }

    const supabase = getSupabaseAdmin();

    // Find the license
    let licenseId: string | null = null;
    let licenseStatus: string = '';

    if (license_key) {
      // Look up by license key hash
      const { data: licenses } = await supabase
        .from('licenses')
        .select('id, status, max_devices')
        .limit(50);

      if (licenses) {
        // Try to find matching license (keys are hashed in DB)
        // We need to match by session_id from license_devices
        const { data: deviceRecord } = await supabase
          .from('license_devices')
          .select('license_id, licenses(id, status, max_devices)')
          .eq('device_id', device_id || composite_id)
          .limit(1)
          .maybeSingle();

        if (deviceRecord && deviceRecord.license_id) {
          licenseId = deviceRecord.license_id;
          licenseStatus = (deviceRecord as any).licenses?.status || '';
        }
      }
    }

    // Fallback: find by device_id in license_devices
    if (!licenseId && (device_id || composite_id)) {
      const { data: deviceRecord } = await supabase
        .from('license_devices')
        .select('license_id, licenses(id, status)')
        .or(`device_id.eq.${device_id || ''},device_id.eq.${composite_id || ''}`)
        .limit(1)
        .maybeSingle();

      if (deviceRecord) {
        licenseId = deviceRecord.license_id;
        licenseStatus = (deviceRecord as any).licenses?.status || '';
      }
    }

    // Check for kill signals
    if (licenseStatus === 'suspended' || licenseStatus === 'revoked') {
      return NextResponse.json({
        valid: false,
        killed: true,
        message: licenseStatus === 'suspended'
          ? 'Your license has been suspended. Contact support.'
          : 'Your license has been revoked.',
        action: 'logout',
      });
    }

    // Update heartbeat in license_devices
    if (licenseId && (device_id || composite_id)) {
      const updateData: any = {
        last_seen_at: new Date().toISOString(),
        is_online: status !== 'offline',
        status: status,
      };

      if (extension_version) updateData.extension_version = extension_version;
      if (os_platform) updateData.os_platform = os_platform;
      if (tab_url) updateData.current_project_url = tab_url;

      // Try to get client IP
      const forwarded = request.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || '';
      if (ip) updateData.ip_address = ip;

      await supabase
        .from('license_devices')
        .update(updateData)
        .eq('license_id', licenseId)
        .or(`device_id.eq.${device_id || ''},device_id.eq.${composite_id || ''}`);
    }

    // Check global disable
    const { data: settings } = await supabase
      .from('extension_settings')
      .select('key, value')
      .eq('key', 'extension_disabled')
      .maybeSingle();

    if (settings && (settings.value === 'true' || settings.value === '1')) {
      return NextResponse.json({
        valid: false,
        killed: true,
        message: 'Extension has been disabled by administrator.',
        action: 'lock',
      });
    }

    return NextResponse.json({
      valid: true,
      message: 'ok',
      server_time: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[Heartbeat Error]:', err);
    // Don't kill the extension on server errors
    return NextResponse.json({ valid: true, message: 'ok' });
  }
}
