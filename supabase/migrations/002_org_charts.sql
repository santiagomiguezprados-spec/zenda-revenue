-- ── org_charts: config viva, fila única (igual que pod_configs) ─────────────
CREATE TABLE IF NOT EXISTS org_charts (
  id text PRIMARY KEY DEFAULT 'current',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,  -- { hierarchy, positions }
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE org_charts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read org_charts"
  ON org_charts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert org_charts"
  ON org_charts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update org_charts"
  ON org_charts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

INSERT INTO org_charts (id, config) VALUES ('current', '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ── org_chart_versions: versiones nombradas (igual que pod_config_versions) ─
CREATE TABLE IF NOT EXISTS org_chart_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE org_chart_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read org chart versions"
  ON org_chart_versions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert org chart versions"
  ON org_chart_versions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can delete org chart versions"
  ON org_chart_versions FOR DELETE TO authenticated USING (true);

-- ── period_closes: columna nueva para congelar el organigrama al cierre ────
ALTER TABLE period_closes ADD COLUMN IF NOT EXISTS org_chart jsonb NOT NULL DEFAULT '{}'::jsonb;
