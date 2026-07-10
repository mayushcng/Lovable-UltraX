-- =============================================
-- Lovable UltraX — Security Database Schema
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. Extension Settings (for kill switch)
CREATE TABLE IF NOT EXISTS extension_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default settings
INSERT INTO extension_settings (key, value)
VALUES 
  ('extension_disabled', 'false'),
  ('extension_disabled_message', '')
ON CONFLICT (key) DO NOTHING;

-- 2. Add new columns to license_devices for heartbeat tracking
-- (Only add if they don't exist — safe to re-run)
DO $$
BEGIN
  -- hw_fingerprint
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'license_devices' AND column_name = 'hw_fingerprint') THEN
    ALTER TABLE license_devices ADD COLUMN hw_fingerprint TEXT DEFAULT '';
  END IF;
  
  -- composite_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'license_devices' AND column_name = 'composite_id') THEN
    ALTER TABLE license_devices ADD COLUMN composite_id TEXT DEFAULT '';
  END IF;
  
  -- is_online
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'license_devices' AND column_name = 'is_online') THEN
    ALTER TABLE license_devices ADD COLUMN is_online BOOLEAN DEFAULT false;
  END IF;
  
  -- status (active/idle/offline)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'license_devices' AND column_name = 'status') THEN
    ALTER TABLE license_devices ADD COLUMN status TEXT DEFAULT 'offline';
  END IF;
  
  -- extension_version
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'license_devices' AND column_name = 'extension_version') THEN
    ALTER TABLE license_devices ADD COLUMN extension_version TEXT DEFAULT '';
  END IF;
  
  -- os_platform
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'license_devices' AND column_name = 'os_platform') THEN
    ALTER TABLE license_devices ADD COLUMN os_platform TEXT DEFAULT '';
  END IF;
  
  -- current_project_url
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'license_devices' AND column_name = 'current_project_url') THEN
    ALTER TABLE license_devices ADD COLUMN current_project_url TEXT DEFAULT '';
  END IF;

  -- first_seen_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'license_devices' AND column_name = 'first_seen_at') THEN
    ALTER TABLE license_devices ADD COLUMN first_seen_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- 3. Security Events (tamper reporting)
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT DEFAULT '',
  license_key TEXT DEFAULT '',
  event_type TEXT DEFAULT '',
  tamper_count INTEGER DEFAULT 0,
  ip_address TEXT DEFAULT '',
  user_agent TEXT DEFAULT '',
  page_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create index for faster heartbeat queries
CREATE INDEX IF NOT EXISTS idx_license_devices_last_seen 
  ON license_devices (last_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_license_devices_composite 
  ON license_devices (composite_id);

CREATE INDEX IF NOT EXISTS idx_security_events_device 
  ON security_events (device_id, created_at DESC);

-- 5. Enable RLS on new tables (Supabase best practice)
ALTER TABLE extension_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (admin dashboard uses service key)
CREATE POLICY "Service role full access to extension_settings"
  ON extension_settings FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access to security_events"
  ON security_events FOR ALL
  USING (true)
  WITH CHECK (true);
