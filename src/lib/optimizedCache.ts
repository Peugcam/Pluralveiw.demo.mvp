import { createClient } from '@supabase/supabase-js';
import { LRUCache } from 'lru-cache';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * 💾 SISTEMA DE CACHE OTIMIZADO (Sem custos adicionais!)
 *
 * Performance:
 * - Supabase query: ~200-500ms
 * - LRU cache (memória): ~0.1ms (2000x mais rápido!)
 *
 * Estratégia de 2 níveis:
 * 1. L1 Cache (LRU em memória) - Ultra rápido, mas volátil
 * 2. L2 Cache (Supabase) - Persistente, mas mais lento
 */

interface CachedAnalysis {
  id: string;
  topic: string;
  perspectives: any[];
  questions: string[];
  created_at: string;
  cost: number;
}

interface CacheStats {
  l1Hits: number;
  l1Misses: number;
  l2Hits: number;
  l2Misses: number;
  totalRequests: number;
}

// L1 Cache: Em memória (ultra rápido!)
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora
const l1Cache = new LRUCache<string, CachedAnalysis>({
  max: 200,  // Máximo de 200 análises em memória
  ttl: CACHE_TTL_MS,
  updateAgeOnGet: true,  // Refresh TTL quando acessado
  updateAgeOnHas: true,
});

// Estatísticas de cache
const cacheStats: CacheStats = {
  l1Hits: 0,
  l1Misses: 0,
  l2Hits: 0,
  l2Misses: 0,
  totalRequests: 0
};

/**
 * Gera chave de cache normalizada
 */
function generateCacheKey(topic: string): string {
  return topic
    .toLowerCase()
    .trim()
    .normalize('NFD')  // Normalizar caracteres Unicode
    .replace(/[\u0300-\u036f]/g, '')  // Remover acentos
    .replace(/[^\w\s]/g, '')  // Remover pontuação
    .replace(/\s+/g, '_')  // Substituir espaços por _
    .substring(0, 100);  // Limitar tamanho
}

/**
 * Busca análise em cache (2 níveis: memória + Supabase)
 */
export async function getCachedAnalysis(topic: string): Promise<CachedAnalysis | null> {
  cacheStats.totalRequests++;
  const cacheKey = generateCacheKey(topic);

  console.log(`[Cache] Buscando: "${topic}" (key: ${cacheKey})`);

  // L1 Cache: Memória (ultra rápido ~0.1ms)
  const l1Hit = l1Cache.get(cacheKey);
  if (l1Hit) {
    cacheStats.l1Hits++;
    const ageMinutes = Math.round((Date.now() - new Date(l1Hit.created_at).getTime()) / 1000 / 60);
    console.log(`[L1 Cache HIT] ⚡ Memória - ${ageMinutes} min - ${cacheKey}`);

    return l1Hit;
  }

  cacheStats.l1Misses++;
  console.log(`[L1 Cache MISS] Buscando no L2 (Supabase)...`);

  // L2 Cache: Supabase (mais lento ~200-500ms, mas persistente)
  try {
    const { data: cachedAnalysis, error } = await supabase
      .from('analyses')
      .select(`
        id,
        topic,
        created_at,
        perspectives (
          type,
          content,
          sources
        ),
        reflective_questions (
          question
        )
      `)
      .eq('topic', topic)  // Busca exata (indexado!)
      .eq('status', 'completed')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())  // Últimos 7 dias
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[L2 Cache] Erro:', error);
      cacheStats.l2Misses++;
      return null;
    }

    if (!cachedAnalysis) {
      cacheStats.l2Misses++;
      console.log(`[L2 Cache MISS] Não encontrado no Supabase`);
      return null;
    }

    cacheStats.l2Hits++;

    // Formatar dados
    const formattedAnalysis: CachedAnalysis = {
      id: cachedAnalysis.id,
      topic: cachedAnalysis.topic,
      perspectives: cachedAnalysis.perspectives || [],
      questions: (cachedAnalysis.reflective_questions || []).map((q: any) => q.question),
      created_at: cachedAnalysis.created_at,
      cost: 0  // Cache = custo zero!
    };

    const ageMinutes = Math.round((Date.now() - new Date(formattedAnalysis.created_at).getTime()) / 1000 / 60);
    console.log(`[L2 Cache HIT] 💾 Supabase - ${ageMinutes} min - Salvando em L1`);

    // Promover para L1 cache (próxima vez será ultra rápido)
    l1Cache.set(cacheKey, formattedAnalysis);

    return formattedAnalysis;

  } catch (error) {
    console.error('[L2 Cache] Erro inesperado:', error);
    cacheStats.l2Misses++;
    return null;
  }
}

/**
 * Salva análise em cache (ambos os níveis)
 */
export async function setCachedAnalysis(analysisData: {
  id: string;
  topic: string;
  perspectives: any[];
  questions: string[];
}): Promise<void> {

  const cacheKey = generateCacheKey(analysisData.topic);

  const cachedAnalysis: CachedAnalysis = {
    id: analysisData.id,
    topic: analysisData.topic,
    perspectives: analysisData.perspectives,
    questions: analysisData.questions,
    created_at: new Date().toISOString(),
    cost: 0
  };

  // Salvar em L1 (memória)
  l1Cache.set(cacheKey, cachedAnalysis);
  console.log(`[L1 Cache SAVE] ✅ Memória - ${cacheKey}`);

  // L2 já foi salvo via Supabase insert (não precisa duplicar)
  console.log(`[L2 Cache] Já salvo via Supabase insert`);
}

/**
 * Invalida cache para um tópico específico
 */
export function invalidateCache(topic: string): void {
  const cacheKey = generateCacheKey(topic);
  l1Cache.delete(cacheKey);
  console.log(`[Cache] Invalidado: ${cacheKey}`);
}

/**
 * Limpa todo o cache L1
 */
export function clearL1Cache(): void {
  const size = l1Cache.size;
  l1Cache.clear();
  console.log(`[L1 Cache] Limpo: ${size} entradas removidas`);
}

/**
 * Retorna estatísticas de cache
 */
export function getCacheStats(): CacheStats & { hitRate: string; l1HitRate: string; l2HitRate: string } {
  const totalHits = cacheStats.l1Hits + cacheStats.l2Hits;
  const hitRate = cacheStats.totalRequests > 0
    ? ((totalHits / cacheStats.totalRequests) * 100).toFixed(1)
    : '0.0';

  const l1HitRate = (cacheStats.l1Hits + cacheStats.l1Misses) > 0
    ? ((cacheStats.l1Hits / (cacheStats.l1Hits + cacheStats.l1Misses)) * 100).toFixed(1)
    : '0.0';

  const l2HitRate = (cacheStats.l2Hits + cacheStats.l2Misses) > 0
    ? ((cacheStats.l2Hits / (cacheStats.l2Hits + cacheStats.l2Misses)) * 100).toFixed(1)
    : '0.0';

  return {
    ...cacheStats,
    hitRate: `${hitRate}%`,
    l1HitRate: `${l1HitRate}%`,
    l2HitRate: `${l2HitRate}%`
  };
}

/**
 * Reseta estatísticas
 */
export function resetCacheStats(): void {
  cacheStats.l1Hits = 0;
  cacheStats.l1Misses = 0;
  cacheStats.l2Hits = 0;
  cacheStats.l2Misses = 0;
  cacheStats.totalRequests = 0;
  console.log('[Cache Stats] Resetado');
}

/**
 * Pré-aquece cache com análises mais comuns
 * (Útil após deploy ou restart)
 */
export async function warmupCache(topics: string[]): Promise<void> {
  console.log(`[Cache Warmup] Pré-aquecendo ${topics.length} tópicos...`);

  const promises = topics.map(topic => getCachedAnalysis(topic));
  const results = await Promise.allSettled(promises);

  const loaded = results.filter(r => r.status === 'fulfilled' && r.value !== null).length;
  console.log(`[Cache Warmup] ✅ ${loaded}/${topics.length} tópicos carregados`);
}

/**
 * 📊 COMPARAÇÃO DE PERFORMANCE
 *
 * Cenário: Usuário busca "IA na educação"
 *
 * SEM CACHE OTIMIZADO:
 * - Query Supabase: ~300ms
 * - Custo: $0.0171 (nova análise)
 *
 * COM L1 CACHE (memória):
 * - Lookup: ~0.1ms (3000x mais rápido!)
 * - Custo: $0 (cache hit)
 *
 * COM L2 CACHE (Supabase):
 * - Query: ~300ms
 * - Promove para L1 automaticamente
 * - Próxima: ~0.1ms
 * - Custo: $0 (cache hit)
 *
 * ECONOMIA:
 * - Performance: até 3000x mais rápido
 * - Custo: 100% de economia em cache hits
 * - Infraestrutura: Zero custos adicionais!
 */
