import { jsPDF } from 'jspdf'

/**
 * Exporta análise PluralView para PDF formatado
 *
 * @param {Object} analysis - Objeto com topic, perspectives, questions
 * @returns {Promise<void>}
 */
export async function exportAnalysisToPDF(analysis) {
  const { topic, perspectives, questions } = analysis

  // Criar documento PDF (A4)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - (margin * 2)
  let yPosition = margin

  // Cores
  const colors = {
    primary: [59, 130, 246],      // blue
    secondary: [139, 92, 246],    // purple
    text: [31, 41, 55],           // gray-800
    textLight: [107, 114, 128],   // gray-500
    background: [249, 250, 251]   // gray-50
  }

  // Função auxiliar para adicionar nova página se necessário
  const checkPageBreak = (requiredSpace) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage()
      yPosition = margin
      return true
    }
    return false
  }

  // Função auxiliar para texto com quebra de linha
  const addText = (text, fontSize, fontStyle = 'normal', color = colors.text, maxWidth = contentWidth) => {
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', fontStyle)
    doc.setTextColor(...color)

    const lines = doc.splitTextToSize(text, maxWidth)
    const lineHeight = fontSize * 0.5

    lines.forEach((line, idx) => {
      checkPageBreak(lineHeight)
      doc.text(line, margin, yPosition)
      yPosition += lineHeight
    })

    return lines.length * lineHeight
  }

  // ============================================
  // HEADER: Título do documento
  // ============================================
  doc.setFillColor(...colors.primary)
  doc.rect(0, 0, pageWidth, 40, 'F')

  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('PluralView', margin, 20)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Análise Multi-Perspectiva', margin, 28)

  yPosition = 50

  // ============================================
  // TÓPICO
  // ============================================
  doc.setFillColor(...colors.background)
  doc.roundedRect(margin, yPosition, contentWidth, 15, 2, 2, 'F')

  yPosition += 5
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...colors.text)
  doc.text('TÓPICO ANALISADO:', margin + 5, yPosition)

  yPosition += 6
  addText(topic, 10, 'normal', colors.textLight, contentWidth - 10)
  yPosition += 8

  // ============================================
  // DATA DE GERAÇÃO
  // ============================================
  doc.setFontSize(8)
  doc.setTextColor(...colors.textLight)
  const date = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  doc.text(`Gerado em: ${date}`, margin, yPosition)
  yPosition += 10

  // ============================================
  // PERSPECTIVAS
  // ============================================
  const perspectiveLabels = {
    tecnica: 'Técnica',
    popular: 'Popular',
    institucional: 'Institucional',
    academica: 'Acadêmica',
    conservadora: 'Conservadora',
    progressista: 'Progressista'
  }

  const perspectiveColors = {
    tecnica: [59, 130, 246],       // blue
    popular: [16, 185, 129],       // green
    institucional: [139, 92, 246], // purple
    academica: [99, 102, 241],     // indigo
    conservadora: [245, 158, 11],  // orange
    progressista: [236, 72, 153]   // pink
  }

  perspectives.forEach((persp, idx) => {
    checkPageBreak(30)

    // Caixa da perspectiva
    const boxHeight = 8
    const color = perspectiveColors[persp.type] || colors.primary

    doc.setFillColor(...color)
    doc.roundedRect(margin, yPosition, contentWidth, boxHeight, 2, 2, 'F')

    // Título da perspectiva
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text(`${idx + 1}. ${perspectiveLabels[persp.type] || persp.type}`, margin + 3, yPosition + 5.5)

    yPosition += boxHeight + 5

    // Conteúdo
    addText(persp.content, 9, 'normal', colors.text)
    yPosition += 3

    // Fontes
    if (persp.sources && persp.sources.length > 0) {
      checkPageBreak(20)

      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...colors.textLight)
      doc.text('FONTES:', margin, yPosition)
      yPosition += 4

      persp.sources.forEach((source) => {
        checkPageBreak(8)

        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...colors.textLight)

        // Título da fonte
        const sourceTitle = source.title.substring(0, 60) + (source.title.length > 60 ? '...' : '')
        doc.text(`• ${sourceTitle}`, margin + 2, yPosition)
        yPosition += 3

        // Trust Score
        const trustText = `  Trust Score: ${source.trustScore}/100`
        const trustColor = source.trustScore >= 80 ? [16, 185, 129] :
                          source.trustScore >= 60 ? [245, 158, 11] :
                          [239, 68, 68]
        doc.setTextColor(...trustColor)
        doc.text(trustText, margin + 2, yPosition)
        yPosition += 4
      })

      yPosition += 2
    }

    // Vieses
    if (persp.biases && persp.biases.length > 0) {
      checkPageBreak(15)

      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...colors.textLight)
      doc.text('⚠ VIESES DETECTADOS:', margin, yPosition)
      yPosition += 4

      persp.biases.forEach((bias) => {
        checkPageBreak(5)

        doc.setFontSize(7)
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(...colors.textLight)

        const biasLines = doc.splitTextToSize(`• ${bias}`, contentWidth - 4)
        biasLines.forEach(line => {
          doc.text(line, margin + 2, yPosition)
          yPosition += 3
        })
      })

      yPosition += 2
    }

    yPosition += 6 // Espaçamento entre perspectivas
  })

  // ============================================
  // PERGUNTAS PARA REFLEXÃO
  // ============================================
  if (questions && questions.length > 0) {
    checkPageBreak(30)

    // Título da seção
    doc.setFillColor(...colors.secondary)
    doc.roundedRect(margin, yPosition, contentWidth, 10, 2, 2, 'F')

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text('💭 Perguntas para Reflexão', margin + 3, yPosition + 6.5)

    yPosition += 15

    questions.forEach((question, idx) => {
      checkPageBreak(15)

      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...colors.primary)
      doc.text(`${idx + 1}.`, margin, yPosition)

      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...colors.text)

      const questionLines = doc.splitTextToSize(question, contentWidth - 6)
      questionLines.forEach(line => {
        doc.text(line, margin + 5, yPosition)
        yPosition += 4.5
      })

      yPosition += 2
    })
  }

  // ============================================
  // FOOTER: Todas as páginas
  // ============================================
  const totalPages = doc.internal.getNumberOfPages()

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)

    // Linha separadora
    doc.setDrawColor(...colors.textLight)
    doc.setLineWidth(0.5)
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15)

    // Texto do footer
    doc.setFontSize(8)
    doc.setTextColor(...colors.textLight)
    doc.setFont('helvetica', 'normal')
    doc.text(
      'Gerado por PluralView - https://pluralview-mvp.vercel.app',
      margin,
      pageHeight - 10
    )

    doc.setFont('helvetica', 'bold')
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth - margin - 30,
      pageHeight - 10
    )
  }

  // ============================================
  // SALVAR PDF
  // ============================================
  const filename = `pluralview-${topic.substring(0, 30).replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`
  doc.save(filename)

  return filename
}

/**
 * Exporta comparação de perspectivas para PDF
 *
 * @param {Object} comparison - Objeto com consensos, divergências, contradições
 * @param {Array} perspectives - Array de perspectivas comparadas
 * @returns {Promise<void>}
 */
export async function exportComparisonToPDF(comparison, perspectives) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - (margin * 2)
  let yPosition = margin

  // Cores
  const colors = {
    primary: [59, 130, 246],
    secondary: [139, 92, 246],
    success: [16, 185, 129],
    warning: [245, 158, 11],
    danger: [239, 68, 68],
    text: [31, 41, 55],
    textLight: [107, 114, 128]
  }

  // Header
  doc.setFillColor(...colors.primary)
  doc.rect(0, 0, pageWidth, 40, 'F')

  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('PluralView', margin, 20)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Comparação de Perspectivas', margin, 28)

  yPosition = 50

  // Função auxiliar para texto
  const addSection = (title, content, color) => {
    if (yPosition + 30 > pageHeight - margin) {
      doc.addPage()
      yPosition = margin
    }

    doc.setFillColor(...color)
    doc.roundedRect(margin, yPosition, contentWidth, 8, 2, 2, 'F')

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text(title, margin + 3, yPosition + 5.5)

    yPosition += 12

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...colors.text)

    const lines = doc.splitTextToSize(content, contentWidth - 4)
    lines.forEach(line => {
      if (yPosition > pageHeight - margin) {
        doc.addPage()
        yPosition = margin
      }
      doc.text(line, margin + 2, yPosition)
      yPosition += 4.5
    })

    yPosition += 8
  }

  // Consensos
  if (comparison.consensos) {
    addSection('✅ Consensos', comparison.consensos, colors.success)
  }

  // Divergências
  if (comparison.divergencias) {
    addSection('⚠️ Divergências', comparison.divergencias, colors.warning)
  }

  // Contradições
  if (comparison.contradicoes) {
    addSection('❌ Contradições', comparison.contradicoes, colors.danger)
  }

  // Síntese
  if (comparison.sintese) {
    addSection('📊 Síntese Integrada', comparison.sintese, colors.secondary)
  }

  // Footer
  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(...colors.textLight)
    doc.text(
      'Gerado por PluralView - https://pluralview-mvp.vercel.app',
      margin,
      pageHeight - 10
    )
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth - margin - 30,
      pageHeight - 10
    )
  }

  const filename = 'pluralview-comparacao.pdf'
  doc.save(filename)

  return filename
}
