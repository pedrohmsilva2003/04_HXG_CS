-- BRM: campo família de equipamento + tabela SSP por família/serviço
-- Executar no Supabase SQL Editor

ALTER TABLE apontamentos_cs
  ADD COLUMN IF NOT EXISTS familia_equipamento TEXT;

CREATE TABLE IF NOT EXISTS ssp_config_cs (
  familia        TEXT NOT NULL,
  servico_codigo TEXT NOT NULL,
  ssp_horas      NUMERIC(6,2) NOT NULL DEFAULT 0,
  updated_at     TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (familia, servico_codigo)
);

ALTER TABLE ssp_config_cs DISABLE ROW LEVEL SECURITY;
GRANT ALL ON ssp_config_cs TO anon;

-- Valores padrão extraídos dos slides BRM
INSERT INTO ssp_config_cs (familia, servico_codigo, ssp_horas) VALUES
  ('NOVA series', 'extended_maintenance', 19.0),
  ('NOVA series', 'standard_maintenance',  9.5),
  ('NOVA series', 'inspection',            2.0),
  ('High End',    'extended_maintenance', 14.5),
  ('High End',    'standard_maintenance',  7.0),
  ('High End',    'inspection',            2.0),
  ('Manual',      'extended_maintenance', 11.0),
  ('Manual',      'standard_maintenance',  5.0),
  ('Manual',      'inspection',            2.0)
ON CONFLICT (familia, servico_codigo) DO NOTHING;
