# 🔍 PluralView MVP

> Plataforma de análise multi-perspectiva com IA para combater polarização e promover pensamento crítico

[![Next.js](https://img.shields.io/badge/Next.js-14.0-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.2-blue)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3-38bdf8)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 🎯 O Que É

**PluralView** é uma ferramenta que analisa qualquer tópico através de **6 perspectivas diferentes**, ajudando você a:

- 🧠 Entender múltiplos pontos de vista
- 🎯 Detectar vieses e conflitos de interesse
- 📊 Avaliar credibilidade de fontes (Trust Score)
- 💡 Fazer perguntas reflexivas
- 🔄 Comparar perspectivas lado a lado

### Perspectivas Geradas

1. **Técnica** - Dados científicos e evidências
2. **Popular** - Senso comum e impacto no dia a dia
3. **Institucional** - Posição de governos e organizações oficiais
4. **Acadêmica** - Pesquisas, teorias e estudos universitários
5. **Conservadora** - Tradição, cautela e valores tradicionais
6. **Progressista** - Mudança social, inovação e equidade

---

## ⚡ Quick Start

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta no Supabase
- API Keys: Anthropic Claude, OpenAI, Tavily

### Instalação

```bash
# Clone o repositório
git clone [seu-repo-url]
cd pluralview-mvp

# Instale dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais

# Execute o projeto
npm run dev
```

Acesse: **http://localhost:3000**

---

## 🔑 Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-...

# Tavily (busca web)
TAVILY_API_KEY=tvly-...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Criar Tabelas no Supabase

Execute o script SQL localizado em:
```
supabase/api_costs_schema_FINAL.sql
```

---

## 🚀 Funcionalidades

### Análise Multi-Perspectiva

Digite qualquer tópico e receba análises de 6 ângulos diferentes:

```
Input: "Inteligência Artificial na educação"
Output:
├── 6 perspectivas detalhadas (200-300 palavras cada)
├── Detecção de vieses em cada perspectiva
├── Trust Score das fontes (0-100)
├── 5 perguntas reflexivas
└── Opção de comparar perspectivas
```

### Trust Score System

Avaliação de credibilidade de fontes baseada em:

- ✅ **Domínio** (+25 pontos) - .edu, .gov, mídia confiável
- 🔒 **HTTPS** (+5 pontos) - Segurança
- 📅 **Recência** (+15 pontos) - Conteúdo atualizado
- 📝 **Qualidade** (+15 pontos) - Tamanho, citações, sem clickbait
- 📌 **Metadata** (+10 pontos) - Autor, fontes identificadas

**Resultado:** 0-100 (categorizado em Alto, Médio, Baixo, Muito Baixo)

### Detecção de Vieses

Sistema automático identifica:

1. 🎭 Vieses ideológicos ou políticos
2. 💰 Conflitos de interesse (financiamento)
3. 📊 Limitações metodológicas
4. 👥 Perspectivas sub-representadas
5. 💭 Suposições não questionadas

### Dashboard de Custos

Monitore gastos em tempo real:

**URL:** `/admin/costs`

**Recursos:**
- 📊 Custo por modelo (Claude, GPT)
- ⚙️ Custo por operação
- 📈 Evolução temporal
- 🔥 Análises mais caras
- 🔄 Comparação com período anterior

---

## 💰 Custos (Otimizado para AI Brasil)

### Modelos de IA Atuais

```
Claude 3.5 Haiku:
├── Input:  $0.80 / 1M tokens
├── Output: $4.00 / 1M tokens
└── Uso: Análise de perspectivas (6x por análise)

GPT-4o-mini:
├── Input:  $0.15 / 1M tokens
├── Output: $0.60 / 1M tokens
└── Uso: Filtros, validação, perguntas (8x por análise)

Tavily Search:
└── Gratuito até 1000 buscas/mês
```

### Custo Real por Análise

```
Por análise completa (6 perspectivas):
├── Claude Haiku (6x):    ~$0.0161 (94%)
├── GPT-4o-mini (8x):     ~$0.0004 (2.3%)
├── Tavily (busca web):   ~$0.0006 (3.5%)
└── Total:                ~$0.0171

Tempo médio: 12 segundos
```

### Projeções

| Uso | Custo/Mês | Observação |
|-----|-----------|------------|
| 100 análises | $1.71 | Teste/desenvolvimento |
| 500 análises | $8.55 | Uso moderado |
| 1000 análises | $17.10 | Uso intenso |
| AI Brasil (150) | **$2.57** | **Evento** ✅ |

**Redução de 74% em custos** vs versão anterior (Claude Sonnet 4 + GPT-3.5)

> 📖 **Ver análise completa:** [OTIMIZACAO_CUSTOS_AI_BRASIL.md](OTIMIZACAO_CUSTOS_AI_BRASIL.md)

---

## 🛡️ Segurança

### Proteções Implementadas

- ✅ **Rate Limiting:** 5 análises/min por IP
- ✅ **Input Validation:** Zod schemas
- ✅ **Sanitização:** Remoção de caracteres perigosos
- ✅ **Headers de Segurança:** CSP, HSTS, XSS Protection
- ✅ **RLS no Supabase:** Row Level Security ativo
- ✅ **Timeout:** 30s para todas as requisições

### Headers Configurados

```javascript
X-DNS-Prefetch-Control: on
Strict-Transport-Security: max-age=63072000
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

---

## 📁 Estrutura do Projeto

```
pluralview-mvp/
├── src/
│   ├── pages/
│   │   ├── index.js                    # App principal (1,010 linhas)
│   │   ├── api/
│   │   │   ├── analyze.js              # API principal (697 linhas)
│   │   │   ├── compare-perspectives.js # Comparação de perspectivas
│   │   │   ├── cost-stats.js           # Estatísticas de custos
│   │   │   └── feedback-source.js      # Feedback de usuários
│   │   └── admin/
│   │       └── costs.js                # Dashboard de custos
│   ├── lib/
│   │   ├── costLogger.js               # Tracking de custos
│   │   ├── trustScoreCalculator.js     # Cálculo de confiabilidade
│   │   ├── temporalDetector.js         # Detecção temporal de queries
│   │   ├── validation.js               # Schemas de validação
│   │   ├── rateLimit.js                # Rate limiting
│   │   └── auth.js                     # Autenticação (opcional)
│   ├── components/
│   │   └── SEO.js
│   └── styles/
│       └── globals.css
├── public/
│   ├── robots.txt
│   ├── sitemap.xml
│   └── og-image.png
├── supabase/
│   └── api_costs_schema_FINAL.sql      # Schema do banco
├── .env.example
├── .env.local                           # Suas credenciais (não commitar!)
├── next.config.js
├── tailwind.config.js
├── package.json
├── README.md                            # Este arquivo
└── OTIMIZACAO_CUSTOS_AI_BRASIL.md      # Documentação técnica completa
```

---

## 🔧 Tech Stack

### Frontend
- **Next.js 14** - Framework React com SSR
- **React 18** - Biblioteca de UI
- **Tailwind CSS** - Estilização
- **Vercel** - Hosting e deployment

### Backend
- **Next.js API Routes** - Serverless functions
- **Supabase** - PostgreSQL database
- **Zod** - Validação de schemas
- **LRU-Cache** - Cache em memória

### AI & Search
- **Claude 3.5 Haiku** (Anthropic) - Análise de perspectivas
- **GPT-4o-mini** (OpenAI) - Filtros, validação, perguntas
- **Tavily API** - Busca web em tempo real

---

## 📊 APIs Utilizadas

### API Principal: `/api/analyze`

**Input:**
```json
{
  "topic": "Mudanças climáticas"
}
```

**Output:**
```json
{
  "success": true,
  "analysisId": "uuid",
  "perspectives": [
    {
      "type": "tecnica",
      "content": "Análise técnica...",
      "biases": ["Viés 1", "Viés 2"],
      "sources": [
        {
          "title": "Título da fonte",
          "url": "https://...",
          "type": "academico",
          "trustScore": 85,
          "trustLevel": "high"
        }
      ]
    }
    // ... mais 5 perspectivas
  ],
  "questions": [
    "Pergunta reflexiva 1?",
    "Pergunta reflexiva 2?"
    // ... mais 3 perguntas
  ]
}
```

### Outras APIs

- `/api/compare-perspectives` - Compara 2-6 perspectivas
- `/api/cost-stats` - Estatísticas de custos
- `/api/feedback-source` - Feedback sobre fontes

---

## 🧪 Teste Comparativo (Antes vs Depois)

### Modelos Testados

**ANTES (versão antiga):**
- Claude Sonnet 4
- GPT-3.5-turbo

**DEPOIS (versão otimizada):**
- Claude 3.5 Haiku
- GPT-4o-mini

### Resultados

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| Custo/análise | $0.0667 | $0.0171 | **-74.4%** 🔥 |
| Tempo | 24s | 12s | **-50%** ⚡ |
| Tamanho texto | 1,139 chars | 1,278 chars | **+12%** ✅ |
| Vieses detectados | 3 | 3 | **=** |
| Qualidade | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **Mantida** ✅ |

**Conclusão:** Economia massiva sem perda de qualidade!

> 📊 **Ver análise detalhada:** [OTIMIZACAO_CUSTOS_AI_BRASIL.md](OTIMIZACAO_CUSTOS_AI_BRASIL.md#teste-comparativo)

---

## 🚀 Deployment

### Vercel (Recomendado)

1. Push para GitHub
2. Conecte ao Vercel
3. Configure variáveis de ambiente
4. Deploy automático!

```bash
# Via CLI
vercel --prod
```

### Variáveis de Ambiente na Vercel

Configure todas as variáveis do `.env.local` no dashboard da Vercel:
- Project Settings → Environment Variables

---

## 📈 Monitoramento

### Dashboard de Custos

**URL:** `/admin/costs`

**Períodos disponíveis:**
- Últimas 24 horas
- Últimos 7 dias
- Últimos 30 dias
- Últimos 90 dias

### KPIs Recomendados

- ✅ Custo por análise: **< $0.02**
- ✅ Custo diário: **< $5**
- ✅ Custo mensal: **< $50**
- ✅ Tempo de resposta: **< 15s**
- ✅ Taxa de erro: **< 1%**

---

## 🛠️ Desenvolvimento

### Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Iniciar produção
npm start

# Linting
npm run lint
```

### Adicionar Nova Perspectiva

1. Edite `src/pages/api/analyze.js`
2. Adicione novo tipo em `perspectiveTypes` (linha ~511)
3. Ajuste prompts conforme necessário
4. Teste localmente

### Modificar Trust Score

Edite `src/lib/trustScoreCalculator.js`:
- Adicionar/remover domínios confiáveis
- Ajustar pesos dos fatores
- Modificar níveis de confiança

---

## 📝 Documentação Adicional

- **[Análise Técnica Completa](OTIMIZACAO_CUSTOS_AI_BRASIL.md)** - Avaliação crítica e otimizações
- **[Setup Guide](SETUP_GUIDE.md)** - Guia passo a passo de configuração
- **[Trust Score Implementation](TRUST_SCORE_IMPLEMENTATION.md)** - Sistema de confiabilidade
- **[Bias Detection](BIAS_DETECTION_IMPLEMENTATION.md)** - Detecção de vieses
- **[Temporal Query System](TEMPORAL_QUERY_SYSTEM.md)** - Queries temporais
- **[Security Improvements](SECURITY_IMPROVEMENTS.md)** - Melhorias de segurança

---

## 🐛 Problemas Conhecidos

### Frontend

- ⚠️ `index.js` muito grande (1,010 linhas) - Precisa refatorar
- ⚠️ Sem TypeScript - Aumenta risco de bugs
- ⚠️ Sem testes automatizados

### Backend

- ⚠️ Cache LRU não compartilhado entre serverless functions
- ⚠️ Sem retry logic para chamadas de API

> 📌 **Roadmap de melhorias:** [OTIMIZACAO_CUSTOS_AI_BRASIL.md#próximos-passos](OTIMIZACAO_CUSTOS_AI_BRASIL.md#próximos-passos)

---

## 🤝 Contribuindo

### Antes de Contribuir

1. Leia a documentação técnica completa
2. Teste localmente
3. Siga os padrões de código existentes
4. Adicione testes (quando implementados)

### Pull Requests

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-feature`
3. Commit: `git commit -m 'Add: nova feature'`
4. Push: `git push origin feature/nova-feature`
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👨‍💻 Autor

**PluralView MVP**
- Desenvolvido para o AI Brasil 2025
- Otimizado em 17/10/2025

---

## 🙏 Agradecimentos

- **Anthropic** - Claude API
- **OpenAI** - GPT API
- **Tavily** - Search API
- **Supabase** - Database & Auth
- **Vercel** - Hosting

---

## 📞 Suporte

- 📧 Email: [seu-email]
- 🐛 Issues: [GitHub Issues](link)
- 📖 Docs: [Ver documentação completa](OTIMIZACAO_CUSTOS_AI_BRASIL.md)

---

## 🔗 Links Úteis

- [Next.js Documentation](https://nextjs.org/docs)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [OpenAI API](https://platform.openai.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tavily Search](https://docs.tavily.com/)

---

<div align="center">

**Construído com ❤️ para combater a polarização através do pensamento crítico**

[⬆ Voltar ao topo](#-pluralview-mvp)

</div>
