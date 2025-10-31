# 🤖 PERSONALIZAÇÃO DE PROMPTS PARA B2B

**Data:** 29 de Outubro de 2025
**Objetivo:** Adaptar prompts das AIs para mercado B2B (VCs + Consultorias)

---

## 📍 ONDE ESTÃO OS PROMPTS

**Arquivo:** `src/pages/api/analyze.js`

**Funções principais:**
1. **`generatePerspectives`** (linha 547-692) - Gera as 6 perspectivas
2. **`generateReflectiveQuestions`** (linha 694-733) - Gera perguntas reflexivas

---

## 🎯 PERSONALIZAÇÃO NÍVEL 1: CONTEXTO B2B (Rápido - 5 min)

### Modificar linha 580-616 (Prompt de Análise)

**ADICIONAR no início do prompt (após linha 581):**

```javascript
const prompt = `Você é um analista especializado em Business Intelligence para VCs e Consultorias Estratégicas.

🎯 CONTEXTO B2B:
Este tópico está sendo analisado para decisões de negócio de alto valor:
- VCs analisando startups para investimento de milhões
- Consultorias preparando relatórios estratégicos para clientes
- Decisões precisam ser baseadas em DADOS, não opiniões
- ROI e impacto financeiro são críticos

TEMA EXATO A SER ANALISADO: "${topic}"
${temporalContext}
PERSPECTIVA A ANALISAR: ${pt.name}
FOCO: ${pt.focus}

CONTEXTO DE FONTES REAIS ENCONTRADAS:
${searchContext || 'Nenhum contexto específico encontrado. Use seu conhecimento geral.'}

INSTRUÇÕES IMPORTANTES PARA ANÁLISE B2B:
- Foque em IMPACTO FINANCEIRO, REGULATÓRIO e COMPETITIVO
- Priorize DADOS QUANTIFICÁVEIS (números, percentuais, valores)
- Identifique RISCOS e OPORTUNIDADES de negócio
- Mencione PRECEDENTES relevantes (casos reais, estudos)
- **CITE EXPLICITAMENTE as fontes fornecidas acima quando relevantes**
- Use expressões como: "Segundo [fonte]...", "Estudos indicam que...", "De acordo com..."
- Se mencionar um dado específico, referencie a fonte
- Escreva 2-3 parágrafos focados e bem fundamentados
- Tom profissional, objetivo, sem sensacionalismo

⚠️ DETECÇÃO DE VIESES PARA B2B:
Identifique vieses que podem AFETAR DECISÕES DE INVESTIMENTO:
- Vieses ideológicos que mascarem riscos reais
- Conflitos de interesse (quem financia? quem lucra?)
- Dados cherry-picked (seletividade nos dados)
- Limitações metodológicas que invalidem conclusões
- Perspectivas de stakeholders importantes ausentes
- Suposições não testadas sobre mercado/regulação

FORMATO DE RESPOSTA OBRIGATÓRIO:
[ANÁLISE]
Seu texto de 2-3 parágrafos aqui...

[VIESES]
- Viés 1: descrição
- Viés 2: descrição
(Se não houver vieses significativos, escreva "Nenhum viés significativo identificado")`
```

---

## 🎯 PERSONALIZAÇÃO NÍVEL 2: PERSPECTIVAS B2B (Médio - 10 min)

### Modificar linha 548-555 (Tipos de Perspectivas)

**MUDAR de:**
```javascript
const perspectiveTypes = [
  { type: 'tecnica', name: 'Técnica', focus: 'aspectos técnicos, dados, evidências científicas' },
  { type: 'popular', name: 'Popular', focus: 'senso comum, impacto no dia a dia das pessoas' },
  { type: 'institucional', name: 'Institucional', focus: 'posição de instituições, órgãos oficiais, governos' },
  { type: 'academica', name: 'Acadêmica', focus: 'teorias, pesquisas, visão científica e universitária' },
  { type: 'conservadora', name: 'Conservadora', focus: 'tradição, valores conservadores, cautela com mudanças' },
  { type: 'progressista', name: 'Progressista', focus: 'mudança social, inovação, justiça e equidade' }
]
```

**PARA (versão B2B):**
```javascript
const perspectiveTypes = [
  {
    type: 'tecnica',
    name: 'Técnica',
    focus: 'dados quantificáveis, evidências científicas, métricas objetivas. Priorize: números de mercado, estudos técnicos, análises quantitativas.'
  },
  {
    type: 'mercado', // NOVO! (antes era 'popular')
    name: 'Mercado',
    focus: 'percepção de consumidores, adoção de mercado, sentiment de investidores, demanda real. Priorize: pesquisas de mercado, tendências de consumo, dados de adoção.'
  },
  {
    type: 'regulatoria', // NOVO! (antes era 'institucional')
    name: 'Regulatória',
    focus: 'riscos legais, compliance, mudanças regulatórias iminentes, precedentes jurídicos. Priorize: legislação vigente, consultas públicas, decisões de órgãos reguladores.'
  },
  {
    type: 'academica',
    name: 'Acadêmica',
    focus: 'pesquisas peer-reviewed, teorias validadas, estudos de universidades. Priorize: papers científicos, meta-análises, consensus acadêmico.'
  },
  {
    type: 'risco', // NOVO! (antes era 'conservadora')
    name: 'Riscos',
    focus: 'cenários pessimistas, red flags, precedentes de falhas, cautela com hype. Priorize: casos de fracasso, análise de riscos, due diligence negativa.'
  },
  {
    type: 'oportunidade', // NOVO! (antes era 'progressista')
    name: 'Oportunidades',
    focus: 'potencial de crescimento, inovação disruptiva, early mover advantage. Priorize: cases de sucesso, tendências emergentes, TAM/SAM/SOM.'
  }
]
```

**🔥 Impacto:** Isso muda COMPLETAMENTE o foco das análises para B2B!

---

## 🎯 PERSONALIZAÇÃO NÍVEL 3: PERGUNTAS B2B (Rápido - 5 min)

### Modificar linha 699-709 (Prompt de Perguntas)

**MUDAR de:**
```javascript
const prompt = `Baseado nestas perspectivas sobre "${topic}":

${perspectivesText}

Gere 5 perguntas reflexivas que:
1. Estimulem pensamento crítico
2. Conectem diferentes perspectivas
3. Incentivem o leitor a formar sua própria opinião
4. Sejam abertas (sem resposta certa/errada)

Formato: Uma pergunta por linha, sem numeração.`
```

**PARA (versão B2B):**
```javascript
const prompt = `Baseado nestas perspectivas sobre "${topic}":

${perspectivesText}

Gere 5 perguntas estratégicas para decisores de negócio (VCs e Consultores) que:
1. Conectem riscos e oportunidades identificados
2. Explorem trade-offs entre diferentes perspectivas
3. Desafiem suposições implícitas na análise
4. Foquem em AÇÃO (O que fazer com essa informação?)
5. Considerem impacto financeiro e timing

EXEMPLOS DE BOAS PERGUNTAS B2B:
- "Dado o risco regulatório X, qual o timing ideal para investir neste setor?"
- "Como as oportunidades de mercado se balanceiam com os riscos técnicos identificados?"
- "Quais stakeholders ausentes desta análise poderiam mudar o cenário competitivo?"

Formato: Uma pergunta por linha, sem numeração. Seja direto e objetivo.`
```

---

## 🚀 COMO APLICAR AS MUDANÇAS (URGENTE)

### Opção A: Mudança Simples (5 minutos) - RECOMENDADO PARA AMANHÃ

**Só adicionar contexto B2B no prompt principal:**

1. Abrir `src/pages/api/analyze.js`
2. Linha 580: Adicionar o contexto B2B antes de "TEMA EXATO"
3. Salvar
4. Testar uma análise

**Prós:** Rápido, baixo risco
**Contras:** Não muda as perspectivas (ainda terá "Popular" em vez de "Mercado")

---

### Opção B: Mudança Completa (15 minutos) - FAZER DEPOIS DO EVENTO

**Mudar perspectivas + prompts:**

1. Backup do arquivo original
2. Aplicar todas as 3 personalizações acima
3. Testar 3 análises diferentes
4. Ajustar se necessário

**Prós:** Produto 100% B2B
**Contras:** Mais arriscado um dia antes do evento

---

## 💡 MINHA RECOMENDAÇÃO PARA AMANHÃ

### AGORA (hoje à noite):
1. ✅ **Só adicione o contexto B2B** (Nível 1) - 5 min
2. ✅ **Teste com 3 tópicos B2B** (veja lista abaixo) - 10 min
3. ✅ **Escolha 1 para demo de amanhã** - 2 min
4. ✅ **Pratique apresentação 2x** - 20 min
5. ✅ **DURMA BEM** 😴

### DEPOIS DO EVENTO (com calma):
1. Aplicar mudanças completas (Nível 2 + 3)
2. Criar sistema de prompts personalizados por perfil
3. A/B testing de diferentes prompts
4. Fine-tuning com feedback de clientes

---

## 🎯 TÓPICOS B2B PARA TESTAR (Escolha 1 para Demo)

### Opção 1: Due Diligence de Fintech 💰
**Query:** "Regulação de criptomoedas no Brasil 2025 - riscos para fintechs"

**Por que é boa:**
- Tema quente (regulação)
- Risco alto ($milhões)
- Múltiplas perspectivas claras
- Trust score vai variar muito

---

### Opção 2: Consultoria Estratégica 🚗
**Query:** "Carros elétricos no Brasil 2025 - viabilidade de mercado"

**Por que é boa:**
- Tema familiar para plateia
- Oportunidade vs Risco claros
- Dados quantificáveis (vendas, preços)
- Múltiplos stakeholders

---

### Opção 3: Setor Tech 🤖
**Query:** "Inteligência Artificial no Brasil - regulação e oportunidades 2025"

**Por que é boa:**
- SUPER relevante para AI Brasil!
- Plateia vai se identificar
- Tema do momento
- Meta (falando de IA numa conferência de IA)

---

## 🔥 EXEMPLO DE RESULTADO COM PROMPT B2B

### ANTES (prompt genérico):
```
Perspectiva Técnica:
"A inteligência artificial é uma tecnologia que usa algoritmos
para processar dados. Existem vários tipos como machine learning
e deep learning..."
```

### DEPOIS (prompt B2B):
```
Perspectiva Técnica:
"Segundo relatório da McKinsey (2024), IA generativa pode adicionar
$4.4 trilhões ao PIB global. No Brasil, estudo da FGV estima impacto
de R$230 bilhões até 2030. Dados do Gartner indicam que 65% das
empresas brasileiras planejam investir em IA em 2025, com orçamento
médio de R$2-5 milhões. Principais aplicações: automação de atendimento
(ROI de 300%), análise preditiva (redução de 40% em custos operacionais),
e personalização (aumento de 25% em conversão)."
```

**Diferença:** DADOS, FONTES, ROI, NÚMEROS! 🎯

---

## ⚡ SCRIPT PARA APLICAR MUDANÇA NÍVEL 1 (5 MIN)

```bash
# 1. Fazer backup
cd "C:\Users\paulo\OneDrive\Desktop\pluralview-mvp"
cp src/pages/api/analyze.js src/pages/api/analyze.js.backup

# 2. Editar arquivo
# (você vai usar a ferramenta Edit)

# 3. Testar
npm run dev
# Acesse localhost:3000 e teste uma análise

# 4. Se der erro, restaurar backup
cp src/pages/api/analyze.js.backup src/pages/api/analyze.js
```

---

## 🎬 QUAL MUDANÇA FAZER AGORA?

**Para amanhã:**
- [ ] Nível 1 (contexto B2B) - 5 min ✅ RECOMENDADO
- [ ] Nível 2 (perspectivas B2B) - 10 min ⚠️ ARRISCADO
- [ ] Nível 3 (perguntas B2B) - 5 min ⚠️ ARRISCADO

**Depois do evento:**
- [ ] Todos os níveis + fine-tuning
- [ ] Sistema de prompts por perfil (VC vs Consultoria)
- [ ] A/B testing de variações

---

## 💬 RESPOSTA RÁPIDA

**"Posso treinar as AIs com mais prompt?"**

✅ **SIM!** E é SUPER fácil. Os prompts estão em texto simples no código.

**"Personalizar para esse mercado?"**

✅ **SIM!** Acabei de criar 3 níveis de personalização acima.

**"Fazer agora ou depois do evento?"**

⚡ **HOJE:** Só Nível 1 (contexto B2B) - baixo risco, alto impacto
🔧 **DEPOIS:** Níveis 2 e 3 - mudanças estruturais

---

## 🚨 DECISÃO URGENTE

Quer que eu **aplique o Nível 1 AGORA** (5 minutos)?

Isso vai fazer as análises focarem em:
- Impacto financeiro
- Riscos de negócio
- Dados quantificáveis
- Tom profissional

**Ou prefere deixar como está e focar só no pitch B2B?**

A mudança é reversível (backup automático).

**Responde:** "aplica nível 1" ou "deixa como está"
