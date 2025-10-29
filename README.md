# 🔍 PluralView MVP

> Business Intelligence para Análise de Narrativas: Transforme horas de research em minutos com dados limpos e multi-perspectiva

[![Next.js](https://img.shields.io/badge/Next.js-14.0-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.2-blue)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3-38bdf8)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 🎯 O Que É

**PluralView** é uma plataforma de Business Intelligence que analisa qualquer tópico através de **6 perspectivas diferentes**, fornecendo dados de mercado sem ruído ideológico para:

**Research & Análise:**
- 📊 **Pesquisadores Independentes** - Research aprofundado em minutos, não horas
- 🎓 **Acadêmicos e Think Tanks** - Análise multi-dimensional para papers e estudos
- 📰 **Jornalistas Investigativos** - Fact-checking e análise de narrativas competitivas
- 🔬 **Equipes de Innovation/R&D** - Análise de tendências tecnológicas e oportunidades

**Mercado & Investimento:**
- 💰 **VCs e Fundos de Investimento** - Due diligence rápida e multi-dimensional
- 📈 **Analistas de Mercado** - Visão 360° de qualquer tema em tempo real
- 💼 **Profissionais de Indústria** - Análise de mercado e sentiment competitivo
- 📊 **Traders e Investidores** - Análise de sentiment para decisões de trading
- 🎯 **Product Managers** - Análise de produto, concorrência e feedback de usuários

**Estratégia & Compliance:**
- 🎯 **Consultorias Estratégicas** - Inteligência competitiva e análise de narrativas
- ⚖️ **Advogados e Compliance** - Research de casos e análise regulatória
- 🏛️ **Policy Makers** - Visão equilibrada para formulação de políticas públicas
- 🛡️ **Risk Managers** - Análise de riscos regulatórios e reputacionais
- 🌱 **Gestores de ESG/Sustentabilidade** - Análise de temas ambientais e sociais

**Comunicação & Marketing:**
- 🏢 **Empresas (C-level)** - Dados de sentiment sem viés político para decisões estratégicas
- 📢 **Equipes de PR e Comunicação** - Análise de percepção pública e gestão de crises
- 🎨 **Agências de Comunicação** - Research rápido para campanhas e clientes
- 📱 **Marketing e Growth Teams** - Análise de posicionamento e narrativas de mercado
- 👥 **Gestores de Reputação** - Monitoramento proativo de marca e percepção
- 🌍 **ONGs e Organizações** - Análise de impacto social e advocacy baseado em dados

### Perspectivas Geradas

1. **Técnica** - Dados científicos e evidências
2. **Popular** - Senso comum e impacto no dia a dia
3. **Institucional** - Posição de governos e organizações oficiais
4. **Acadêmica** - Pesquisas, teorias e estudos universitários
5. **Conservadora** - Tradição, cautela e valores tradicionais
6. **Progressista** - Mudança social, inovação e equidade

### 💡 Casos de Uso Reais

**VC realizando Due Diligence:**
```
Tópico: "Regulação de criptomoedas no Brasil"
Resultado: Visão institucional, técnica e de mercado em 12s
ROI: 4 horas de research → 12 segundos
```

**Consultoria Estratégica:**
```
Tópico: "Impacto da IA generativa no setor financeiro"
Resultado: 6 perspectivas + Trust Score + análise de vieses
Valor: Relatório multi-dimensional para cliente C-level
```

**Equipe de PR em Gestão de Crise:**
```
Tópico: "Polêmica sobre produto X nas redes sociais"
Resultado: Análise de sentiment com fontes verificadas
Ação: Resposta estratégica baseada em dados, não reação emocional
```

**Jornalista Investigativo:**
```
Tópico: "Conflito de interesses em licitação pública"
Resultado: Perspectivas institucional, popular e acadêmica com Trust Score
Valor: Fact-checking rápido e fontes auditáveis para matéria
```

**Advogado em Litigation:**
```
Tópico: "Precedentes sobre LGPD em e-commerce"
Resultado: Análise técnica + institucional + acadêmica
Benefício: Research de 6 horas → 12 segundos, fontes verificadas
```

**Product Manager lançando feature:**
```
Tópico: "Pagamento por biometria facial em apps"
Resultado: Perspectivas técnica, popular e conservadora
Insight: Entender resistências e oportunidades antes do lançamento
```

**Risk Manager avaliando exposição:**
```
Tópico: "Regulação de ESG para empresas de tecnologia"
Resultado: Visão institucional + acadêmica + progressista
Valor: Antecipar mudanças regulatórias e preparar compliance
```

**Trader analisando mercado:**
```
Tópico: "Impacto da alta do dólar no agronegócio brasileiro"
Resultado: Análise técnica + popular + institucional em 12s
Vantagem: Decisões rápidas com múltiplas perspectivas de mercado
```

**Marketing Team definindo posicionamento:**
```
Tópico: "Percepção pública sobre carros elétricos no Brasil"
Resultado: 6 perspectivas com Trust Score e análise de vieses
Aplicação: Campanha baseada em dados reais, não achismos
```

**Gestor de ESG em relatório anual:**
```
Tópico: "Impacto social de programas de diversidade corporativa"
Resultado: Perspectivas acadêmica, popular e progressista
ROI: Relatório completo com fontes auditáveis em minutos
```

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

**Transformando research de horas em insights de segundos - Business Intelligence para o mundo real**

[⬆ Voltar ao topo](#-pluralview-mvp)

</div>
