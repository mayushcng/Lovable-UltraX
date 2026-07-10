import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase';

/**
 * POST /api/security/tamper-report
 * 
 * Receives tampering event reports from the extension's security.js.
 * Auto-blocks the user's license after repeated tamper events.
 *
 * Request body:
 * {
 *   device_id: string,
 *   license_key: string,
 *   tampering_event: string,
 *   tamper_count: number,
 *   details: { userAgent, timestamp, url }
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      device_id = '',
      license_key = '',
      tampering_event = '',
      tamper_count = 0,
      details = {},
    } = body;

    const supabase = getSupabaseAdmin();

    // Get client IP
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || '';

    // Log the tamper event
    try {
      await supabase.from('security_events').insert({
        device_id: device_id,
        license_key: license_key,
        event_type: tampering_event,
        tamper_count: tamper_count,
        ip_address: ip,
        user_agent: details.userAgent || '',
        page_url: details.url || '',
        created_at: new Date().toISOString(),
      });
    } catch {
      // Silently ignore if table doesn't exist yet
    }

    // Auto-block: If tamper_count >= 3, suspend the license
    if (tamper_count >= 3 && device_id) {
      // Find the license associated with this device
      const { data: deviceRecord } = await supabase
        .from('license_devices')
        .select('license_id')
        .eq('device_id', device_id)
        .limit(1)
        .maybeSingle();

      if (deviceRecord && deviceRecord.license_id) {
        // Suspend the license
        await supabase
          .from('licenses')
          .update({
            status: 'suspended',
            notes: `Auto-suspended: ${tampering_event} (${tamper_count} events) at ${new Date().toISOString()}`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', deviceRecord.license_id);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    // Always return ok to not leak info
    return NextResponse.json({ ok: true });
  }
}
