import { createClient } from '@supabase/supabase-js'
import { optionalAuth } from '../../lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Autenticação opcional
  await optionalAuth(req)

  // TODO: Em produção, adicionar verificação de admin/autenticação
  // if (!req.user || !req.user.isAdmin) {
  //   return res.status(403).json({ error: 'Forbidden' })
  // }

  try {
    const { period = '7d', groupBy = 'day' } = req.query

    // Calcular data de início baseado no período
    const now = new Date()
    let startDate = new Date()

    switch (period) {
      case '24h':
        startDate.setHours(now.getHours() - 24)
        break
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      default:
        startDate.setDate(now.getDate() - 7)
    }

    // 1. Estatísticas gerais do período
    const { data: summary, error: summaryError } = await supabase
      .from('api_costs')
      .select('cost_usd, total_tokens, operation_type, model, created_at')
      .gte('created_at', startDate.toISOString())

    if (summaryError) throw summaryError

    // Calcular totais
    const totalCost = summary.reduce((acc, row) => acc + parseFloat(row.cost_usd || 0), 0)
    const totalTokens = summary.reduce((acc, row) => acc + parseInt(row.total_tokens || 0), 0)
    const totalOperations = summary.length

    // 2. Custo por modelo
    const costByModel = summary.reduce((acc, row) => {
      const model = row.model || 'unknown'
      if (!acc[model]) {
        acc[model] = { cost: 0, operations: 0, tokens: 0 }
      }
      acc[model].cost += parseFloat(row.cost_usd || 0)
      acc[model].operations += 1
      acc[model].tokens += parseInt(row.total_tokens || 0)
      return acc
    }, {})

    // 3. Custo por tipo de operação
    const costByOperation = summary.reduce((acc, row) => {
      const operation = row.operation_type || 'unknown'
      if (!acc[operation]) {
        acc[operation] = { cost: 0, operations: 0, tokens: 0 }
      }
      acc[operation].cost += parseFloat(row.cost_usd || 0)
      acc[operation].operations += 1
      acc[operation].tokens += parseInt(row.total_tokens || 0)
      return acc
    }, {})

    // 4. Série temporal (agrupamento por dia/hora)
    const timeSeriesData = summary.reduce((acc, row) => {
      const date = new Date(row.created_at)
      let key

      if (groupBy === 'hour' || period === '24h') {
        // Agrupar por hora
        key = date.toISOString().substring(0, 13) + ':00:00Z'
      } else {
        // Agrupar por dia
        key = date.toISOString().substring(0, 10)
      }

      if (!acc[key]) {
        acc[key] = { cost: 0, operations: 0, tokens: 0 }
      }
      acc[key].cost += parseFloat(row.cost_usd || 0)
      acc[key].operations += 1
      acc[key].tokens += parseInt(row.total_tokens || 0)
      return acc
    }, {})

    // Converter para array e ordenar
    const timeSeries = Object.entries(timeSeriesData)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // 5. Top 10 análises mais caras
    const { data: topAnalyses, error: topError } = await supabase
      .from('api_costs')
      .select('analysis_id, analyses(topic)')
      .gte('created_at', startDate.toISOString())
      .not('analysis_id', 'is', null)

    if (topError) throw topError

    const analysisCosts = topAnalyses.reduce((acc, row) => {
      const id = row.analysis_id
      if (!acc[id]) {
        acc[id] = {
          analysisId: id,
          topic: row.analyses?.topic || 'Unknown',
          cost: 0,
          operations: 0
        }
      }
      acc[id].operations += 1
      return acc
    }, {})

    // Buscar custos por análise
    for (const id in analysisCosts) {
      const { data: costs, error: costsError } = await supabase
        .from('api_costs')
        .select('cost_usd')
        .eq('analysis_id', id)
        .gte('created_at', startDate.toISOString())

      if (!costsError && costs) {
        analysisCosts[id].cost = costs.reduce((acc, c) => acc + parseFloat(c.cost_usd || 0), 0)
      }
    }

    const topExpensiveAnalyses = Object.values(analysisCosts)
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10)

    // 6. Comparação com período anterior
    const previousStartDate = new Date(startDate)
    const periodDuration = now - startDate
    previousStartDate.setTime(startDate.getTime() - periodDuration)

    const { data: previousData, error: previousError } = await supabase
      .from('api_costs')
      .select('cost_usd, total_tokens')
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', startDate.toISOString())

    if (previousError) throw previousError

    const previousCost = previousData.reduce((acc, row) => acc + parseFloat(row.cost_usd || 0), 0)
    const previousTokens = previousData.reduce((acc, row) => acc + parseInt(row.total_tokens || 0), 0)

    const costChange = previousCost > 0 ? ((totalCost - previousCost) / previousCost) * 100 : 0
    const tokensChange = previousTokens > 0 ? ((totalTokens - previousTokens) / previousTokens) * 100 : 0

    // Resposta
    res.status(200).json({
      success: true,
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      summary: {
        totalCost: parseFloat(totalCost.toFixed(6)),
        totalTokens,
        totalOperations,
        avgCostPerOperation: totalOperations > 0 ? parseFloat((totalCost / totalOperations).toFixed(6)) : 0,
        avgTokensPerOperation: totalOperations > 0 ? Math.round(totalTokens / totalOperations) : 0
      },
      comparison: {
        previousPeriodCost: parseFloat(previousCost.toFixed(6)),
        previousPeriodTokens: previousTokens,
        costChangePercent: parseFloat(costChange.toFixed(2)),
        tokensChangePercent: parseFloat(tokensChange.toFixed(2))
      },
      costByModel: Object.entries(costByModel).map(([model, data]) => ({
        model,
        cost: parseFloat(data.cost.toFixed(6)),
        operations: data.operations,
        tokens: data.tokens,
        avgCostPerOperation: parseFloat((data.cost / data.operations).toFixed(6))
      })),
      costByOperation: Object.entries(costByOperation).map(([operation, data]) => ({
        operation,
        cost: parseFloat(data.cost.toFixed(6)),
        operations: data.operations,
        tokens: data.tokens,
        avgCostPerOperation: parseFloat((data.cost / data.operations).toFixed(6))
      })),
      timeSeries,
      topExpensiveAnalyses
    })

  } catch (error) {
    console.error('Error fetching cost stats:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch cost statistics'
    })
  }
}
