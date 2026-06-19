-- =============================================================
-- Migración: tabla pod_configs para persistir diseño de PODs
-- Ejecutar en Supabase Dashboard → SQL Editor → New Query
-- =============================================================

-- 1. Crear tabla
CREATE TABLE IF NOT EXISTS pod_configs (
  id text PRIMARY KEY DEFAULT 'current',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now()
);

-- 2. Habilitar Row Level Security
ALTER TABLE pod_configs ENABLE ROW LEVEL SECURITY;

-- 3. Políticas: cualquier usuario autenticado puede leer y escribir
CREATE POLICY "Authenticated can read pod_configs"
  ON pod_configs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert pod_configs"
  ON pod_configs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update pod_configs"
  ON pod_configs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. Insertar fila inicial vacía
INSERT INTO pod_configs (id, config)
VALUES ('current', '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;
