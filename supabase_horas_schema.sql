-- ============================================================
-- CONTROLE DE HORAS TÉCNICAS — HXG CS
-- Executar no Supabase SQL Editor
-- ============================================================

-- 1. SERVIÇOS / TIPOS DE SERVIÇO
CREATE TABLE IF NOT EXISTS servicos_cs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL,
  descricao TEXT NOT NULL,
  tempo_estimado_hrs DECIMAL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO servicos_cs (codigo, descricao, tempo_estimado_hrs) VALUES
  ('inspection',            'Inspection',            2),
  ('standard_maintenance',  'Standard Maintenance',  4),
  ('extended_maintenance',  'Extended Maintenance',  8)
ON CONFLICT (codigo) DO NOTHING;

-- 2. APONTAMENTOS
CREATE TABLE IF NOT EXISTS apontamentos_cs (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nr_os                  TEXT NOT NULL,
  tecnico_id             TEXT NOT NULL,
  tecnico_nome           TEXT NOT NULL,
  tecnico_email          TEXT NOT NULL,
  servico_id             UUID REFERENCES servicos_cs(id),
  servico_codigo         TEXT NOT NULL,
  servico_descricao      TEXT NOT NULL,
  inicio                 TIMESTAMPTZ NOT NULL,
  fim                    TIMESTAMPTZ,
  tempo_produtivo_minutos INTEGER,
  tempo_pausa_minutos    INTEGER DEFAULT 0,
  observacao_inicial     TEXT,
  observacao_final       TEXT,
  status                 TEXT DEFAULT 'em_andamento',  -- em_andamento | pausado | finalizado
  deleted_at             TIMESTAMPTZ,
  created_at             TIMESTAMPTZ DEFAULT now(),
  updated_at             TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_apontamentos_tecnico  ON apontamentos_cs(tecnico_id);
CREATE INDEX IF NOT EXISTS idx_apontamentos_nr_os    ON apontamentos_cs(nr_os);
CREATE INDEX IF NOT EXISTS idx_apontamentos_status   ON apontamentos_cs(status);
CREATE INDEX IF NOT EXISTS idx_apontamentos_inicio   ON apontamentos_cs(inicio);

-- 3. PAUSAS
CREATE TABLE IF NOT EXISTS apontamento_pausas_cs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apontamento_id  UUID REFERENCES apontamentos_cs(id),
  inicio_pausa    TIMESTAMPTZ NOT NULL,
  fim_pausa       TIMESTAMPTZ,
  motivo          TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pausas_apontamento ON apontamento_pausas_cs(apontamento_id);

-- 4. EVENTOS DE AUDITORIA
CREATE TABLE IF NOT EXISTS apontamento_eventos_cs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apontamento_id  UUID REFERENCES apontamentos_cs(id),
  evento          TEXT NOT NULL,  -- criacao | inicio | pausa | retomada | finalizacao | exclusao
  usuario_id      TEXT,
  usuario_nome    TEXT,
  usuario_email   TEXT,
  data_hora       TIMESTAMPTZ DEFAULT now(),
  ip              TEXT,
  navegador       TEXT,
  dados_extra     JSONB
);

CREATE INDEX IF NOT EXISTS idx_eventos_apontamento ON apontamento_eventos_cs(apontamento_id);
CREATE INDEX IF NOT EXISTS idx_eventos_data        ON apontamento_eventos_cs(data_hora);

-- 5. BASE ADMINISTRATIVA (importação da planilha OS)
CREATE TABLE IF NOT EXISTS base_administrativa_cs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nr_os            TEXT UNIQUE NOT NULL,
  emp              TEXT,
  item             TEXT,
  descricao        TEXT,
  nr_serie         TEXT,
  cod_cliente      TEXT,
  razao_social     TEXT,
  tipo             INTEGER,
  tipo_os          TEXT,
  dt_os            TIMESTAMPTZ,
  encerramento     TIMESTAMPTZ,
  valor            DECIMAL DEFAULT 0,
  situacao         TEXT,
  estagio          TEXT,
  ult_estagio      TEXT,
  importado_em     TIMESTAMPTZ DEFAULT now(),
  importado_por_nome TEXT
);

CREATE INDEX IF NOT EXISTS idx_base_adm_nr_os    ON base_administrativa_cs(nr_os);
CREATE INDEX IF NOT EXISTS idx_base_adm_situacao ON base_administrativa_cs(situacao);

-- 6. PERMISSÕES (anon pode fazer tudo - RLS desabilitado conforme padrão do projeto)
ALTER TABLE servicos_cs           DISABLE ROW LEVEL SECURITY;
ALTER TABLE apontamentos_cs       DISABLE ROW LEVEL SECURITY;
ALTER TABLE apontamento_pausas_cs DISABLE ROW LEVEL SECURITY;
ALTER TABLE apontamento_eventos_cs DISABLE ROW LEVEL SECURITY;
ALTER TABLE base_administrativa_cs DISABLE ROW LEVEL SECURITY;

GRANT ALL ON servicos_cs            TO anon;
GRANT ALL ON apontamentos_cs        TO anon;
GRANT ALL ON apontamento_pausas_cs  TO anon;
GRANT ALL ON apontamento_eventos_cs TO anon;
GRANT ALL ON base_administrativa_cs TO anon;
