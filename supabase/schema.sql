-- PluralView MVP Database Schema
-- Execute este script no SQL Editor do Supabase

-- Tabela de análises
CREATE TABLE IF NOT EXISTS analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tabela de perspectivas
CREATE TABLE IF NOT EXISTS perspectives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- tecnica, popular, institucional, academica, conservadora, progressista
  content TEXT NOT NULL,
  sources JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tabela de perguntas reflexivas
CREATE TABLE IF NOT EXISTS reflective_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tabela de feedback de fontes (para melhorar o sistema)
CREATE TABLE IF NOT EXISTS source_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
  perspective_type VARCHAR(50) NOT NULL,
  source_url TEXT NOT NULL,
  feedback VARCHAR(20) NOT NULL CHECK (feedback IN ('relevant', 'not_relevant')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_perspectives_analysis_id ON perspectives(analysis_id);
CREATE INDEX IF NOT EXISTS idx_questions_analysis_id ON reflective_questions(analysis_id);
CREATE INDEX IF NOT EXISTS idx_source_feedback_analysis_id ON source_feedback(analysis_id);
CREATE INDEX IF NOT EXISTS idx_source_feedback_created_at ON source_feedback(created_at DESC);

-- Row Level Security (RLS)
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE perspectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflective_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_feedback ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Users can view own analyses"
  ON analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own analyses"
  ON analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analyses"
  ON analyses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses"
  ON analyses FOR DELETE
  USING (auth.uid() = user_id);

-- Perspectivas podem ser lidas se a análise pertence ao usuário
CREATE POLICY "Users can view perspectives of own analyses"
  ON perspectives FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM analyses
      WHERE analyses.id = perspectives.analysis_id
      AND analyses.user_id = auth.uid()
    )
  );

CREATE POLICY "Service can insert perspectives"
  ON perspectives FOR INSERT
  WITH CHECK (true); -- API serverless vai inserir

-- Perguntas podem ser lidas se a análise pertence ao usuário
CREATE POLICY "Users can view questions of own analyses"
  ON reflective_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM analyses
      WHERE analyses.id = reflective_questions.analysis_id
      AND analyses.user_id = auth.uid()
    )
  );

CREATE POLICY "Service can insert questions"
  ON reflective_questions FOR INSERT
  WITH CHECK (true); -- API serverless vai inserir

-- Políticas para source_feedback
CREATE POLICY "Anyone can insert feedback"
  ON source_feedback FOR INSERT
  WITH CHECK (true); -- Permitir feedback anônimo para MVP

CREATE POLICY "Service can view all feedback"
  ON source_feedback FOR SELECT
  USING (true); -- Para análise de qualidade

-- Function para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para auto-atualizar updated_at
CREATE TRIGGER update_analyses_updated_at BEFORE UPDATE ON analyses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
