-- Base de equipamentos (planilha fixa) + colunas em apontamentos_cs
-- Executar no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS base_equipamentos_cs (
  referencia   TEXT PRIMARY KEY,    -- Coluna A
  descricao    TEXT,                -- Coluna B
  familia      TEXT,                -- Coluna C
  modelo       TEXT,                -- Coluna D
  clase        TEXT,                -- Coluna E
  created_at   TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE base_equipamentos_cs DISABLE ROW LEVEL SECURITY;
GRANT ALL ON base_equipamentos_cs TO anon;

-- Adicionar campo item na base administrativa (Coluna B da planilha de OS = Referencia do equipamento)
ALTER TABLE base_administrativa_cs
  ADD COLUMN IF NOT EXISTS item TEXT;

-- Adicionar familia, modelo e clase nos apontamentos para facilitar relatórios sem JOIN
ALTER TABLE apontamentos_cs
  ADD COLUMN IF NOT EXISTS familia_equipamento TEXT,
  ADD COLUMN IF NOT EXISTS modelo_equipamento  TEXT,
  ADD COLUMN IF NOT EXISTS clase_equipamento   TEXT;

-- Índices
CREATE INDEX IF NOT EXISTS idx_base_adm_item         ON base_administrativa_cs(item);
CREATE INDEX IF NOT EXISTS idx_base_equip_ref         ON base_equipamentos_cs(referencia);
CREATE INDEX IF NOT EXISTS idx_base_equip_familia     ON base_equipamentos_cs(familia);
CREATE INDEX IF NOT EXISTS idx_base_equip_clase       ON base_equipamentos_cs(clase);
CREATE INDEX IF NOT EXISTS idx_apt_familia            ON apontamentos_cs(familia_equipamento);
CREATE INDEX IF NOT EXISTS idx_apt_clase              ON apontamentos_cs(clase_equipamento);
