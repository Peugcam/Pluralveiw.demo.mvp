-- Remover todas as políticas antigas
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'analyses') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON analyses';
    END LOOP;
END $$;

-- Remover a constraint de foreign key
ALTER TABLE analyses DROP CONSTRAINT IF EXISTS analyses_user_id_fkey;

-- Permitir user_id NULL
ALTER TABLE analyses ALTER COLUMN user_id DROP NOT NULL;

-- Criar políticas permissivas para MVP (sem autenticação)
CREATE POLICY "mvp_insert" ON analyses FOR INSERT WITH CHECK (true);
CREATE POLICY "mvp_select" ON analyses FOR SELECT USING (true);
CREATE POLICY "mvp_update" ON analyses FOR UPDATE USING (true);
CREATE POLICY "mvp_delete" ON analyses FOR DELETE USING (true);
