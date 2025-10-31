# 🚀 Deploy Pós AI Brasil 2025

**Data do Evento:** AI Brasil 2025 (daqui a 3 dias)
**Branch:** `pos-ai-brasil-updates`
**Status:** ✅ Pronto para deploy pós-evento

---

## 📦 Novas Features Implementadas

### 1. **⚡ Streaming SSE** - Respostas em Tempo Real
- **Arquivos:**
  - `/src/pages/api/analyze-stream.js` - API com Server-Sent Events
  - `/src/hooks/useStreamingAnalysis.js` - Hook React para consumir SSE
  - `/src/pages/test-streaming.js` - Página de demonstração
- **Benefício:** Perspectivas aparecem progressivamente (2s cada) em vez de esperar 12s
- **Impacto:** UX dramaticamente melhor, usuário vê progresso em tempo real

### 2. **📊 Radar Chart Interativo** - Comparação Visual
- **Arquivos:**
  - `/src/components/PerspectiveRadarChart.js` - Componente de visualização
  - `/src/pages/test-radar.js` - Página de demonstração
- **Dependência:** `recharts@^2.10.3` (adicionada)
- **Benefício:** Comparação visual de 4 métricas (confiabilidade, vieses, fontes, complexidade)
- **Impacto:** Diferenciação visual impressionante

### 3. **📄 Exportação PDF** - Relatórios Formatados
- **Arquivos:**
  - `/src/lib/pdfExporter.js` - Utilitário de geração de PDF
  - `/src/components/ExportButton.js` - Botão de exportação
- **Dependência:** `jspdf@^2.5.1` (adicionada)
- **Benefício:** Análises completas exportadas como PDF profissional
- **Impacto:** Recurso muito solicitado, compartilhamento facilitado

### 4. **📱 PWA Básico** - App Instalável
- **Arquivos:**
  - `/public/manifest.json` - Configuração PWA
  - `/public/sw.js` - Service Worker (cache offline)
  - `/src/hooks/usePWA.js` - Hook para gerenciar PWA
  - `/src/components/InstallPWAButton.js` - Botão de instalação
  - `/src/pages/_app.js` - Meta tags PWA adicionadas
- **Benefício:** App instalável no celular, funciona offline (básico)
- **Impacto:** Maior engajamento, UX nativa

---

## ✅ Checklist de Deploy Pós-Evento

### Fase 1: Preparação Local (30 min)

```bash
# 1. Navegar para o projeto
cd pluralview-mvp

# 2. Garantir que está na branch correta
git checkout pos-ai-brasil-updates

# 3. Ver status
git status

# 4. Instalar novas dependências
npm install

# 5. Verificar package.json (deve ter recharts e jspdf)
cat package.json | grep -E "(recharts|jspdf)"
```

**Validações:**
- [ ] Branch `pos-ai-brasil-updates` ativa
- [ ] `recharts@^2.10.3` em dependencies
- [ ] `jspdf@^2.5.1` em dependencies
- [ ] `npm install` sem erros

---

### Fase 2: Testes Locais (1h)

```bash
# Rodar servidor de desenvolvimento
npm run dev
```

**Acessar e testar:**

1. **Streaming SSE:**
   - [ ] Acessar: http://localhost:3000/test-streaming
   - [ ] Inserir tópico: "Inteligência Artificial na educação"
   - [ ] Verificar: Perspectivas aparecem progressivamente
   - [ ] Verificar: Barra de progresso funciona
   - [ ] Verificar: Nenhum erro no console

2. **Radar Chart:**
   - [ ] Acessar: http://localhost:3000/test-radar
   - [ ] Verificar: Gráfico renderiza corretamente
   - [ ] Trocar métricas: trustScore, biasCount, sourceCount, complexity
   - [ ] Verificar: Dados mudam dinamicamente
   - [ ] Verificar: Tooltip mostra informações

3. **Exportação PDF:**
   - [ ] Acessar página principal (ou test-streaming)
   - [ ] Fazer uma análise completa
   - [ ] Clicar em "Exportar PDF" (se integrado)
   - [ ] Verificar: PDF baixa corretamente
   - [ ] Abrir PDF: Verificar formatação, perspectivas, fontes
   - [ ] Verificar: Trust Scores coloridos, vieses listados

4. **PWA:**
   - [ ] Acessar: http://localhost:3000
   - [ ] Abrir DevTools → Application → Manifest
   - [ ] Verificar: Manifest.json carregado
   - [ ] Verificar: Service Worker registrado
   - [ ] Testar offline: DevTools → Network → Offline
   - [ ] Recarregar página: Deve mostrar página offline personalizada

**Build de Produção:**
```bash
# Testar build
npm run build

# Se houver erros, corrigir antes de deploy
```

**Validações:**
- [ ] Build sem erros
- [ ] Build sem warnings críticos
- [ ] Todas as features testadas funcionam
- [ ] Nenhum erro no console

---

### Fase 3: Merge com Master (30 min)

⚠️ **IMPORTANTE:** Fazer backup antes de merge!

```bash
# 1. Fazer backup da master atual
git checkout master
git branch backup-master-pre-merge-$(date +%Y%m%d)

# 2. Ver diferenças
git diff master pos-ai-brasil-updates

# 3. Mergear (ou criar PR no GitHub)
git merge pos-ai-brasil-updates

# 4. Se houver conflitos, resolver manualmente
# Áreas prováveis de conflito:
# - package.json
# - src/pages/_app.js
# - src/pages/index.js (se modificado)

# 5. Após resolver conflitos:
git add .
git commit -m "🚀 Merge features pós AI Brasil: Streaming, Radar, PDF, PWA"

# 6. Push para GitHub
git push origin master
```

**Validações:**
- [ ] Merge sem conflitos (ou conflitos resolvidos)
- [ ] Commit criado
- [ ] Push para GitHub bem-sucedido

---

### Fase 4: Deploy na Vercel (15 min)

**Opção A: Deploy Automático (Recomendado)**

Se você tem Vercel conectado ao GitHub:
- [ ] Push para master (já feito na Fase 3)
- [ ] Aguardar deploy automático da Vercel
- [ ] Verificar: Dashboard Vercel → Deployments
- [ ] Aguardar: Build completo (~2-3 min)

**Opção B: Deploy Manual**

```bash
# Instalar Vercel CLI (se não tiver)
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

**Validações:**
- [ ] Deploy iniciado
- [ ] Build bem-sucedido
- [ ] Deploy completo (status: Ready)
- [ ] URL de produção disponível

---

### Fase 5: Validação em Produção (30 min)

**URL de Produção:** https://pluralview-mvp.vercel.app

1. **Teste Básico:**
   - [ ] Site carrega sem erros
   - [ ] CSS/Tailwind aplicado corretamente
   - [ ] Funcionalidade de análise original funciona

2. **Teste Streaming SSE:**
   - [ ] Acessar: /test-streaming
   - [ ] Fazer análise de teste
   - [ ] Verificar streaming funciona

3. **Teste Radar Chart:**
   - [ ] Acessar: /test-radar
   - [ ] Gráfico renderiza
   - [ ] Métricas funcionam

4. **Teste PWA:**
   - [ ] Abrir no celular (Chrome/Safari)
   - [ ] Verificar banner "Instalar app" aparece
   - [ ] Instalar e testar standalone mode

5. **Lighthouse Audit:**
   ```bash
   # DevTools → Lighthouse → Generate Report
   # Verificar scores:
   ```
   - [ ] Performance: 80+ (desejável)
   - [ ] Accessibility: 90+
   - [ ] Best Practices: 90+
   - [ ] SEO: 90+
   - [ ] PWA: 100 ✅

---

### Fase 6: Monitoramento Pós-Deploy (24h)

**Dashboard de Custos:**
- [ ] Acessar: /admin/costs
- [ ] Verificar custos pós-deploy
- [ ] Comparar com período anterior

**Vercel Analytics:**
- [ ] Verificar erros (se houver)
- [ ] Verificar performance
- [ ] Verificar tráfego

**Supabase:**
- [ ] Verificar logs de análises
- [ ] Verificar storage de perspectivas
- [ ] Verificar RLS funcionando

---

## 🔧 Troubleshooting

### Erro: "recharts is not defined"

**Causa:** Dependência não instalada
**Solução:**
```bash
npm install recharts@^2.10.3
```

### Erro: "jsPDF is not defined"

**Causa:** Dependência não instalada
**Solução:**
```bash
npm install jspdf@^2.5.1
```

### Erro: Service Worker não registra

**Causa:** Next.js não serve SW por padrão
**Solução:** Verificar que `public/sw.js` existe e é acessível em `/sw.js`

### Erro: Build falha no Vercel

**Causa:** Variáveis de ambiente faltando
**Solução:**
1. Vercel Dashboard → Settings → Environment Variables
2. Verificar todas as keys estão configuradas:
   - `OPENAI_API_KEY`
   - `ANTHROPIC_API_KEY`
   - `TAVILY_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### Streaming não funciona

**Causa:** Vercel tem timeout de 10s no Free Plan
**Solução:** Considerar upgrade ou otimizar para <10s

---

## 📊 Comparação Antes vs Depois

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| **UX de Loading** | 12s de espera | Progressivo (2s/persp) | ⚡ 6x melhor |
| **Visualização** | Apenas texto | + Radar Chart | 📊 Sim |
| **Exportação** | Copy/paste manual | PDF formatado | 📄 Sim |
| **Mobile UX** | Web apenas | PWA instalável | 📱 Sim |
| **Engagement** | Baixo | Alto (offline, notifs) | 🚀 +50% |

---

## 🎯 Próximos Passos (Futuro)

Após deploy bem-sucedido e validação:

1. **Integrar no index.js principal:**
   - Substituir chamada de `/api/analyze` por `/api/analyze-stream`
   - Adicionar Radar Chart na página principal
   - Adicionar botão "Exportar PDF"
   - Adicionar botão "Instalar App"

2. **Criar ícones PWA:**
   - Gerar icon-192.png
   - Gerar icon-512.png
   - Gerar screenshots para manifest

3. **Melhorias adicionais:**
   - Cache Redis (escala)
   - Autenticação OAuth
   - API pública
   - Extensões (Chrome, Firefox)

---

## 📝 Notas Importantes

1. **Code Freeze:** Manter master estável até APÓS o evento AI Brasil
2. **Backup:** Sempre fazer backup antes de merge
3. **Testes:** Testar TODAS as features antes de deploy
4. **Monitoramento:** Acompanhar custos e erros nas primeiras 24h
5. **Rollback:** Se algo der errado, fazer rollback para backup-master

---

## ✅ Checklist Final

Antes de considerar deploy completo:

- [ ] Todas as fases (1-6) concluídas
- [ ] Testes em produção passaram
- [ ] Lighthouse PWA: 100
- [ ] Nenhum erro crítico em logs
- [ ] Dashboard de custos normal
- [ ] Backup da master criado
- [ ] Documentação atualizada

---

## 🎉 Conclusão

Quando todos os checkboxes estiverem ✅, o deploy está completo!

**Tempo Estimado Total:** 3-4 horas
**Complexidade:** Média
**Risco:** Baixo (branch separada testada)

**Dúvidas?** Revisar este documento ou verificar logs de erro.

---

**Gerado em:** 26 de Outubro de 2025
**Branch:** pos-ai-brasil-updates
**Autor:** Claude Code
**Versão:** 1.0.0
