-- =============================================================
-- Migración v2: tabla pod_config_versions para historial de versiones
-- Ejecutar en Supabase Dashboard → SQL Editor → New Query
-- =============================================================

CREATE TABLE IF NOT EXISTS pod_config_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pod_config_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read versions"
  ON pod_config_versions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert versions"
  ON pod_config_versions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can delete versions"
  ON pod_config_versions FOR DELETE TO authenticated USING (true);
