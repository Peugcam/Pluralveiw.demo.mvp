/**
 * Temporal Query Detector
 * Detecta termos temporais em queries e converte para datas específicas
 *
 * Exemplos:
 * - "porque o bitcoin caiu hoje?" → detecta "hoje" → filtra por 2025-10-28
 * - "notícias de ontem sobre IA" → detecta "ontem" → filtra por 2025-10-27
 * - "o que aconteceu essa semana?" → detecta "essa semana" → filtra por últimos 7 dias
 */

interface DateRange {
  start: Date;
  end: Date;
  label: string;
  days: number;
}

interface PatternDefinition {
  regex: RegExp;
  getDates: () => DateRange;
}

export interface TemporalInfo {
  detected: boolean;
  type: string;
  label: string;
  startDate: Date;
  endDate: Date;
  days: number;
  originalQuery: string;
  enhancedQuery: string;
}

interface SearchResult {
  title: string;
  content?: string;
}

export class TemporalDetector {
  private patterns: Record<string, PatternDefinition>;

  constructor() {
    // Termos temporais relativos e seus padrões
    this.patterns = {
      hoje: {
        regex: /\b(hoje|hj|today)\b/gi,
        getDates: (): DateRange => {
          const today = new Date();
          return {
            start: this.getStartOfDay(today),
            end: this.getEndOfDay(today),
            label: 'hoje',
            days: 1
          };
        }
      },
      ontem: {
        regex: /\b(ontem|yesterday)\b/gi,
        getDates: (): DateRange => {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          return {
            start: this.getStartOfDay(yesterday),
            end: this.getEndOfDay(yesterday),
            label: 'ontem',
            days: 1
          };
        }
      },
      ultimasSemanas: {
        regex: /\b(essa semana|esta semana|semana passada|última semana|ultimas? semanas?|this week|last week)\b/gi,
        getDates: (): DateRange => {
          const end = new Date();
          const start = new Date();
          start.setDate(start.getDate() - 7);
          return {
            start: this.getStartOfDay(start),
            end: this.getEndOfDay(end),
            label: 'última semana',
            days: 7
          };
        }
      },
      ultimoMes: {
        regex: /\b(esse mês|este mês|mês passado|último mês|this month|last month)\b/gi,
        getDates: (): DateRange => {
          const end = new Date();
          const start = new Date();
          start.setDate(start.getDate() - 30);
          return {
            start: this.getStartOfDay(start),
            end: this.getEndOfDay(end),
            label: 'último mês',
            days: 30
          };
        }
      },
      recente: {
        regex: /\b(recente|recentemente|atualmente|agora|currently|now|latest|recent)\b/gi,
        getDates: (): DateRange => {
          const end = new Date();
          const start = new Date();
          start.setDate(start.getDate() - 3); // Últimos 3 dias
          return {
            start: this.getStartOfDay(start),
            end: this.getEndOfDay(end),
            label: 'recente',
            days: 3
          };
        }
      }
    };
  }

  /**
   * Detecta termos temporais na query
   * @param query - Query do usuário
   * @returns Informações temporais ou null se não encontrado
   */
  detect(query: string): TemporalInfo | null {
    if (!query) return null;

    // Verificar cada padrão
    for (const [key, pattern] of Object.entries(this.patterns)) {
      if (pattern.regex.test(query)) {
        const dates = pattern.getDates();
        return {
          detected: true,
          type: key,
          label: dates.label,
          startDate: dates.start,
          endDate: dates.end,
          days: dates.days,
          originalQuery: query,
          // Adicionar informação de data à query para melhorar busca
          enhancedQuery: this.enhanceQuery(query, dates)
        };
      }
    }

    return null;
  }

  /**
   * Adiciona contexto de data à query para melhorar resultados
   */
  private enhanceQuery(query: string, dates: DateRange): string {
    const year = dates.end.getFullYear();
    const month = dates.end.toLocaleString('pt-BR', { month: 'long' });
    const dateStr = dates.end.toLocaleDateString('pt-BR');

    // Adicionar contexto temporal à busca
    return `${query} ${dateStr} ${month} ${year} atualizado`;
  }

  /**
   * Valida se um resultado está dentro do período temporal
   * @param result - Resultado da busca
   * @param temporalInfo - Informações temporais detectadas
   * @returns true se o resultado é válido
   */
  validateResult(result: SearchResult, temporalInfo: TemporalInfo | null): boolean {
    if (!temporalInfo || !temporalInfo.detected) {
      return true; // Sem filtro temporal, aceitar tudo
    }

    try {
      // Tentar extrair data do conteúdo ou título
      const dateInContent = this.extractDateFromText(result.title + ' ' + (result.content || ''));

      if (!dateInContent) {
        // Se não conseguiu extrair data, verificar se é conteúdo "fresco"
        // baseado em palavras-chave
        return this.hasRecentKeywords(result.title + ' ' + (result.content || ''));
      }

      // Validar se a data está no intervalo
      return dateInContent >= temporalInfo.startDate && dateInContent <= temporalInfo.endDate;
    } catch (error) {
      console.warn('Error validating result date:', error);
      // Em caso de erro, não descartar o resultado
      return true;
    }
  }

  /**
   * Extrai data de texto usando padrões comuns
   */
  private extractDateFromText(text: string): Date | null {
    if (!text) return null;

    // Padrões de data comuns
    const patterns = [
      // ISO: 2025-10-28
      /(\d{4})-(\d{2})-(\d{2})/,
      // BR: 28/10/2025
      /(\d{2})\/(\d{2})\/(\d{4})/,
      // Texto: 28 de outubro de 2025
      /(\d{1,2})\s+de\s+(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+de\s+(\d{4})/i,
      // Texto curto: Oct 28, 2025
      /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          let date: Date;
          if (pattern.source.includes('de')) {
            // Formato: "28 de outubro de 2025"
            const months: Record<string, number> = {
              'janeiro': 0, 'fevereiro': 1, 'março': 2, 'abril': 3,
              'maio': 4, 'junho': 5, 'julho': 6, 'agosto': 7,
              'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11
            };
            date = new Date(parseInt(match[3]), months[match[2].toLowerCase()], parseInt(match[1]));
          } else if (pattern.source.includes('jan|feb')) {
            // Formato: "Oct 28, 2025"
            const months: Record<string, number> = {
              'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
              'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
            };
            const monthKey = match[1].toLowerCase().substring(0, 3);
            date = new Date(parseInt(match[3]), months[monthKey], parseInt(match[2]));
          } else if (pattern.source.includes('\\d{4}-')) {
            // ISO: 2025-10-28
            date = new Date(match[0]);
          } else {
            // BR: 28/10/2025
            date = new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
          }

          if (!isNaN(date.getTime())) {
            return date;
          }
        } catch (error) {
          continue;
        }
      }
    }

    return null;
  }

  /**
   * Verifica se o texto contém palavras-chave de conteúdo recente
   */
  private hasRecentKeywords(text: string): boolean {
    const recentKeywords = [
      'hoje', 'hoje mesmo', 'agora', 'atualmente', 'neste momento',
      'ontem', 'recentemente', 'recém', 'acabou de',
      'essa semana', 'esta semana', 'últimas horas',
      'breaking', 'urgent', 'latest', 'just now', 'today',
      '2025' // Ano atual
    ];

    const textLower = text.toLowerCase();

    // Quanto mais keywords recentes, maior a pontuação
    const matchCount = recentKeywords.filter(kw => textLower.includes(kw)).length;

    // Se encontrou 2+ keywords de recência, considerar válido
    return matchCount >= 2;
  }

  /**
   * Obtém início do dia (00:00:00)
   */
  private getStartOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Obtém fim do dia (23:59:59)
   */
  private getEndOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  /**
   * Formata data para exibição
   */
  formatDate(date: Date): string {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  /**
   * Formata intervalo de datas para exibição
   */
  formatDateRange(temporalInfo: TemporalInfo | null): string {
    if (!temporalInfo || !temporalInfo.detected) {
      return '';
    }

    if (temporalInfo.days === 1) {
      return `Resultados de ${this.formatDate(temporalInfo.startDate)}`;
    }

    return `Resultados de ${this.formatDate(temporalInfo.startDate)} a ${this.formatDate(temporalInfo.endDate)}`;
  }
}

// Instância singleton para uso global
export const temporalDetector = new TemporalDetector();
