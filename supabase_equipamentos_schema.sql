-- Base de equipamentos (planilha fixa)
-- Coluna A da planilha = referencia (chave primária)
CREATE TABLE IF NOT EXISTS base_equipamentos_cs (
  referencia   TEXT PRIMARY KEY,
  familia      TEXT,
  descricao    TEXT,
  fabricante   TEXT,
  modelo       TEXT,
  extra        JSONB,          -- colunas adicionais da planilha
  created_at   TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE base_equipamentos_cs DISABLE ROW LEVEL SECURITY;
GRANT ALL ON base_equipamentos_cs TO anon;

-- Adicionar campo item na base administrativa (Coluna B da planilha de OS)
-- item é a referência do equipamento — liga base_administrativa_cs → base_equipamentos_cs
ALTER TABLE base_administrativa_cs
  ADD COLUMN IF NOT EXISTS item TEXT;

-- Índices para a correlação
CREATE INDEX IF NOT EXISTS idx_base_adm_item     ON base_administrativa_cs(item);
CREATE INDEX IF NOT EXISTS idx_base_equip_ref    ON base_equipamentos_cs(referencia);
CREATE INDEX IF NOT EXISTS idx_base_equip_familia ON base_equipamentos_cs(familia);
