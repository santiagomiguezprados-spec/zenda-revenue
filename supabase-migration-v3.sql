-- =============================================================
-- Migración v3: tabla clientes_maestro
-- Ejecutar en Supabase Dashboard → SQL Editor → New Query
-- =============================================================

CREATE TABLE IF NOT EXISTS clientes_maestro (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo integer UNIQUE NOT NULL,
  nombre text NOT NULL,
  estado text NOT NULL DEFAULT 'Activa' CHECK (estado IN ('Activa', 'Inactiva')),
  moneda text NOT NULL DEFAULT 'ARS' CHECK (moneda IN ('ARS', 'USD')),
  contrato text,
  fecha_vto_terminacion text,
  facturante text,
  comentario text,
  last_update text,
  porcentaje_ultima_actualizacion numeric,
  next_update text,
  limite_minimo text,
  fee_minimo text,
  escala1_limite text,
  escala1_porcentaje numeric,
  escala2_limite text,
  escala2_porcentaje numeric,
  escala3_limite text,
  escala3_porcentaje numeric,
  escala4_limite text,
  escala4_porcentaje numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE clientes_maestro ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read clientes"
  ON clientes_maestro FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert clientes"
  ON clientes_maestro FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update clientes"
  ON clientes_maestro FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can delete clientes"
  ON clientes_maestro FOR DELETE TO authenticated USING (true);
