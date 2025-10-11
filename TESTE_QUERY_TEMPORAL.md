# 🧪 Guia de Teste - Sistema de Query Temporal

## 🎯 Objetivo

Testar se o sistema detecta e filtra corretamente queries com termos temporais, retornando apenas resultados da data específica solicitada.

## 📋 Pré-requisitos

1. Certifique-se de que todas as variáveis de ambiente estão configuradas:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=...
   SUPABASE_SERVICE_ROLE_KEY=...
   OPENAI_API_KEY=...
   TAVILY_API_KEY=...
   ```

2. Instale as dependências (se necessário):
   ```bash
   cd pluralview-mvp
   npm install
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

4. Acesse: http://localhost:3000

## 🧪 Casos de Teste

### Teste 1: Query com "Hoje" ⭐

**Query:**
```
Porque o bitcoin caiu hoje?
```

**Resultado Esperado:**
1. ✅ Banner azul "Filtro Temporal Ativo" aparece
2. ✅ Mostra: "Resultados de [data atual]"
3. ✅ Perspectivas mencionam apenas eventos de hoje
4. ✅ Fontes têm datas recentes ou keywords como "hoje", "2025"
5. ✅ Logs no console mostram:
   ```
   [Temporal] Detectado: "hoje"
   [Temporal Filter] Técnica: 15 resultados → X após filtro
   ```

**Como Validar:**
- Abra o DevTools (F12)
- Vá na aba "Console"
- Execute a query
- Verifique os logs `[Temporal]`

---

### Teste 2: Query com "Ontem"

**Query:**
```
Notícias de ontem sobre inteligência artificial
```

**Resultado Esperado:**
1. ✅ Banner mostra: "Resultados de [data de ontem]"
2. ✅ Perspectivas focam em eventos de ontem
3. ✅ Logs mostram detecção de "ontem"

---

### Teste 3: Query com "Essa Semana"

**Query:**
```
O que aconteceu essa semana no mercado financeiro?
```

**Resultado Esperado:**
1. ✅ Banner mostra: "Resultados de [7 dias atrás] a [hoje]"
2. ✅ Perspectivas cobrem eventos dos últimos 7 dias
3. ✅ Logs mostram período de 7 dias

---

### Teste 4: Query com "Recente"

**Query:**
```
Avanços recentes em energia renovável
```

**Resultado Esperado:**
1. ✅ Banner mostra: "Resultados de [3 dias atrás] a [hoje]"
2. ✅ Perspectivas focam em avanços dos últimos 3 dias
3. ✅ Logs mostram período de 3 dias

---

### Teste 5: Query SEM Termo Temporal (Controle)

**Query:**
```
Inteligência Artificial na educação
```

**Resultado Esperado:**
1. ❌ Banner temporal NÃO aparece
2. ✅ Funciona normalmente
3. ✅ Perspectivas gerais sobre o tema
4. ❌ Logs NÃO mostram `[Temporal]`

---

## 🔍 Verificação de Logs

### Logs Esperados no Console:

```bash
# Quando termo temporal é detectado:
[Temporal] Detectado: "hoje" - Resultados de 10 de outubro de 2025
[Temporal] Query original: "porque o bitcoin caiu hoje?"
[Temporal] Query aprimorada: "porque o bitcoin caiu hoje? 10/10/2025 outubro 2025 atualizado"

# Para cada perspectiva:
[Cache MISS] Técnica - buscando na web
[Temporal Search] Técnica: "porque o bitcoin caiu hoje? 10/10/2025..."
[Temporal Filter] Técnica: 15 resultados → 8 após filtro temporal

# Se poucos resultados:
[Temporal Filter] ⚠️ Popular: Poucos resultados após filtro temporal (2). Dados podem ser limitados.
```

### Como Acessar Logs:

1. Abra DevTools (F12)
2. Vá para aba "Console"
3. Execute uma query temporal
4. Procure por mensagens com `[Temporal]`

---

## 🎨 Verificação Visual da UI

### Banner Temporal Ativo:

Quando detectado, deve aparecer este banner:

```
┌─────────────────────────────────────────────┐
│ 🕐 Filtro Temporal Ativo                    │
│ Resultados de 10 de outubro de 2025        │
│ Os resultados foram filtrados para exibir   │
│ apenas informações deste período específico.│
└─────────────────────────────────────────────┘
```

**Características:**
- Cor de fundo: Azul escuro (`bg-blue-900/30`)
- Borda: Azul (`border-blue-500/50`)
- Ícone: Relógio ⏰
- Aparece logo após o título "Análise Completa"

---

## 📊 Comparação Antes vs Depois

### ANTES (Sem Sistema Temporal):

**Query:** "Porque o bitcoin caiu hoje?"

**Problemas:**
- ❌ Retorna artigos de 2023, 2024
- ❌ Mistura quedas antigas com quedas recentes
- ❌ Usuário precisa filtrar manualmente
- ❌ Baixa relevância

### DEPOIS (Com Sistema Temporal):

**Query:** "Porque o bitcoin caiu hoje?"

**Melhorias:**
- ✅ Retorna APENAS artigos de hoje
- ✅ Filtro automático por data
- ✅ Alta relevância
- ✅ Banner informando o filtro ativo
- ✅ Logs para debug

---

## 🐛 Problemas Comuns e Soluções

### 1. Banner não aparece

**Possível causa:** Termo temporal não reconhecido

**Solução:**
- Verifique os termos suportados em `TEMPORAL_QUERY_SYSTEM.md`
- Termos suportados: hoje, ontem, essa semana, recente, etc.

### 2. Poucos resultados após filtro

**Possível causa:** Eventos muito recentes com pouco conteúdo web

**Comportamento esperado:**
- Log de aviso: `⚠️ Poucos resultados após filtro temporal`
- AI menciona: "Dados limitados para este período"

### 3. Erro no temporal detector

**Possível causa:** Arquivo não importado corretamente

**Solução:**
```bash
# Verifique se o arquivo existe:
ls src/lib/temporalDetector.js

# Reinicie o servidor:
npm run dev
```

### 4. Cache retornando resultados antigos

**Solução:**
- Cache expira em 15 minutos automaticamente
- Ou limpe o cache manualmente reiniciando o servidor

---

## 📝 Checklist de Validação

Marque ✅ conforme testa cada item:

**Funcionalidades Core:**
- [ ] Detecta "hoje" corretamente
- [ ] Detecta "ontem" corretamente
- [ ] Detecta "essa semana" corretamente
- [ ] Detecta "recente" corretamente
- [ ] NÃO detecta quando não há termo temporal

**UI:**
- [ ] Banner temporal aparece quando detectado
- [ ] Banner mostra data correta
- [ ] Banner NÃO aparece quando não detectado
- [ ] Layout responsivo funciona

**Logs:**
- [ ] Logs `[Temporal]` aparecem no console
- [ ] Logs mostram query aprimorada
- [ ] Logs mostram filtro de resultados
- [ ] Logs mostram avisos quando poucos resultados

**Qualidade dos Resultados:**
- [ ] Fontes têm datas recentes
- [ ] Conteúdo das perspectivas menciona período correto
- [ ] AI evita informações desatualizadas
- [ ] Resultados são relevantes para a data solicitada

---

## 🎓 Exemplo de Teste Completo

### Passo a Passo:

1. **Abra o navegador em modo incógnito** (para evitar cache)

2. **Acesse:** http://localhost:3000

3. **Abra DevTools:** F12 → Console

4. **Digite a query:**
   ```
   Porque o bitcoin caiu hoje?
   ```

5. **Clique em "Analisar Perspectivas"**

6. **Observe no Console:**
   ```bash
   [Temporal] Detectado: "hoje" - Resultados de 10 de outubro de 2025
   [Temporal] Query aprimorada: "Porque o bitcoin caiu hoje? 10/10/2025..."
   [Cache MISS] Técnica - buscando na web
   [Temporal Search] Técnica: "Porque o bitcoin caiu hoje? 10/10/2025..."
   [Temporal Filter] Técnica: 15 resultados → 8 após filtro temporal
   ```

7. **Observe na UI:**
   - Banner azul com "Filtro Temporal Ativo"
   - Data de hoje mostrada
   - 6 perspectivas geradas

8. **Valide as Fontes:**
   - Clique em algumas fontes
   - Verifique se as datas são recentes
   - Verifique se o conteúdo é de hoje

9. **Valide o Conteúdo:**
   - Leia as perspectivas
   - Confirme que mencionam eventos de hoje
   - Verifique se há citações de fontes

10. **Teste Negativo:**
    - Faça uma query sem termo temporal: "IA na educação"
    - Confirme que o banner NÃO aparece
    - Confirme que NÃO há logs `[Temporal]`

---

## 📸 Screenshots Esperados

### 1. Banner Temporal Ativo
![Banner mostrando filtro temporal ativo com ícone de relógio]

### 2. Logs no Console
![Console mostrando logs [Temporal] com detecção e filtragem]

### 3. Perspectivas com Fontes Recentes
![Perspectivas mostrando análise com fontes datadas]

---

## 🚀 Testes Avançados

### Teste de Performance:

```bash
# Medir tempo de resposta com filtro temporal
console.time('Query Temporal')
// Execute query "porque o bitcoin caiu hoje?"
console.timeEnd('Query Temporal')

# Medir tempo sem filtro
console.time('Query Normal')
// Execute query "inteligência artificial"
console.timeEnd('Query Normal')

# Diferença esperada: +2-5 segundos (devido à filtragem extra)
```

### Teste de Edge Cases:

```javascript
// Teste 1: Múltiplos termos temporais
"O que aconteceu hoje e ontem?"
// Esperado: Detecta apenas "hoje"

// Teste 2: Termo no meio da frase
"Quero saber notícias sobre tecnologia de hoje"
// Esperado: Detecta "hoje"

// Teste 3: Termo em inglês
"Latest Bitcoin news today"
// Esperado: Detecta "today"

// Teste 4: Case insensitive
"PORQUE O BITCOIN CAIU HOJE?"
// Esperado: Detecta "hoje" normalmente
```

---

## ✅ Critérios de Aceitação

O teste é considerado **APROVADO** se:

1. ✅ Todos os 5 casos de teste passarem
2. ✅ Banner aparece corretamente quando detectado
3. ✅ Logs mostram detecção e filtragem
4. ✅ Resultados são relevantes para o período solicitado
5. ✅ Não quebra queries sem termo temporal
6. ✅ Performance aceitável (< 30 segundos por análise)

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs no console
2. Consulte `TEMPORAL_QUERY_SYSTEM.md` para detalhes técnicos
3. Verifique se todas as env vars estão configuradas
4. Reinicie o servidor de desenvolvimento

---

**Data do Teste:** _________
**Testador:** _________
**Status:** [ ] APROVADO [ ] REPROVADO
**Observações:** _________________________________________
