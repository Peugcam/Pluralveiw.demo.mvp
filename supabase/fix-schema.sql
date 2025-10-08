-- Remover a constraint de foreign key que está causando erro
ALTER TABLE analyses DROP CONSTRAINT IF EXISTS analyses_user_id_fkey;

-- Permitir user_id NULL para usuários anônimos
ALTER TABLE analyses ALTER COLUMN user_id DROP NOT NULL;

-- Recriar as políticas de RLS sem exigir auth.uid()
DROP POLICY IF EXISTS "Users can view own analyses" ON analyses;
DROP POLICY IF EXISTS "Users can create own analyses" ON analyses;
DROP POLICY IF EXISTS "Users can update own analyses" ON analyses;
DROP POLICY IF EXISTS "Users can delete own analyses" ON analyses;

-- Políticas mais permissivas para MVP
CREATE POLICY "Anyone can create analyses"
  ON analyses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view analyses"
  ON analyses FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update analyses"
  ON analyses FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete analyses"
  ON analyses FOR DELETE
  USING (true);
