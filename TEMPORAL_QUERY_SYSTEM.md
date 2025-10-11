# 🕐 Sistema de Queries Temporais - PluralView

## 📋 Visão Geral

Este documento descreve o **Sistema de Detecção e Filtragem Temporal** implementado no PluralView MVP para resolver o problema de queries com termos temporais retornarem resultados desatualizados.

## ❌ Problema Original

Quando usuários faziam perguntas com termos temporais, a AI retornava informações antigas:

**Exemplo:**
- Query: "Porque o bitcoin caiu hoje?"
- ❌ Resultado anterior: Artigos sobre quedas do Bitcoin de 2023, 2024, etc.
- ✅ Resultado esperado: Apenas artigos do dia atual (2025-10-10)

**Causas:**
1. Tavily API não possui filtro de data nativo
2. Não havia detecção de termos temporais na query
3. Não havia validação de timestamps nos resultados
4. Cache retornava resultados antigos

## ✅ Solução Implementada

### 1. **Detector Temporal** (`src/lib/temporalDetector.js`)

Módulo que detecta e processa termos temporais em queries.

#### Termos Detectados:

| Termo | Padrão | Período | Exemplo |
|-------|--------|---------|---------|
| **Hoje** | `hoje, hj, today` | Dia atual | "o que aconteceu hoje?" |
| **Ontem** | `ontem, yesterday` | Dia anterior | "notícias de ontem" |
| **Semana** | `essa semana, última semana` | Últimos 7 dias | "o que rolou essa semana?" |
| **Mês** | `esse mês, último mês` | Últimos 30 dias | "mudanças deste mês" |
| **Recente** | `recente, atualmente, agora` | Últimos 3 dias | "notícias recentes" |

#### Funcionalidades:

```javascript
import { temporalDetector } from '@/lib/temporalDetector'

// Detectar termos temporais
const info = temporalDetector.detect("Porque o bitcoin caiu hoje?")

// Resultado:
{
  detected: true,
  type: 'hoje',
  label: 'hoje',
  startDate: Date(2025-10-10 00:00:00),
  endDate: Date(2025-10-10 23:59:59),
  days: 1,
  enhancedQuery: "Porque o bitcoin caiu hoje? 10/10/2025 outubro 2025 atualizado"
}
```

### 2. **Integração no Sistema de Busca**

#### Fluxo de Processamento:

```
1. Usuário envia query: "Porque o bitcoin caiu hoje?"
   ↓
2. TemporalDetector detecta "hoje"
   ↓
3. Gera enhanced query: "Porque o bitcoin caiu hoje? 10/10/2025 outubro 2025"
   ↓
4. Busca na Tavily com query aprimorada
   ↓
5. Filtra resultados por data
   ↓
6. Retorna apenas resultados do dia 10/10/2025
```

#### Código (`src/pages/api/analyze.js`):

```javascript
// 1. Detectar termos temporais
const temporalInfo = temporalDetector.detect(topic)

// 2. Passar informação temporal para busca
const { sources, searchContext } = await searchRealSources(
  topic,
  perspectiveName,
  perspectiveFocus,
  temporalInfo  // ← Nova informação
)

// 3. Usar enhanced query
if (temporalInfo && temporalInfo.detected) {
  searchQuery = `${temporalInfo.enhancedQuery} ${perspectiveName} ${perspectiveFocus}`
}

// 4. Buscar mais resultados para compensar filtros
const searchResult = await tavilyClient.search(searchQuery, {
  maxResults: 15  // ← Aumentado de 10 para 15
})

// 5. Filtrar resultados por data
if (temporalInfo && temporalInfo.detected) {
  results = results.filter(result =>
    temporalDetector.validateResult(result, temporalInfo)
  )
}
```

### 3. **Validação de Resultados**

O sistema valida se cada resultado está dentro do período solicitado usando duas estratégias:

#### Estratégia 1: Extração de Data

Extrai datas do conteúdo usando múltiplos padrões:

```javascript
// Padrões suportados:
- ISO: "2025-10-10"
- BR: "10/10/2025"
- Texto: "10 de outubro de 2025"
- Inglês: "Oct 10, 2025"
```

#### Estratégia 2: Keywords de Recência

Se não encontrar data explícita, verifica keywords que indicam conteúdo recente:

```javascript
const recentKeywords = [
  'hoje', 'agora', 'atualmente', 'ontem', 'recentemente',
  'breaking', 'latest', 'just now', '2025'
]

// Necessário 2+ keywords para considerar válido
```

### 4. **Contexto Temporal na IA**

O sistema adiciona contexto temporal aos prompts da OpenAI:

```javascript
⏰ IMPORTANTE - CONTEXTO TEMPORAL:
Esta consulta refere-se especificamente a: hoje
Período: Resultados de 10 de outubro de 2025
Data atual: 10 de outubro de 2025

INSTRUÇÕES TEMPORAIS:
- Foque APENAS em informações deste período específico
- Se os dados não forem recentes o suficiente, mencione isso explicitamente
- Priorize fontes com datas dentro do período solicitado
- NÃO use informações desatualizadas ou de períodos diferentes
```

### 5. **Interface do Usuário**

Quando uma query temporal é detectada, o sistema exibe um banner informativo:

```jsx
{/* Temporal Info Banner */}
{result.temporalInfo && result.temporalInfo.detected && (
  <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
    <p className="font-semibold">Filtro Temporal Ativo</p>
    <p>Resultados de 10 de outubro de 2025</p>
    <p className="text-xs">
      Os resultados foram filtrados para exibir apenas
      informações deste período específico.
    </p>
  </div>
)}
```

## 📊 Métricas e Logs

O sistema fornece logs detalhados para monitoramento:

```bash
[Temporal] Detectado: "hoje" - Resultados de 10 de outubro de 2025
[Temporal] Query original: "porque o bitcoin caiu hoje?"
[Temporal] Query aprimorada: "porque o bitcoin caiu hoje? 10/10/2025 outubro 2025 atualizado"
[Temporal Search] Técnica: "porque o bitcoin caiu hoje? 10/10/2025 outubro 2025 atualizado Técnica aspectos técnicos"
[Temporal Filter] Técnica: 15 resultados → 8 após filtro temporal
[Temporal Filter] Popular: 15 resultados → 6 após filtro temporal
```

## 🔍 Edge Cases e Tratamento

### 1. **Poucos Resultados Após Filtro**

```javascript
if (results.length < 3) {
  console.warn(`Poucos resultados após filtro temporal (${results.length}). Dados podem ser limitados.`)
}
```

A IA é instruída a mencionar explicitamente se os dados não forem recentes o suficiente.

### 2. **Cache com Queries Temporais**

O cache é limpo automaticamente a cada 15 minutos para evitar resultados desatualizados em queries temporais.

### 3. **Erro na Extração de Data**

Se houver erro ao extrair/validar data, o resultado não é descartado (fail-safe).

```javascript
try {
  return validateDate(result)
} catch (error) {
  console.warn('Error validating result date:', error)
  return true  // Não descartar em caso de erro
}
```

### 4. **Múltiplos Termos Temporais**

O sistema detecta o primeiro termo temporal encontrado:

```javascript
// Query: "o que aconteceu hoje e ontem?"
// Detecta: "hoje" (primeira ocorrência)
```

## 🧪 Testes

### Queries de Teste:

```javascript
// Teste 1: Hoje
"Porque o bitcoin caiu hoje?"
// Esperado: Apenas resultados de 2025-10-10

// Teste 2: Ontem
"Notícias de ontem sobre IA"
// Esperado: Apenas resultados de 2025-10-09

// Teste 3: Essa semana
"O que aconteceu essa semana no mercado?"
// Esperado: Resultados dos últimos 7 dias

// Teste 4: Recente
"Avanços recentes em energia renovável"
// Esperado: Resultados dos últimos 3 dias

// Teste 5: Sem termo temporal
"Inteligência Artificial na educação"
// Esperado: Funciona normalmente, sem filtro
```

## 📈 Benefícios

1. ✅ **Precisão**: Resultados alinhados com a data solicitada
2. ✅ **Relevância**: Informações atualizadas e contextualizadas
3. ✅ **Transparência**: Usuário vê claramente que há filtro temporal ativo
4. ✅ **Inteligência**: Sistema entende linguagem natural temporal
5. ✅ **Robustez**: Múltiplas estratégias de validação

## 🔧 Manutenção

### Adicionar Novo Termo Temporal:

```javascript
// Em src/lib/temporalDetector.js

this.patterns = {
  // ... patterns existentes

  // Novo padrão
  ultimasHoras: {
    regex: /\b(últimas horas|últimas 24h|last 24 hours)\b/gi,
    getDates: () => {
      const end = new Date()
      const start = new Date()
      start.setHours(start.getHours() - 24)
      return {
        start: this.getStartOfDay(start),
        end: this.getEndOfDay(end),
        label: 'últimas 24 horas',
        days: 1
      }
    }
  }
}
```

## 🚨 Limitações Conhecidas

1. **Tavily API**: Não possui filtro de data nativo, dependemos de heurísticas
2. **Extração de Data**: Pode falhar em formatos não reconhecidos
3. **Idiomas**: Otimizado para Português e Inglês
4. **Cache**: Pode retornar dados desatualizados se não expirado

## 📚 Referências

- **Arquivo Principal**: `src/lib/temporalDetector.js`
- **Integração**: `src/pages/api/analyze.js:48-55, 165-218, 370-428`
- **UI**: `src/pages/index.js:483-499`

## 👨‍💻 Autor

Sistema implementado para resolver queries temporais no PluralView MVP.
Data: 2025-10-10

---

**Status**: ✅ Implementado e Testado
**Versão**: 1.0.0
