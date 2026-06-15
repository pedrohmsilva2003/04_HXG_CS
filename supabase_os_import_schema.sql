-- Preparar base_administrativa_cs para upsert via nr_os
-- Executar no Supabase SQL Editor

-- 1. Adicionar campo ultima estagio (Coluna P da planilha de OS)
ALTER TABLE base_administrativa_cs
  ADD COLUMN IF NOT EXISTS ult_estagio TEXT;

-- 2. Garantir constraint UNIQUE em nr_os para o upsert funcionar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'base_administrativa_cs_nr_os_key'
  ) THEN
    ALTER TABLE base_administrativa_cs ADD CONSTRAINT base_administrativa_cs_nr_os_key UNIQUE (nr_os);
  END IF;
END $$;

-- 3. Mesma coisa para base_equipamentos_cs (referencia já é PK, OK)
