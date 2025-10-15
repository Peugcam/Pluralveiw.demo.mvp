-- ============================================
-- SCHEMA COMPLETO: api_costs com RLS
-- ============================================

-- 1. Criar tabela
CREATE TABLE IF NOT EXISTS api_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd DECIMAL(10, 6) NOT NULL DEFAULT 0,
  perspective_type TEXT,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT
);

-- 2. Criar índices
CREATE INDEX IF NOT EXISTS idx_api_costs_created_at ON api_costs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_costs_analysis_id ON api_costs(analysis_id);
CREATE INDEX IF NOT EXISTS idx_api_costs_operation_type ON api_costs(operation_type);
CREATE INDEX IF NOT EXISTS idx_api_costs_model ON api_costs(model);

-- 3. HABILITAR ROW LEVEL SECURITY
ALTER TABLE api_costs ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS RLS

-- Política: service_role pode fazer TUDO (para API backend)
-- (service_role bypassa RLS automaticamente, mas explicitamos aqui)
CREATE POLICY "Service role tem acesso total"
  ON api_costs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Política: Usuários autenticados podem VER custos das suas próprias análises
CREATE POLICY "Users podem ver custos de suas análises"
  ON api_costs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM analyses
      WHERE analyses.id = api_costs.analysis_id
      AND analyses.user_id = auth.uid()
    )
  );

-- Política: Backend (service_role) pode INSERIR custos
-- Nota: Usuários comuns NÃO podem inserir, só o backend
CREATE POLICY "Service pode inserir custos"
  ON api_costs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Política: Ninguém pode UPDATE/DELETE custos (são imutáveis)
-- Apenas service_role via política anterior

-- 5. Drop e recriar views com SECURITY INVOKER
DROP VIEW IF EXISTS api_costs_daily;
DROP VIEW IF EXISTS api_costs_summary;

-- View: Estatísticas diárias (respeita RLS)
CREATE VIEW api_costs_daily
WITH (security_invoker = true) AS
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_operations,
  SUM(total_tokens) as total_tokens,
  SUM(cost_usd) as total_cost_usd,
  COUNT(DISTINCT analysis_id) as unique_analyses,
  model,
  operation_type
FROM api_costs
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at), model, operation_type
ORDER BY date DESC;

-- View: Estatísticas gerais (respeita RLS)
CREATE VIEW api_costs_summary
WITH (security_invoker = true) AS
SELECT
  COUNT(*) as total_operations,
  SUM(total_tokens) as total_tokens,
  SUM(cost_usd) as total_cost_usd,
  AVG(cost_usd) as avg_cost_per_operation,
  COUNT(DISTINCT analysis_id) as total_analyses,
  MIN(created_at) as first_operation,
  MAX(created_at) as last_operation
FROM api_costs;

-- 6. Corrigir função update_updated_at_column (já existe no banco)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at = pg_catalog.now();
  RETURN NEW;
END;
$$;

-- 7. Function para obter custos por análise
CREATE OR REPLACE FUNCTION get_analysis_cost(p_analysis_id UUID)
RETURNS TABLE (
  total_cost_usd DECIMAL,
  total_tokens INTEGER,
  operations_count INTEGER
)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
SET search_path = public, pg_catalog
AS $$
BEGIN
  -- A função respeita RLS automaticamente
  RETURN QUERY
  SELECT
    SUM(cost_usd)::DECIMAL as total_cost_usd,
    SUM(total_tokens)::INTEGER as total_tokens,
    COUNT(*)::INTEGER as operations_count
  FROM public.api_costs
  WHERE analysis_id = p_analysis_id;
END;
$$;

-- ============================================
-- COMENTÁRIOS E EXPLICAÇÕES
-- ============================================

-- RLS HABILITADO: ✅
-- - service_role (backend API): Acesso total para inserir custos
-- - authenticated (usuários logados): Podem ver apenas custos de suas análises
-- - anon (não logados): Sem acesso (comportamento padrão)

-- SECURITY INVOKER: ✅
-- - Views e funções usam permissões do CHAMADOR
-- - Não escalam privilégios (sem SECURITY DEFINER)

-- IMUTABILIDADE: ✅
-- - Custos não podem ser editados/deletados por usuários
-- - Apenas service_role pode inserir (via backend)

-- PERFORMANCE: ✅
-- - Índice em analysis_id para JOIN rápido com policies
-- - Índices em created_at, operation_type, model para queries
