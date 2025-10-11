/**
 * Trust Score Calculator
 * Calcula a confiabilidade de fontes baseado em múltiplos fatores
 *
 * Score Range: 0-100
 * - 80-100: Altamente confiável (verde)
 * - 60-79: Confiável (amarelo)
 * - 40-59: Moderado (laranja)
 * - 0-39: Baixa confiabilidade (vermelho)
 */

export class TrustScoreCalculator {
  constructor() {
    // Domínios altamente confiáveis
    this.trustedDomains = [
      // Acadêmico
      '.edu', '.ac.uk', '.edu.br',
      // Governo
      '.gov', '.gov.br', '.europa.eu',
      // Organizações
      '.org',
      // Jornalismo de qualidade
      'bbc.com', 'bbc.co.uk', 'reuters.com', 'apnews.com',
      'theguardian.com', 'nytimes.com', 'wsj.com',
      // Publicações científicas
      'nature.com', 'science.org', 'sciencedirect.com',
      'springer.com', 'wiley.com', 'cell.com',
      'thelancet.com', 'nejm.org', 'bmj.com',
      // Think tanks e pesquisa
      'brookings.edu', 'rand.org', 'who.int',
      'worldbank.org', 'imf.org', 'oecd.org'
    ];

    // Domínios de mídia confiável (peso médio)
    this.reliableMedia = [
      'economist.com', 'forbes.com', 'bloomberg.com',
      'ft.com', 'washingtonpost.com', 'time.com',
      'nationalgeographic.com', 'scientificamerican.com',
      'wired.com', 'arstechnica.com', 'techcrunch.com'
    ];

    // Red flags (domínios não confiáveis)
    this.suspiciousDomains = [
      'clickbait', 'viral', 'breaking-news',
      'fake', 'hoax', 'conspiracy'
    ];
  }

  /**
   * Calcula o trust score de uma fonte
   * @param {Object} source - Objeto da fonte com url, title, content, etc.
   * @returns {Object} - { score, factors, level }
   */
  calculate(source) {
    if (!source || !source.url) {
      return {
        score: 0,
        level: 'unknown',
        factors: ['URL ausente']
      };
    }

    let score = 50; // Score base
    const factors = [];

    // Fator 1: Domínio confiável (+30 pontos máximo)
    const domainScore = this.evaluateDomain(source.url);
    score += domainScore.points;
    if (domainScore.factor) factors.push(domainScore.factor);

    // Fator 2: HTTPS (+5 pontos)
    if (source.url.startsWith('https://')) {
      score += 5;
      factors.push('✅ Conexão segura (HTTPS)');
    } else {
      score -= 5;
      factors.push('⚠️ Sem HTTPS');
    }

    // Fator 3: Data de publicação (+15 pontos se recente)
    const dateScore = this.evaluatePublicationDate(source.published_date);
    score += dateScore.points;
    if (dateScore.factor) factors.push(dateScore.factor);

    // Fator 4: Qualidade do conteúdo (+15 pontos)
    const contentScore = this.evaluateContent(source.content, source.title);
    score += contentScore.points;
    factors.push(...contentScore.factors);

    // Fator 5: Metadados (autor, fontes citadas) (+10 pontos)
    const metadataScore = this.evaluateMetadata(source);
    score += metadataScore.points;
    if (metadataScore.factors.length > 0) {
      factors.push(...metadataScore.factors);
    }

    // Limitar score entre 0 e 100
    score = Math.max(0, Math.min(100, score));

    return {
      score: Math.round(score),
      level: this.getScoreLevel(score),
      factors,
      details: this.getScoreDetails(score)
    };
  }

  /**
   * Avalia a confiabilidade do domínio
   */
  evaluateDomain(url) {
    const urlLower = url.toLowerCase();

    // Check red flags primeiro
    for (const flag of this.suspiciousDomains) {
      if (urlLower.includes(flag)) {
        return {
          points: -20,
          factor: '🚩 Domínio suspeito'
        };
      }
    }

    // Check domínios altamente confiáveis
    for (const domain of this.trustedDomains) {
      if (urlLower.includes(domain)) {
        return {
          points: 25,
          factor: '✅ Domínio altamente confiável'
        };
      }
    }

    // Check mídia confiável
    for (const domain of this.reliableMedia) {
      if (urlLower.includes(domain)) {
        return {
          points: 15,
          factor: '✅ Fonte de mídia confiável'
        };
      }
    }

    return { points: 0, factor: null };
  }

  /**
   * Avalia a data de publicação
   */
  evaluatePublicationDate(publishedDate) {
    if (!publishedDate) {
      return { points: -5, factor: '⚠️ Data de publicação não disponível' };
    }

    try {
      const pubDate = new Date(publishedDate);
      const now = new Date();
      const diffDays = Math.floor((now - pubDate) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return { points: -10, factor: '⚠️ Data futura (inconsistente)' };
      }

      if (diffDays <= 7) {
        return { points: 15, factor: '✅ Publicado recentemente (última semana)' };
      }

      if (diffDays <= 30) {
        return { points: 10, factor: '✅ Publicado no último mês' };
      }

      if (diffDays <= 365) {
        return { points: 5, factor: '📅 Publicado no último ano' };
      }

      return { points: 0, factor: `📅 Publicado há ${Math.floor(diffDays / 365)} anos` };
    } catch (error) {
      return { points: -5, factor: '⚠️ Data inválida' };
    }
  }

  /**
   * Avalia a qualidade do conteúdo
   */
  evaluateContent(content, title) {
    const factors = [];
    let points = 0;

    if (!content || content.length < 100) {
      factors.push('⚠️ Conteúdo muito curto');
      points -= 10;
      return { points, factors };
    }

    // Conteúdo detalhado
    if (content.length > 2000) {
      factors.push('✅ Conteúdo detalhado (2000+ caracteres)');
      points += 10;
    } else if (content.length > 1000) {
      factors.push('✅ Conteúdo substancial (1000+ caracteres)');
      points += 5;
    }

    // Check por citações/referências
    const hasCitations = /\[[\d]+\]|(?:fonte|source|reference|citação):/i.test(content);
    if (hasCitations) {
      factors.push('✅ Contém citações ou referências');
      points += 5;
    }

    // Check clickbait no título
    const clickbaitPatterns = [
      /você não vai acreditar/i,
      /não vai acreditar/i,
      /chocante/i,
      /incrível/i,
      /surpreendente/i,
      /shocking/i,
      /you won't believe/i,
      /click here/i,
      /clique aqui/i
    ];

    const hasClickbait = clickbaitPatterns.some(pattern => pattern.test(title || ''));
    if (hasClickbait) {
      factors.push('⚠️ Título sensacionalista detectado');
      points -= 5;
    }

    return { points, factors };
  }

  /**
   * Avalia metadados (autor, fontes, etc)
   */
  evaluateMetadata(source) {
    const factors = [];
    let points = 0;

    // Check se tem autor identificado
    if (source.author && source.author !== 'Unknown') {
      factors.push('✅ Autor identificado');
      points += 5;
    }

    // Check se tem múltiplas fontes citadas
    const sourcesCount = (source.content || '').match(/fonte|source|according to|segundo/gi);
    if (sourcesCount && sourcesCount.length >= 3) {
      factors.push('✅ Múltiplas fontes citadas');
      points += 5;
    }

    return { points, factors };
  }

  /**
   * Retorna o nível do score
   */
  getScoreLevel(score) {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    if (score >= 40) return 'low';
    return 'very-low';
  }

  /**
   * Retorna detalhes descritivos do score
   */
  getScoreDetails(score) {
    if (score >= 80) {
      return {
        label: 'Altamente Confiável',
        description: 'Fonte de alta qualidade com múltiplos fatores de confiabilidade',
        color: 'green'
      };
    }
    if (score >= 60) {
      return {
        label: 'Confiável',
        description: 'Fonte confiável, mas pode ter algumas limitações',
        color: 'yellow'
      };
    }
    if (score >= 40) {
      return {
        label: 'Moderado',
        description: 'Use com cautela e verifique outras fontes',
        color: 'orange'
      };
    }
    return {
      label: 'Baixa Confiabilidade',
      description: 'Verifique cuidadosamente e busque fontes alternativas',
      color: 'red'
    };
  }

  /**
   * Calcula média de trust score de múltiplas fontes
   */
  calculateAverage(sources) {
    if (!sources || sources.length === 0) return 0;

    const scores = sources.map(s => this.calculate(s).score);
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    return Math.round(average);
  }

  /**
   * Filtra fontes por trust score mínimo
   */
  filterByMinScore(sources, minScore = 60) {
    return sources.filter(source => {
      const { score } = this.calculate(source);
      return score >= minScore;
    });
  }
}

// Export singleton
export const trustScoreCalculator = new TrustScoreCalculator();
