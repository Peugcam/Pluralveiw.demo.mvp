# 🔍 PluralView MVP

[🇧🇷 Português](README.md) | [🇺🇸 English](#english)

> Business Intelligence for Narrative Analysis: Turn hours of research into minutes with clean, multi-perspective data

[![CI](https://github.com/seu-usuario/pluralview-mvp/actions/workflows/ci.yml/badge.svg)](https://github.com/seu-usuario/pluralview-mvp/actions/workflows/ci.yml)
[![Deploy](https://github.com/seu-usuario/pluralview-mvp/actions/workflows/deploy.yml/badge.svg)](https://github.com/seu-usuario/pluralview-mvp/actions/workflows/deploy.yml)
[![codecov](https://codecov.io/gh/seu-usuario/pluralview-mvp/branch/main/graph/badge.svg)](https://codecov.io/gh/seu-usuario/pluralview-mvp)
[![Next.js](https://img.shields.io/badge/Next.js-14.0-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.2-blue)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3-38bdf8)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 🎯 What Is It

**PluralView** is a Business Intelligence platform that analyzes any topic through **6 different perspectives**, providing market data without ideological noise for:

**Research & Analysis:**
- 📊 **Independent Researchers** - Deep research in minutes, not hours
- 🎓 **Academics and Think Tanks** - Multi-dimensional analysis for papers and studies
- 📰 **Investigative Journalists** - Fact-checking and competitive narrative analysis

**Market & Investment:**
- 💰 **VCs and Investment Funds** - Fast, multi-dimensional due diligence
- 📈 **Market Analysts** - 360° view of any topic in real-time
- 💼 **Industry Professionals** - Market analysis and competitive sentiment

**Strategy & Compliance:**
- 🎯 **Strategic Consultancies** - Competitive intelligence and narrative analysis
- ⚖️ **Lawyers and Compliance** - Case research and regulatory analysis
- 🏛️ **Policy Makers** - Balanced view for public policy formulation

**Corporate Communications:**
- 🏢 **Companies (C-level)** - Sentiment data without political bias for strategic decisions
- 📢 **PR and Communications Teams** - Public perception analysis and crisis management
- 🌍 **NGOs and Organizations** - Social impact analysis and data-driven advocacy

### Generated Perspectives

1. **Technical** - Scientific data and evidence
2. **Popular** - Common sense and daily impact
3. **Institutional** - Government and official organization positions
4. **Academic** - Research, theories, and university studies
5. **Conservative** - Tradition, caution, and traditional values
6. **Progressive** - Social change, innovation, and equity

### 💡 Real-World Use Cases

**VC Performing Due Diligence:**
```
Topic: "Cryptocurrency regulation in Brazil"
Result: Institutional, technical, and market view in 12s
ROI: 4 hours of research → 12 seconds
```

**Strategic Consultancy:**
```
Topic: "Impact of generative AI on financial sector"
Result: 6 perspectives + Trust Score + bias analysis
Value: Multi-dimensional report for C-level client
```

**PR Team in Crisis Management:**
```
Topic: "Product X controversy on social media"
Result: Sentiment analysis with verified sources
Action: Strategic response based on data, not emotional reaction
```

**Investigative Journalist:**
```
Topic: "Conflict of interest in public bidding"
Result: Institutional, popular, and academic perspectives with Trust Score
Value: Fast fact-checking and auditable sources for article
```

**Lawyer in Litigation:**
```
Topic: "GDPR precedents in e-commerce"
Result: Technical + institutional + academic analysis
Benefit: 6 hours research → 12 seconds, verified sources
```

---

## ⚡ Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase Account
- API Keys: Anthropic Claude, OpenAI, Tavily

### Installation

```bash
# Clone the repository
git clone [your-repo-url]
cd pluralview-mvp

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run the project
npm run dev
```

Access: **http://localhost:3000**

---

## 🔑 Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-...

# Tavily (web search)
TAVILY_API_KEY=tvly-...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Create Tables in Supabase

Run the SQL script located at:
```
supabase/api_costs_schema_FINAL.sql
```

---

## 🚀 Features

### Multi-Perspective Analysis
- 6 different perspectives on any topic
- Real-time web search via Tavily
- Analysis by Claude Haiku and GPT-4o-mini

### Trust Score System (0-100)
- Domain credibility evaluation
- HTTPS verification
- Content recency analysis
- Metadata quality check
- Red flag detection

### Bias Detection
- Ideological biases
- Conflicts of interest
- Methodological limitations
- Under-represented perspectives
- Unquestioned assumptions

### Perspective Comparison
- Common ground identification
- Main divergences
- Direct contradictions
- Integrated synthesis

### Cost Tracking Dashboard
- Real-time API cost monitoring
- Per-model breakdown
- Per-operation analysis
- Historical evolution

---

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- Next.js 14 (React 18)
- Tailwind CSS 3.3
- React Hooks

**Backend:**
- Next.js API Routes
- Supabase (PostgreSQL)

**AI/ML:**
- Anthropic Claude 3.5 Haiku
- OpenAI GPT-4o-mini
- Tavily Search API

**Infrastructure:**
- Vercel (deployment)
- GitHub Actions (CI/CD)
- Dependabot (dependencies)

### Project Structure

```
pluralview-mvp/
├── src/
│   ├── pages/
│   │   ├── index.js                 # Main page
│   │   ├── api/
│   │   │   ├── analyze.js          # Core analysis
│   │   │   ├── compare-perspectives.js
│   │   │   └── cost-stats.js
│   │   └── admin/
│   │       └── costs.js            # Dashboard
│   ├── components/
│   │   ├── BiasAlert.tsx
│   │   ├── PerspectiveCard.tsx
│   │   ├── TrustScoreBadge.tsx
│   │   └── ...
│   ├── lib/
│   │   ├── trustScoreCalculator.js
│   │   ├── costLogger.js
│   │   └── validation.js
│   └── styles/
│       └── globals.css
├── tests/
│   ├── e2e/                        # E2E tests (Playwright)
│   └── ...
├── .github/
│   ├── workflows/                  # CI/CD
│   └── ISSUE_TEMPLATE/            # Templates
├── supabase/
│   └── schema.sql
└── docs/
    └── ...
```

---

## 📊 Cost Optimization

### Before Optimization
- Cost per analysis: **$0.0667**
- Main models: Claude Sonnet 4, GPT-3.5

### After Optimization (October 2025)
- Cost per analysis: **$0.0171**
- **74.4% reduction** 🎉
- Models: Claude Haiku, GPT-4o-mini

**Budget for AI Brasil 2025:** 150 analyses = $2.57

---

## 🧪 Testing

### Unit Tests

```bash
# Run tests
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

**Minimum coverage:** 70%

### E2E Tests (Playwright)

```bash
# Install browsers
npx playwright install

# Run E2E tests
npm run test:e2e

# Interactive mode
npx playwright test --ui
```

---

## 🔒 Security

- ✅ Input validation with Zod
- ✅ Rate limiting on sensitive endpoints
- ✅ JWT authentication for admin
- ✅ Security headers (CSP, HSTS, etc)
- ✅ No stack trace exposure in production
- ✅ Environment variables never committed

See: [SECURITY.md](.github/SECURITY.md)

---

## 🤝 Contributing

We welcome contributions! Please read:

- [CONTRIBUTING.md](.github/CONTRIBUTING.md)
- [CODE_OF_CONDUCT.md](.github/CODE_OF_CONDUCT.md)

### Development Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit with conventional commits (`feat:`, `fix:`, etc)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Standards

We use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat(trust-score): add HTTPS verification
fix(api): correct timeout calculation
docs(readme): update installation guide
```

---

## 📚 Documentation

- [Setup Guide](SETUP_GUIDE.md)
- [Architecture](docs/V2_ARCHITECTURE.md)
- [CI/CD Setup](.github/SETUP_CICD.md)
- [E2E Testing](tests/e2e/README.md)
- [Cost Analysis](OTIMIZACAO_CUSTOS_AI_BRASIL.md)

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Environment Variables

Configure in Vercel dashboard:
- All variables from `.env.local`
- Add production URLs

---

## 🎯 Roadmap

- [x] Multi-perspective analysis
- [x] Trust Score system
- [x] Bias detection
- [x] Cost optimization (74.4%)
- [x] CI/CD with GitHub Actions
- [x] E2E testing with Playwright
- [ ] Real-time updates (WebSockets)
- [ ] User accounts and history
- [ ] Export to PDF/Markdown
- [ ] API public access
- [ ] Mobile app (React Native)

---

## 📈 Metrics

### Performance

- **Analysis time:** 15-30s (6 perspectives)
- **Cost per analysis:** $0.0171
- **Test coverage:** 70%+
- **Lighthouse score:** 90+ (planned)

### Code Quality

- ✅ ESLint configured
- ✅ Prettier configured
- ✅ Husky + Commitlint
- ✅ Automated tests in CI
- ✅ Dependabot enabled

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **AntV** - For open source best practices inspiration
- **Anthropic** - Claude API
- **OpenAI** - GPT API
- **Tavily** - Web search API
- **Vercel** - Deployment platform

---

## 📞 Contact

- **Issues:** [GitHub Issues](https://github.com/seu-usuario/pluralview-mvp/issues)
- **Discussions:** [GitHub Discussions](https://github.com/seu-usuario/pluralview-mvp/discussions)
- **Email:** [your-email]@pluralview.com
- **Security:** See [SECURITY.md](.github/SECURITY.md)

---

## ⭐ Star History

If this project helps you, please consider giving it a star! ⭐

---

**Made with ❤️ by the PluralView Team**

*Turning hours of research into seconds of insight - Business Intelligence for the real world.*
