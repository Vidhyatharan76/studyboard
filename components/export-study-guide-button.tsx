'use client'

import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'
import {
  exportWhiteboardToStudyGuide,
  WhiteboardItem
} from '@/lib/export-study-guide'

export interface ExportStudyGuideButtonProps {
  items: WhiteboardItem[]
  roomName?: string
  surfaceRef?: React.RefObject<HTMLElement | null>
  canvasElementId?: string
  authorName?: string
  variant?: 'header' | 'floating' | 'default'
  className?: string
}

export function ExportStudyGuideButton({
  items,
  roomName = 'Studyboard Session',
  surfaceRef,
  canvasElementId = 'studyboard-canvas-surface',
  authorName = 'Studyboard Session',
  variant = 'header',
  className = ''
}: ExportStudyGuideButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    if (isExporting) return

    setIsExporting(true)
    try {
      const targetElement = surfaceRef?.current || document.getElementById(canvasElementId)

      await exportWhiteboardToStudyGuide({
        roomName,
        items,
        canvasElement: targetElement,
        authorName,
        fileName: 'StudyBoard_Guide.pdf'
      })

      await Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Study Guide Downloaded',
        text: 'Saved cleanly as StudyBoard_Guide.pdf',
        timer: 2500,
        showConfirmButton: false,
        customClass: { popup: 'studyboard-swal' }
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error during export'
      await Swal.fire({
        icon: 'error',
        title: 'Export Failed',
        text: `Failed to compile PDF study guide: ${message}`,
        confirmButtonText: 'Understood',
        customClass: { popup: 'studyboard-swal' }
      })
    } finally {
      setIsExporting(false)
    }
  }

  if (variant === 'header') {
    return (
      <button
        id="export-study-guide-btn"
        type="button"
        onClick={handleExport}
        disabled={isExporting}
        title="Download PDF Study Guide (Snapshot & Extracted Notes)"
        className={`flex items-center gap-1.5 rounded-xl border border-violet-500/40 bg-violet-950/60 px-2.5 py-1.5 text-xs font-medium text-violet-200 hover:bg-violet-900/60 hover:text-white hover:border-violet-500/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${className}`}
      >
        {isExporting ? (
          <Loader2 size={13} className="animate-spin text-violet-400" />
        ) : (
          <FileDown size={13} className="text-violet-400" />
        )}
        <span className="hidden sm:inline">
          {isExporting ? 'Generating…' : 'Export Guide'}
        </span>
      </button>
    )
  }

  return (
    <button
      id="export-study-guide-btn"
      type="button"
      onClick={handleExport}
      disabled={isExporting}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-50 shadow-md ${className}`}
    >
      {isExporting ? (
        <Loader2 size={15} className="animate-spin" />
      ) : (
        <FileDown size={15} />
      )}
      <span>{isExporting ? 'Generating PDF...' : 'Download Study Guide'}</span>
    </button>
  )
}
