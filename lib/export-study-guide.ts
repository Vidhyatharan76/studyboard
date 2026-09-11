import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

export interface WhiteboardPayload {
  x: number
  y: number
  width?: number
  height?: number
  text?: string
  color?: string
  textColor?: string
  fontSize?: number
  isAiSolution?: boolean
  points?: { x: number; y: number }[]
  clientId?: string
  opacity?: number
  strokeWidth?: number
  shape?: string
  connector?: string
  lineStyle?: string
  start?: { x: number; y: number }
  end?: { x: number; y: number }
  imageUrl?: string
  fileData?: string
  fileName?: string
  fileType?: string
  isDocument?: boolean
  itemType?: string
  summaryData?: {
    title?: string
    topics?: string[]
    summary?: string[]
    fullExtractedText?: string
  }
}

export interface WhiteboardItem {
  id: string
  board_id: string
  owner_id: string
  item_type: 'note' | 'stroke' | 'shape' | 'connector' | 'text' | 'document'
  payload: WhiteboardPayload
}

export interface ExtractedStudyNote {
  id: string
  category: 'ai-tutor' | 'chemistry' | 'math' | 'summary' | 'sticky-note' | 'text'
  title: string
  badgeText: string
  rawText: string
  accentColor: [number, number, number]
  parsedFormula?: string
  smiles?: string
  compoundName?: string
  vertex?: string
  roots?: string
  factoredForm?: string
  steps?: string[]
  coreConcept?: string
  bulletPoints?: string[]
}

export interface ExportStudyGuideOptions {
  roomName?: string
  items: WhiteboardItem[]
  canvasElement?: HTMLElement | null
  authorName?: string
  fileName?: string
}

export function extractStructuredNotes(items: WhiteboardItem[]): ExtractedStudyNote[] {
  const result: ExtractedStudyNote[] = []

  for (const item of items) {
    if (item.item_type !== 'note' && item.item_type !== 'text') {
      continue
    }

    const text = (item.payload.text || '').trim()
    const summaryData = item.payload.summaryData

    if (summaryData) {
      result.push({
        id: item.id,
        category: 'summary',
        title: summaryData.title || 'Lecture / Document Summary',
        badgeText: 'DOCUMENT SUMMARY',
        rawText: text,
        accentColor: [59, 130, 246],
        bulletPoints: summaryData.summary || []
      })
      continue
    }

    if (item.payload.isAiSolution || (text.includes('Parsed:') && text.includes('Steps:'))) {
      const parsedMatch = text.match(/Parsed:\s*([^\n]+)/i)
      const coreConceptMatch = text.match(/Core Concept:\s*([\s\S]+?)$/i)
      
      let steps: string[] = []
      const stepsIndex = text.indexOf('Steps:')
      const coreConceptIndex = text.indexOf('Core Concept:')
      if (stepsIndex !== -1) {
        const stepsBlock = coreConceptIndex !== -1
          ? text.slice(stepsIndex + 6, coreConceptIndex)
          : text.slice(stepsIndex + 6)
        
        steps = stepsBlock
          .split('\n')
          .map(s => s.trim())
          .filter(s => s.length > 0)
          .map(s => s.replace(/^\d+[\.\)]\s*/, ''))
      }

      result.push({
        id: item.id,
        category: 'ai-tutor',
        title: 'AI Whiteboard Insights & Breakdown',
        badgeText: 'AI INSIGHTS',
        rawText: text,
        accentColor: [16, 185, 129],
        parsedFormula: parsedMatch ? parsedMatch[1].trim() : undefined,
        steps: steps.length > 0 ? steps : undefined,
        coreConcept: coreConceptMatch ? coreConceptMatch[1].trim() : undefined
      })
      continue
    }

    if (text.includes('🔬') || text.includes('SMILES:')) {
      const smilesMatch = text.match(/SMILES:\s*([^\n]+)/i)
      const firstLine = text.split('\n')[0] || ''
      const compoundClean = firstLine.replace(/^[🔬\s]+/, '').trim()

      result.push({
        id: item.id,
        category: 'chemistry',
        title: compoundClean ? `Compound: ${compoundClean}` : 'Chemical Molecular Model',
        badgeText: '3D CHEMISTRY STRUCTURE',
        rawText: text,
        accentColor: [6, 182, 212],
        compoundName: compoundClean,
        smiles: smilesMatch ? smilesMatch[1].trim() : undefined
      })
      continue
    }

    if (text.includes('📈') || (text.includes('Vertex:') && text.includes('Roots:'))) {
      const vertexMatch = text.match(/Vertex:\s*([^\n]+)/i)
      const rootsMatch = text.match(/Roots:\s*([^\n]+)/i)
      const factoredMatch = text.match(/Factored:\s*([^\n]+)/i)
      const firstLine = text.split('\n')[0] || ''
      const equationClean = firstLine.replace(/^[📈\s]+/, '').trim()

      result.push({
        id: item.id,
        category: 'math',
        title: equationClean ? `Parabola: ${equationClean}` : 'Mathematical Function & Roots',
        badgeText: 'MATH PARABOLA PLOT',
        rawText: text,
        accentColor: [139, 92, 246],
        vertex: vertexMatch ? vertexMatch[1].trim() : undefined,
        roots: rootsMatch ? rootsMatch[1].trim() : undefined,
        factoredForm: factoredMatch ? factoredMatch[1].trim() : undefined
      })
      continue
    }

    if (item.item_type === 'note' && text) {
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
      const firstLine = lines[0] || 'Sticky Note'
      const title = firstLine.length > 45 ? firstLine.slice(0, 42) + '...' : firstLine

      result.push({
        id: item.id,
        category: 'sticky-note',
        title,
        badgeText: 'STICKY NOTE',
        rawText: text,
        accentColor: [245, 158, 11]
      })
      continue
    }

    if (item.item_type === 'text' && text) {
      result.push({
        id: item.id,
        category: 'text',
        title: 'Canvas Annotation',
        badgeText: 'TEXT ANNOTATION',
        rawText: text,
        accentColor: [100, 116, 139]
      })
    }
  }

  return result
}

export async function captureCanvasSnapshot(
  element: HTMLElement | null,
  items: WhiteboardItem[]
): Promise<string> {
  if (element) {
    try {
      const canvas = await html2canvas(element, {
        backgroundColor: '#020617',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        ignoreElements: (el: Element) => {
          if (el.classList.contains('canvas-controls')) return true
          if (el.tagName === 'ASIDE') return true
          if (el.getAttribute('data-ignore-export') === 'true') return true
          return false
        }
      })
      return canvas.toDataURL('image/png')
    } catch {
    }
  }

  const fallbackCanvas = document.createElement('canvas')
  fallbackCanvas.width = 1920
  fallbackCanvas.height = 1080
  const ctx = fallbackCanvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable')
  }

  ctx.fillStyle = '#020617'
  ctx.fillRect(0, 0, 1920, 1080)

  ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)'
  ctx.lineWidth = 1
  for (let x = 0; x < 1920; x += 32) {
    for (let y = 0; y < 1080; y += 32) {
      ctx.fillRect(x, y, 1, 1)
    }
  }

  items.forEach(item => {
    if (item.item_type === 'stroke' && item.payload.points && item.payload.points.length > 1) {
      ctx.beginPath()
      ctx.strokeStyle = item.payload.color || '#f8fafc'
      ctx.lineWidth = item.payload.strokeWidth || 4
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.globalAlpha = item.payload.opacity ?? 1
      item.payload.points.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y)
        else ctx.lineTo(pt.x, pt.y)
      })
      ctx.stroke()
      ctx.globalAlpha = 1
    }

    if (item.item_type === 'shape') {
      const { x = 100, y = 100, width = 120, height = 90, color = '#f8fafc', strokeWidth = 3, shape = 'rectangle' } = item.payload
      ctx.strokeStyle = color
      ctx.lineWidth = strokeWidth
      if (shape === 'rectangle') {
        ctx.strokeRect(x, y, width, height)
      } else if (shape === 'ellipse') {
        ctx.beginPath()
        ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, 2 * Math.PI)
        ctx.stroke()
      } else if (shape === 'triangle') {
        ctx.beginPath()
        ctx.moveTo(x + width / 2, y)
        ctx.lineTo(x, y + height)
        ctx.lineTo(x + width, y + height)
        ctx.closePath()
        ctx.stroke()
      } else if (shape === 'diamond') {
        ctx.beginPath()
        ctx.moveTo(x + width / 2, y)
        ctx.lineTo(x + width, y + height / 2)
        ctx.lineTo(x + width / 2, y + height)
        ctx.lineTo(x, y + height / 2)
        ctx.closePath()
        ctx.stroke()
      }
    }

    if (item.item_type === 'connector' && item.payload.start && item.payload.end) {
      const { start, end, color = '#f8fafc', strokeWidth = 3 } = item.payload
      ctx.beginPath()
      ctx.strokeStyle = color
      ctx.lineWidth = strokeWidth
      ctx.moveTo(start.x, start.y)
      ctx.lineTo(end.x, end.y)
      ctx.stroke()
    }

    if (item.item_type === 'note') {
      const { x = 100, y = 100, width = 240, height = 140, color = '#0f172a', text = '' } = item.payload
      ctx.fillStyle = color
      ctx.fillRect(x, y, width, height)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
      ctx.lineWidth = 1
      ctx.strokeRect(x, y, width, height)
      ctx.fillStyle = '#ffffff'
      ctx.font = '14px sans-serif'
      const lines = text.split('\n')
      lines.slice(0, 6).forEach((line, idx) => {
        ctx.fillText(line.slice(0, 32), x + 12, y + 26 + idx * 18)
      })
    }

    if (item.item_type === 'text') {
      const { x = 100, y = 100, color = '#f8fafc', text = '', fontSize = 16 } = item.payload
      ctx.fillStyle = color
      ctx.font = `${fontSize}px sans-serif`
      const lines = text.split('\n')
      lines.forEach((line, idx) => {
        ctx.fillText(line, x, y + fontSize + idx * (fontSize * 1.25))
      })
    }
  })

  return fallbackCanvas.toDataURL('image/png')
}

export async function exportWhiteboardToStudyGuide(options: ExportStudyGuideOptions): Promise<void> {
  const {
    roomName = 'Studyboard Session',
    items,
    canvasElement = null,
    authorName = 'Studyboard Collaborative Group',
    fileName = 'StudyBoard_Guide.pdf'
  } = options

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 14
  const contentWidth = pageWidth - margin * 2

  let currentY = margin

  pdf.setFillColor(15, 23, 42)
  pdf.rect(margin, currentY, contentWidth, 38, 'F')

  pdf.setFillColor(124, 58, 237)
  pdf.roundedRect(margin + 5, currentY + 5, 48, 5.5, 1.5, 1.5, 'F')
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(7.5)
  pdf.setTextColor(255, 255, 255)
  pdf.text('STUDYBOARD GUIDE', margin + 7.5, currentY + 9)

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(17)
  pdf.setTextColor(255, 255, 255)
  pdf.text('Studyboard Study Guide', margin + 5, currentY + 20)

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9.5)
  pdf.setTextColor(203, 213, 225)
  pdf.text(`Room: ${roomName}   |   ${authorName}`, margin + 5, currentY + 27)

  const timestamp = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
  pdf.setFontSize(8)
  pdf.setTextColor(148, 163, 184)
  pdf.text(`Generated: ${timestamp}   •   Active Elements: ${items.length}`, margin + 5, currentY + 33)

  currentY += 44

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(12)
  pdf.setTextColor(30, 41, 59)
  pdf.text('1. Whiteboard Canvas Snapshot', margin, currentY)
  currentY += 4

  const snapshotDataUrl = await captureCanvasSnapshot(canvasElement, items)

  const imgHeight = 98
  pdf.setFillColor(2, 6, 23)
  pdf.rect(margin, currentY, contentWidth, imgHeight, 'F')
  pdf.addImage(snapshotDataUrl, 'PNG', margin, currentY, contentWidth, imgHeight, undefined, 'FAST')
  pdf.setDrawColor(203, 213, 225)
  pdf.setLineWidth(0.3)
  pdf.rect(margin, currentY, contentWidth, imgHeight, 'S')

  currentY += imgHeight + 4

  pdf.setFont('helvetica', 'italic')
  pdf.setFontSize(8)
  pdf.setTextColor(100, 116, 139)
  pdf.text('High-resolution snapshot of active whiteboard session, drawings, math formulas, and annotations.', margin, currentY)
  currentY += 8

  const structuredNotes = extractStructuredNotes(items)

  if (currentY > pageHeight - 60) {
    pdf.addPage()
    currentY = margin + 4
  }

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(12)
  pdf.setTextColor(30, 41, 59)
  pdf.text('2. Extracted Notes, Formulas & AI Assistant Insights', margin, currentY)
  currentY += 6

  if (structuredNotes.length === 0) {
    pdf.setFillColor(248, 250, 252)
    pdf.rect(margin, currentY, contentWidth, 20, 'F')
    pdf.setDrawColor(226, 232, 240)
    pdf.rect(margin, currentY, contentWidth, 20, 'S')

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(100, 116, 139)
    pdf.text('No sticky notes, AI explanations, or chemistry/math items were pinned to this board.', margin + 6, currentY + 9)
    pdf.text('Tip: Select content on the canvas and use AI Assistant or 3D tools to generate insights.', margin + 6, currentY + 15)
    currentY += 26
  } else {
    for (const note of structuredNotes) {
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8.5)

      let noteLines: string[] = []
      if (note.category === 'ai-tutor') {
        if (note.parsedFormula) noteLines.push(`Topic / Content: ${note.parsedFormula}`)
        if (note.steps && note.steps.length > 0) {
          note.steps.forEach((st, i) => noteLines.push(`${i + 1}. ${st}`))
        }
        if (note.coreConcept) noteLines.push(`Summary: ${note.coreConcept}`)
      } else if (note.category === 'chemistry') {
        if (note.compoundName) noteLines.push(`Compound: ${note.compoundName}`)
        if (note.smiles) noteLines.push(`SMILES Notation: ${note.smiles}`)
        const remaining = note.rawText
          .split('\n')
          .filter(l => !l.includes('🔬') && !l.includes('SMILES:'))
          .join(' ')
          .trim()
        if (remaining) noteLines.push(`Details: ${remaining}`)
      } else if (note.category === 'math') {
        if (note.vertex) noteLines.push(`Vertex: ${note.vertex}`)
        if (note.roots) noteLines.push(`Roots: ${note.roots}`)
        if (note.factoredForm) noteLines.push(`Factored Form: ${note.factoredForm}`)
      } else if (note.category === 'summary' && note.bulletPoints) {
        note.bulletPoints.forEach(pt => noteLines.push(`• ${pt}`))
      } else {
        noteLines = pdf.splitTextToSize(note.rawText, contentWidth - 14)
      }

      const estimatedHeight = Math.max(22, 14 + noteLines.length * 4.4 + 4)

      if (currentY + estimatedHeight > pageHeight - margin) {
        pdf.addPage()
        currentY = margin + 4
      }

      pdf.setFillColor(248, 250, 252)
      pdf.rect(margin, currentY, contentWidth, estimatedHeight, 'F')

      pdf.setDrawColor(226, 232, 240)
      pdf.setLineWidth(0.3)
      pdf.rect(margin, currentY, contentWidth, estimatedHeight, 'S')

      pdf.setFillColor(note.accentColor[0], note.accentColor[1], note.accentColor[2])
      pdf.rect(margin, currentY, 2.5, estimatedHeight, 'F')

      pdf.setFillColor(note.accentColor[0], note.accentColor[1], note.accentColor[2])
      const badgeWidth = Math.min(65, note.badgeText.length * 2.2 + 8)
      pdf.roundedRect(margin + 6, currentY + 3.5, badgeWidth, 4.2, 1, 1, 'F')
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(6.5)
      pdf.setTextColor(255, 255, 255)
      pdf.text(note.badgeText, margin + 8, currentY + 6.5)

      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(9.5)
      pdf.setTextColor(15, 23, 42)
      pdf.text(note.title, margin + 6 + badgeWidth + 4, currentY + 6.8)

      let lineY = currentY + 12.5
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8.5)
      pdf.setTextColor(51, 65, 85)

      for (const line of noteLines) {
        const wrapped = pdf.splitTextToSize(line, contentWidth - 14)
        for (const sub of wrapped) {
          if (lineY > pageHeight - margin - 4) {
            pdf.addPage()
            currentY = margin + 4
            lineY = currentY + 6
          }
          if (sub.startsWith('Parsed Problem:') || sub.startsWith('Core Concept:') || sub.startsWith('SMILES Notation:')) {
            pdf.setFont('helvetica', 'bold')
            pdf.setTextColor(15, 23, 42)
          } else {
            pdf.setFont('helvetica', 'normal')
            pdf.setTextColor(51, 65, 85)
          }
          pdf.text(sub, margin + 6, lineY)
          lineY += 4.2
        }
      }

      currentY += estimatedHeight + 4
    }
  }

  const totalPages = pdf.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i)
    pdf.setDrawColor(226, 232, 240)
    pdf.setLineWidth(0.3)
    pdf.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11)

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(7.5)
    pdf.setTextColor(148, 163, 184)
    pdf.text('Studyboard — AI-Powered Collaborative Learning Whiteboard', margin, pageHeight - 7)
    pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 18, pageHeight - 7)
  }

  pdf.save(fileName)
}
