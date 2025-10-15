-- Tabela para rastrear custos de API
CREATE TABLE IF NOT EXISTS api_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Identificação da análise
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,

  -- Tipo de operação
  operation_type TEXT NOT NULL, -- 'perspective_analysis', 'filter_sources', 'validate_alignment', 'reflective_questions'

  -- Modelo usado
  model TEXT NOT NULL, -- 'gpt-3.5-turbo', 'claude-sonnet-4', etc

  -- Tokens
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,

  -- Custo (em USD)
  cost_usd DECIMAL(10, 6) NOT NULL DEFAULT 0,

  -- Metadados
  perspective_type TEXT, -- para análises de perspectivas
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,

  -- Índices para queries rápidas
  INDEX idx_api_costs_created_at (created_at DESC),
  INDEX idx_api_costs_analysis_id (analysis_id),
  INDEX idx_api_costs_operation_type (operation_type),
  INDEX idx_api_costs_model (model)
);

-- View para estatísticas diárias
CREATE OR REPLACE VIEW api_costs_daily AS
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

-- View para estatísticas gerais
CREATE OR REPLACE VIEW api_costs_summary AS
SELECT
  COUNT(*) as total_operations,
  SUM(total_tokens) as total_tokens,
  SUM(cost_usd) as total_cost_usd,
  AVG(cost_usd) as avg_cost_per_operation,
  COUNT(DISTINCT analysis_id) as total_analyses,
  MIN(created_at) as first_operation,
  MAX(created_at) as last_operation
FROM api_costs;

-- Function para obter custos por análise
CREATE OR REPLACE FUNCTION get_analysis_cost(p_analysis_id UUID)
RETURNS TABLE (
  total_cost_usd DECIMAL,
  total_tokens INTEGER,
  operations_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    SUM(cost_usd)::DECIMAL as total_cost_usd,
    SUM(total_tokens)::INTEGER as total_tokens,
    COUNT(*)::INTEGER as operations_count
  FROM api_costs
  WHERE analysis_id = p_analysis_id;
END;
$$ LANGUAGE plpgsql;
