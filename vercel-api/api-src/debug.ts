import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './utils/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { data, error } = await supabase.from('licenses').select('count').limit(1);
    const sbUrl = process.env.SUPABASE_URL || '';
    const hasServiceKey = !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY);
    
    res.json({
      success: true,
      env: {
        supabaseUrlPrefix: sbUrl ? sbUrl.substring(0, 20) + '...' : 'MISSING',
        hasServiceKey,
        adminSecretSet: !!process.env.ADMIN_SECRET
      },
      dbTest: {
        success: !error,
        error: error ? error.message : null
      }
    });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
}
