# ✅ Checklist Pré-AI Brasil 2025

**Data de criação:** 21/10/2025
**Evento:** AI Brasil 2025
**Estratégia:** Code Freeze + Validação do Sistema Atual

---

## 🎯 Objetivo

Garantir que o PluralView MVP esteja **estável, testado e confiável** para o evento AI Brasil, **SEM arriscar deploys de última hora**.

---

## ❄️ CODE FREEZE ATIVO

**Status:** 🔴 CONGELADO até após AI Brasil
**Branch em produção:** `main` (versão estável atual)
**Branch de melhorias:** `melhorias-pluralview` (pausada)

### Regras do Code Freeze

```
✅ PERMITIDO:
- Hotfixes críticos de bugs (apenas se sistema quebrar)
- Ajustes de textos/labels
- Configuração de variáveis de ambiente
- Documentação
- Testes locais (sem deploy)

❌ PROIBIDO:
- Deploy de novas features
- Refatorações grandes
- Atualização de dependências
- Mudanças em APIs
- Alterações de arquitetura
```

---

## 📝 Checklist de Validação (Executar 2-3 dias antes do evento)

### 1. ✅ Verificação de Infraestrutura

- [ ] **Vercel:** Dashboard sem erros
  ```bash
  # Acessar: https://vercel.com/dashboard
  # Verificar: Último deploy bem-sucedido
  # Verificar: Sem erros nos logs
  ```

- [ ] **Supabase:** Banco de dados operacional
  ```bash
  # Acessar: https://supabase.com/dashboard
  # Verificar: Database online
  # Verificar: Espaço disponível (< 400MB usado de 500MB)
  # Verificar: RLS ativo
  ```

- [ ] **Variáveis de ambiente:** Todas configuradas
  ```bash
  # No Vercel Dashboard → Settings → Environment Variables
  # Verificar presença de:
  ✅ NEXT_PUBLIC_SUPABASE_URL
  ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
  ✅ SUPABASE_SERVICE_ROLE_KEY
  ✅ OPENAI_API_KEY
  ✅ ANTHROPIC_API_KEY
  ✅ TAVILY_API_KEY
  ✅ NEXT_PUBLIC_APP_URL
  ```

- [ ] **DNS/Domínio:** Resolvendo corretamente
  ```bash
  # Testar URL de produção
  # Verificar certificado SSL válido
  # Verificar redirecionamentos funcionando
  ```

---

### 2. ✅ Testes Funcionais em Produção

**URL de Produção:** [sua-url-aqui]

#### 2.1 Teste de Análise Básica

- [ ] **Teste 1: Tópico simples**
  ```
  Input: "Inteligência Artificial na educação"

  Verificar:
  ✅ 6 perspectivas geradas
  ✅ Tempo < 20 segundos
  ✅ Trust scores exibidos
  ✅ Vieses detectados
  ✅ 5 perguntas reflexivas
  ✅ Fontes listadas
  ✅ Sem erros no console
  ```

- [ ] **Teste 2: Tópico temporal**
  ```
  Input: "Eleições presidenciais 2024"

  Verificar:
  ✅ Detecção temporal funcionando
  ✅ Fontes recentes priorizadas
  ✅ Query aprimorada gerada
  ```

- [ ] **Teste 3: Tópico brasileiro**
  ```
  Input: "Reforma tributária no Brasil"

  Verificar:
  ✅ Fontes brasileiras incluídas
  ✅ Contexto local relevante
  ✅ Perspectivas adaptadas ao Brasil
  ```

#### 2.2 Teste de Funcionalidades Secundárias

- [ ] **Comparação de perspectivas**
  ```
  1. Realizar análise
  2. Selecionar 2-3 perspectivas
  3. Clicar "Comparar Perspectivas"

  Verificar:
  ✅ Modal/página de comparação abre
  ✅ Diferenças destacadas
  ✅ Análise comparativa gerada
  ```

- [ ] **Feedback de fontes**
  ```
  1. Clicar em 👍 ou 👎 em uma fonte

  Verificar:
  ✅ Feedback registrado
  ✅ UI atualizada
  ✅ Sem erros no console
  ```

- [ ] **Copiar perspectiva**
  ```
  1. Clicar no botão de copiar em uma perspectiva

  Verificar:
  ✅ Texto copiado para clipboard
  ✅ Mensagem de confirmação exibida
  ```

- [ ] **Histórico de análises** (se implementado)
  ```
  Verificar:
  ✅ Análises anteriores listadas
  ✅ Possível recarregar análise
  ```

#### 2.3 Teste de Temas e Sugestões

- [ ] **Tópicos sugeridos**
  ```
  Testar cada tópico sugerido:
  ✅ "Inteligência Artificial na educação"
  ✅ "Energia renovável no Brasil"
  ✅ "Trabalho remoto vs presencial"
  ✅ "Redes sociais e saúde mental"
  ✅ "Criptomoedas como investimento"
  ✅ "Mudanças climáticas"
  ```

- [ ] **Alternância de tema claro/escuro** (se implementado)
  ```
  Verificar:
  ✅ Tema alterna corretamente
  ✅ Cores legíveis em ambos
  ✅ Preferência salva
  ```

---

### 3. ✅ Testes de Carga e Limites

- [ ] **Rate Limiting**
  ```
  Teste: Fazer 6+ requisições em 1 minuto

  Esperado:
  ✅ Primeiras 5 requisições: sucesso
  ✅ 6ª requisição: erro 429 (Too Many Requests)
  ✅ Mensagem clara para usuário
  ✅ Após 1 minuto: volta a funcionar
  ```

- [ ] **Timeout**
  ```
  Teste: Tópico complexo que pode demorar
  Input: "Análise completa do sistema econômico global pós-pandemia"

  Verificar:
  ✅ Sistema responde em < 30s OU
  ✅ Erro de timeout claro para usuário
  ```

- [ ] **Validação de input**
  ```
  Testes:
  1. Input vazio → Erro esperado ✅
  2. Input muito curto (< 3 chars) → Erro esperado ✅
  3. Input muito longo (> 500 chars) → Erro esperado ✅
  4. Caracteres especiais → Sanitizado ✅
  5. SQL injection tentativa → Bloqueado ✅
  ```

---

### 4. ✅ Monitoramento de Custos

- [ ] **Dashboard de custos acessível**
  ```bash
  URL: [sua-url]/admin/costs

  Verificar:
  ✅ Dashboard carrega
  ✅ Autenticação admin funcionando (se configurada)
  ✅ Dados de custos exibidos
  ✅ Gráficos renderizando
  ```

- [ ] **Custo médio por análise**
  ```
  Acessar dashboard e verificar:

  Meta: ~$0.0171/análise
  Aceitável: $0.015 - $0.025
  Alerta se: > $0.030

  Custo atual: $________
  Status: ✅ OK / ⚠️ Atenção / 🔴 Alto
  ```

- [ ] **Projeção para o evento**
  ```
  Estimativa: 150 análises durante AI Brasil
  Custo esperado: ~$2.57

  Verificar saldo nas APIs:
  ✅ Anthropic (Claude): $________
  ✅ OpenAI (GPT): $________
  ✅ Tavily (Search): _______ buscas disponíveis

  Ação: Adicionar créditos se necessário
  ```

---

### 5. ✅ Testes de Responsividade

- [ ] **Desktop (1920x1080)**
  ```
  Navegador: Chrome, Firefox, Edge
  Verificar:
  ✅ Layout correto
  ✅ Todas as colunas visíveis
  ✅ Sem overflow horizontal
  ```

- [ ] **Tablet (iPad - 768x1024)**
  ```
  Verificar:
  ✅ Layout adaptado
  ✅ Cards empilhados corretamente
  ✅ Botões acessíveis
  ```

- [ ] **Mobile (iPhone - 375x667)**
  ```
  Verificar:
  ✅ Layout mobile-first
  ✅ Texto legível sem zoom
  ✅ Botões com tamanho adequado (min 44px)
  ✅ Scroll suave
  ✅ Sem elementos cortados
  ```

---

### 6. ✅ Segurança e Performance

- [ ] **Headers de segurança**
  ```bash
  # Testar em: https://securityheaders.com

  Verificar presença de:
  ✅ Strict-Transport-Security
  ✅ X-Frame-Options
  ✅ X-Content-Type-Options
  ✅ X-XSS-Protection
  ✅ Referrer-Policy
  ✅ Content-Security-Policy

  Score esperado: A ou A+
  ```

- [ ] **SSL/TLS**
  ```bash
  # Testar em: https://www.ssllabs.com/ssltest/

  Verificar:
  ✅ Certificado válido
  ✅ HTTPS em todas as páginas
  ✅ Sem mixed content
  ✅ Grade mínima: A-
  ```

- [ ] **Performance**
  ```bash
  # Testar em: https://pagespeed.web.dev/

  Métricas aceitáveis:
  ✅ First Contentful Paint: < 2s
  ✅ Largest Contentful Paint: < 4s
  ✅ Time to Interactive: < 5s
  ✅ Cumulative Layout Shift: < 0.1

  Score mobile: > 60
  Score desktop: > 80
  ```

---

### 7. ✅ Logs e Monitoramento

- [ ] **Vercel Logs**
  ```bash
  # Dashboard → Logs

  Verificar nos últimos 7 dias:
  ✅ Sem erros 5xx em produção
  ✅ Erros 4xx esperados (rate limit, validação)
  ✅ Tempo médio de resposta < 15s
  ✅ Sem memory leaks
  ```

- [ ] **Supabase Logs**
  ```bash
  # Dashboard → Database → Logs

  Verificar:
  ✅ Queries executando corretamente
  ✅ Sem slow queries (> 5s)
  ✅ Connections estáveis
  ```

- [ ] **Erros no Console (Browser)**
  ```bash
  # DevTools → Console

  Ao usar a aplicação, verificar:
  ✅ Sem erros críticos em vermelho
  ⚠️ Warnings aceitáveis (Next.js, third-party)
  ✅ Sem failed requests
  ```

---

### 8. ✅ Preparação do Ambiente

- [ ] **Credenciais de acesso organizadas**
  ```
  Documentar e ter à mão:
  ✅ URL de produção
  ✅ Vercel login
  ✅ Supabase login
  ✅ Dashboards de APIs (Anthropic, OpenAI, Tavily)
  ✅ Admin credentials (se necessário)
  ```

- [ ] **Plano de contingência**
  ```
  Preparar:
  ✅ Contato do suporte Vercel
  ✅ Contato do suporte Supabase
  ✅ Backup de demonstração (vídeo/screenshots)
  ✅ Script de apresentação (se API cair)
  ```

- [ ] **Comunicação preparada**
  ```
  Ter pronto:
  ✅ Pitch de 2 minutos
  ✅ Slides de apoio (opcional)
  ✅ Exemplos de tópicos interessantes
  ✅ Respostas para perguntas frequentes
  ```

---

## 🔥 Plano de Contingência (Se algo quebrar)

### Cenário 1: API de IA fora do ar

**Sintoma:** Erros ao gerar perspectivas

**Ação:**
1. Verificar saldo/quota nas APIs (Anthropic/OpenAI)
2. Se quota esgotada: adicionar créditos imediatamente
3. Se API down: usar backup de demonstração

### Cenário 2: Rate limit muito restritivo

**Sintoma:** Muitos erros 429 durante demonstração

**Ação Temporária:**
```javascript
// Em src/lib/rateLimit.js (APENAS DURANTE EVENTO)
const analyzeRateLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minuto
  uniqueTokenPerInterval: 500,
  tokensPerInterval: 20, // Aumentar de 5 para 20 TEMPORARIAMENTE
})
```

**Lembrar:** Reverter após evento!

### Cenário 3: Supabase offline

**Sintoma:** Erros de database, custos não salvos

**Impacto:** Funcionalidade principal CONTINUA funcionando (análises não dependem de DB para gerar)

**Ação:**
1. Análises continuam funcionando normalmente
2. Dashboard de custos ficará indisponível
3. Não é crítico para demonstração

### Cenário 4: Vercel deployment quebrado

**Sintoma:** Site fora do ar

**Ação:**
1. Vercel Dashboard → Deployments → Rollback para deployment anterior
2. Se não resolver: usar ambiente local
   ```bash
   cd pluralview-mvp
   npm run build
   npm start
   # Expor com ngrok se necessário
   ```

---

## 📊 Métricas de Sucesso do Evento

### Durante o AI Brasil

**Monitorar (se possível):**
- [ ] Total de análises realizadas: _______
- [ ] Tempo médio por análise: _______ segundos
- [ ] Taxa de sucesso: _______% (meta: > 95%)
- [ ] Custo total do evento: $_______ (meta: < $5)

### Feedback Qualitativo

- [ ] Perguntas recebidas: _______
- [ ] Interesse demonstrado: Alta / Média / Baixa
- [ ] Sugestões de melhoria: _______
- [ ] Possíveis parcerias/leads: _______

---

## ✅ Checklist Final (1 dia antes do evento)

### Preparação Técnica
- [ ] Todos os testes acima executados e OK
- [ ] Créditos de API suficientes
- [ ] Credenciais de acesso organizadas
- [ ] Laptop/dispositivo de apresentação testado
- [ ] Conexão de internet backup disponível

### Preparação de Conteúdo
- [ ] Tópicos de exemplo testados e funcionando
- [ ] Pitch ensaiado (2 min)
- [ ] Respostas para FAQs preparadas
- [ ] Demonstração cronometrada (< 5 min)

### Preparação Pessoal
- [ ] Roupa adequada separada
- [ ] Horário e local do evento confirmados
- [ ] Transporte planejado (chegar 30 min antes)
- [ ] Contatos de emergência salvos

---

## 🚀 Após o AI Brasil

### Coleta de Feedback
- [ ] Registrar todo feedback recebido
- [ ] Anotar bugs/problemas encontrados
- [ ] Listar features mais solicitadas
- [ ] Documentar perguntas frequentes

### Análise de Dados
- [ ] Revisar logs de uso durante evento
- [ ] Analisar custos reais vs. projetados
- [ ] Identificar gargalos de performance
- [ ] Avaliar taxa de sucesso/falha

### Próximos Passos
- [ ] Priorizar melhorias baseadas em feedback
- [ ] **ENTÃO fazer deploy da branch `melhorias-pluralview`**
- [ ] Implementar features mais solicitadas
- [ ] Resolver bugs críticos encontrados

---

## 📝 Notas e Observações

**Data da última verificação:** __________

**Testes executados por:** __________

**Status geral:**
- [ ] 🟢 Tudo OK - Pronto para o evento
- [ ] 🟡 Pequenos ajustes necessários
- [ ] 🔴 Problemas críticos encontrados

**Problemas encontrados:**
```
1. ___________________________________
2. ___________________________________
3. ___________________________________
```

**Ações tomadas:**
```
1. ___________________________________
2. ___________________________________
3. ___________________________________
```

---

## 🎯 Mantra do Evento

```
"O sistema atual está funcionando.
Não vamos arriscar deploy de última hora.
Foco total na demonstração e no feedback.
Melhorias técnicas vêm DEPOIS do sucesso do evento."
```

---

**Boa sorte no AI Brasil 2025! 🚀🇧🇷**
