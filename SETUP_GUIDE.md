# 🚀 Guia de Setup do PluralView MVP

## Passo a Passo Completo

### ✅ Passo 1: Estrutura do Projeto (COMPLETO)
- [x] Next.js configurado
- [x] Tailwind CSS configurado
- [x] Estrutura de pastas criada

---

### 📦 Passo 2: Configurar Supabase (FAÇA AGORA)

#### 2.1 Criar Conta e Projeto
1. Acesse https://supabase.com
2. Clique em "Start your project"
3. Crie uma conta (pode usar GitHub)
4. Clique em "New Project"
5. Preencha:
   - **Name:** pluralview-mvp
   - **Database Password:** Crie uma senha forte e GUARDE
   - **Region:** South America (São Paulo)
   - **Pricing Plan:** Free
6. Clique em "Create new project" e aguarde ~2 minutos

#### 2.2 Obter Credenciais
1. No dashboard do Supabase, vá em **Settings** (ícone de engrenagem) → **API**
2. Copie as seguintes informações:
   - **Project URL** (ex: https://xxxxx.supabase.co)
   - **anon public** key (começa com eyJh...)
   - **service_role** key (⚠️ secreta, nunca compartilhe)

#### 2.3 Configurar Variáveis de Ambiente
1. No projeto, copie `.env.example` para `.env.local`:
   ```bash
   cd C:/Users/paulo/OneDrive/Desktop/pluralview-mvp
   copy .env.example .env.local
   ```

2. Abra `.env.local` e cole suas credenciais:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
   SUPABASE_SERVICE_ROLE_KEY=eyJh... (a secreta)
   ```

#### 2.4 Criar Tabelas no Banco de Dados
1. No dashboard do Supabase, vá em **SQL Editor**
2. Clique em "+ New query"
3. Copie TODO o conteúdo do arquivo `supabase/schema.sql`
4. Cole no editor e clique em **Run** (ou pressione Ctrl+Enter)
5. Você deve ver: "Success. No rows returned"

#### 2.5 Verificar
1. Vá em **Table Editor** no Supabase
2. Você deve ver 3 tabelas criadas:
   - `analyses`
   - `perspectives`
   - `reflective_questions`

---

### 🤖 Passo 3: Configurar OpenAI (PRÓXIMO)

#### 3.1 Criar Conta OpenAI
1. Acesse https://platform.openai.com
2. Crie uma conta
3. Vá em **Billing** e adicione crédito ($5-10 para começar)

#### 3.2 Criar API Key
1. Vá em **API Keys**
2. Clique em "Create new secret key"
3. Copie a chave (começa com sk-...)

#### 3.3 Adicionar ao .env.local
```env
OPENAI_API_KEY=sk-...
```

---

### 💻 Passo 4: Instalar Dependências

```bash
cd C:/Users/paulo/OneDrive/Desktop/pluralview-mvp
npm install
```

---

### 🏃 Passo 5: Rodar o Projeto

```bash
npm run dev
```

Abra http://localhost:3000

---

## 📝 Checklist de Setup

- [ ] Conta Supabase criada
- [ ] Projeto Supabase criado
- [ ] Credenciais copiadas para .env.local
- [ ] Schema SQL executado
- [ ] Tabelas verificadas no Table Editor
- [ ] Conta OpenAI criada
- [ ] API Key OpenAI criada
- [ ] API Key adicionada ao .env.local
- [ ] Dependências instaladas (npm install)
- [ ] Projeto rodando (npm run dev)

---

## 🆘 Precisa de Ajuda?

**Me avise quando você:**
1. Criar o projeto no Supabase → vou te ajudar com o próximo passo
2. Executar o schema.sql → vou verificar se deu certo
3. Obter a API key da OpenAI → vamos testar a integração

**Dúvidas comuns:**
- "Não consigo executar o schema.sql" → Copie TODO o conteúdo, não só parte
- "API key não funciona" → Verifique se copiou corretamente, sem espaços
- "npm install dá erro" → Tente `npm install --legacy-peer-deps`
