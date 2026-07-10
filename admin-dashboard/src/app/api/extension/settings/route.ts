import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase';

/**
 * GET /api/extension/settings
 * 
 * Public endpoint (no auth required) for the extension to poll.
 * Returns global extension disable state and any admin messages.
 * The kill-switch.js content script polls this every 3 seconds.
 */
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    // Check for global extension disable setting
    // Try to read from a 'settings' table, or from extension_settings
    const { data, error } = await supabase
      .from('extension_settings')
      .select('key, value')
      .in('key', ['extension_disabled', 'extension_disabled_message'])
      .limit(10);

    if (error) {
      // Table might not exist yet — return safe defaults
      return NextResponse.json({
        extension_disabled: false,
        extension_disabled_message: '',
      });
    }

    const settings: Record<string, string> = {};
    if (data) {
      data.forEach((row: any) => {
        if (row && row.key) settings[row.key] = row.value;
      });
    }

    return NextResponse.json({
      extension_disabled: settings.extension_disabled === 'true' || settings.extension_disabled === '1',
      extension_disabled_message: settings.extension_disabled_message || '',
    });
  } catch (err: any) {
    // On any error, don't kill the extension — return safe defaults
    return NextResponse.json({
      extension_disabled: false,
      extension_disabled_message: '',
    });
  }
}
