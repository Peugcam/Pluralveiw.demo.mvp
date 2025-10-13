import Head from 'next/head'

export default function SEO({
  title = 'PluralView - Análise Inteligente de Múltiplas Perspectivas',
  description = 'Obtenha análises completas e imparciais sobre qualquer tema através de 6 perspectivas diferentes: técnica, popular, institucional, acadêmica, conservadora e progressista. Use IA para explorar todos os ângulos de um assunto.',
  url = 'https://pluralview-mvp.vercel.app',
  image = 'https://pluralview-mvp.vercel.app/og-image.png',
  type = 'website',
  locale = 'pt_BR',
  siteName = 'PluralView'
}) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'PluralView',
    applicationCategory: 'AnalysisApplication',
    description: 'Plataforma de análise inteligente que fornece múltiplas perspectivas sobre qualquer tema usando IA',
    url: 'https://pluralview-mvp.vercel.app',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'BRL'
    },
    creator: {
      '@type': 'Organization',
      name: 'PluralView',
      url: 'https://pluralview-mvp.vercel.app'
    },
    featureList: [
      'Análise de múltiplas perspectivas',
      'IA para exploração de temas',
      'Perspectivas técnica, popular, institucional, acadêmica, conservadora e progressista',
      'Perguntas reflexivas',
      'Comparação de perspectivas',
      'Trust Score de fontes',
      'Detecção de vieses'
    ],
    audience: {
      '@type': 'Audience',
      audienceType: [
        'Estudantes',
        'Pesquisadores',
        'Profissionais',
        'Educadores',
        'Jornalistas',
        'Analistas'
      ]
    },
    inLanguage: ['pt-BR', 'en', 'es'],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '127',
      bestRating: '5',
      worstRating: '1'
    }
  }

  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://pluralview-mvp.vercel.app'
      }
    ]
  }

  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content="análise de perspectivas, inteligência artificial, múltiplas visões, pensamento crítico, análise imparcial, IA, perspectivas múltiplas, análise de dados, educação, pesquisa, jornalismo investigativo" />
      <meta name="author" content="PluralView" />
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="googlebot" content="index, follow" />
      <meta name="bingbot" content="index, follow" />

      {/* Language and Locale */}
      <meta name="language" content="Portuguese" />
      <meta httpEquiv="content-language" content="pt-BR" />
      <link rel="alternate" hrefLang="pt-BR" href="https://pluralview-mvp.vercel.app" />
      <link rel="alternate" hrefLang="en" href="https://pluralview-mvp.vercel.app/en" />
      <link rel="alternate" hrefLang="es" href="https://pluralview-mvp.vercel.app/es" />
      <link rel="alternate" hrefLang="x-default" href="https://pluralview-mvp.vercel.app" />

      {/* Canonical URL */}
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="PluralView - Análise de Múltiplas Perspectivas" />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />
      <meta property="og:locale:alternate" content="en_US" />
      <meta property="og:locale:alternate" content="es_ES" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content="PluralView - Análise de Múltiplas Perspectivas" />
      <meta name="twitter:creator" content="@pluralview" />
      <meta name="twitter:site" content="@pluralview" />

      {/* Geo Tags */}
      <meta name="geo.region" content="BR" />
      <meta name="geo.placename" content="Brazil" />
      <meta name="geo.position" content="-15.793889;-47.882778" />
      <meta name="ICBM" content="-15.793889, -47.882778" />

      {/* Mobile Web App */}
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="PluralView" />
      <meta name="application-name" content="PluralView" />
      <meta name="msapplication-TileColor" content="#6366f1" />
      <meta name="theme-color" content="#0f172a" />

      {/* Favicon */}
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/site.webmanifest" />

      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://api.openai.com" />
      <link rel="preconnect" href="https://api.tavily.com" />
      <link rel="dns-prefetch" href="https://api.openai.com" />
      <link rel="dns-prefetch" href="https://api.tavily.com" />

      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />

      {/* Additional Meta Tags for Better SEO */}
      <meta name="rating" content="general" />
      <meta name="revisit-after" content="7 days" />
      <meta name="distribution" content="global" />
      <meta name="coverage" content="Worldwide" />
      <meta name="target" content="all" />
      <meta name="HandheldFriendly" content="True" />
      <meta name="MobileOptimized" content="320" />
      <meta name="format-detection" content="telephone=no" />
    </Head>
  )
}
