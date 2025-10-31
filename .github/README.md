# 🤖 GitHub Automation

Este diretório contém toda a automação do PluralView MVP.

## 📁 Estrutura

```
.github/
├── workflows/
│   ├── ci.yml          # Testes, lint, cobertura automáticos
│   └── deploy.yml      # Deploy automático para Vercel
├── dependabot.yml      # Atualizações automáticas de dependências
├── SETUP_CICD.md       # Guia completo de configuração
└── README.md           # Este arquivo
```

## 🚀 Features Implementadas

### ✅ Continuous Integration (CI)

**Arquivo:** `workflows/ci.yml`

**Triggers:**
- Todo push para `main`, `master` ou `develop`
- Todo pull request

**O que faz:**
1. **Lint**: Verifica estilo de código
2. **Testes**: Roda suite completa de testes
3. **Cobertura**: Calcula e reporta cobertura
4. **Build**: Verifica se compila sem erros
5. **Type Check**: Valida tipos TypeScript

**Otimizações:**
- ✅ Cache de `node_modules` (builds mais rápidos)
- ✅ Jobs paralelos (lint + test + build simultâneos)
- ✅ Cancela execuções anteriores (economiza minutos)
- ✅ Mocks de API (custo zero)

**Tempo médio:** 3-5 minutos

---

### ✅ Continuous Deployment (CD)

**Arquivo:** `workflows/deploy.yml`

**Triggers:**
- Push para `main` ou `master`
- Disparo manual

**O que faz:**
1. **Deploy Production**: Envia para produção no Vercel
2. **Deploy Preview**: Cria preview para PRs
3. **Comentários**: Adiciona URL do deploy no PR

**Alternativa:** O Vercel pode fazer deploy automático via Git (não precisa do GitHub Actions)

---

### ✅ Dependabot

**Arquivo:** `dependabot.yml`

**O que faz:**
- Monitora dependências npm semanalmente
- Monitora GitHub Actions mensalmente
- Cria PRs automáticos para atualizações
- Agrupa atualizações menores

**Configuração:**
- **Dia:** Segunda-feira às 09:00
- **Limite:** 10 PRs abertos simultaneamente
- **Labels:** `dependencies`, `automated`

---

## 💰 Custos

**Total:** R$ 0,00 (zero)

| Item | Uso Mensal | Limite Free | Custo |
|------|------------|-------------|-------|
| GitHub Actions (público) | ~150 min | Ilimitado | R$ 0 |
| GitHub Actions (privado) | ~150 min | 2.000 min | R$ 0 |
| Codecov | 30 uploads | Ilimitado | R$ 0 |
| Dependabot | Incluído | Incluído | R$ 0 |
| APIs (mocks) | 0 chamadas | - | R$ 0 |

---

## 🔧 Configuração Inicial

### 1. Configuração Mínima (Apenas CI)

```bash
# 1. Substitua 'seu-usuario' no README.md
# 2. Substitua 'seu-usuario' no dependabot.yml
# 3. Faça commit e push
git add .
git commit -m "ci: adiciona GitHub Actions"
git push
```

✅ **Pronto!** O CI vai começar a rodar automaticamente.

### 2. Configuração Completa (CI + Deploy)

Siga o guia detalhado: [SETUP_CICD.md](./SETUP_CICD.md)

---

## 📊 Monitoramento

### Ver Status dos Workflows

```
https://github.com/seu-usuario/pluralview-mvp/actions
```

### Ver Cobertura de Código

```
https://codecov.io/gh/seu-usuario/pluralview-mvp
```

### Ver PRs do Dependabot

```
https://github.com/seu-usuario/pluralview-mvp/pulls
```

---

## 🐛 Solução de Problemas

### CI failing?

```bash
# Teste localmente primeiro
npm run lint
npm run test
npm run build
```

### Deploy failing?

**Causa comum:** Secrets não configurados

**Solução:** Configure os secrets do Vercel (veja SETUP_CICD.md) ou use deploy automático do Vercel via Git

### Dependabot não está criando PRs?

**Verifique:**
- ✅ Arquivo `dependabot.yml` está no lugar certo
- ✅ Username está correto em `reviewers`
- ✅ Repositório permite PRs de bots

---

## 📚 Documentação

- [GitHub Actions Docs](https://docs.github.com/actions)
- [Dependabot Docs](https://docs.github.com/code-security/dependabot)
- [Vercel GitHub Integration](https://vercel.com/docs/git)
- [Codecov Docs](https://docs.codecov.com/)

---

## 🎯 Próximas Melhorias

Futuras otimizações que podem ser adicionadas:

- [ ] Testes E2E com Playwright
- [ ] Security scanning (Snyk, CodeQL)
- [ ] Performance monitoring (Lighthouse CI)
- [ ] Visual regression testing
- [ ] Automated releases (semantic-release)
- [ ] Changelog automático

---

## ✨ Inspiração

Esta estrutura foi inspirada nas melhores práticas da organização **AntV** (Ant Group), adaptada para o contexto do PluralView MVP.

**Referências:**
- [AntV G2](https://github.com/antvis/G2)
- [AntV G6](https://github.com/antvis/G6)

---

**Implementado em:** Out/2025
**Custo total:** R$ 0,00
**Tempo de implementação:** 4 horas
**Status:** ✅ Produção
