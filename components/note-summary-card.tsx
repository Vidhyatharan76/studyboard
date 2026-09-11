'use client'

import { useState } from 'react'
import { X, Sparkles, BookOpen, Atom, Calculator, Orbit, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react'

export type NoteSummaryData = {
  id?: string
  documentId?: string
  extractedText: string
  summary: string[]
  detectedSubject: 'Math' | 'Chem' | 'Physics' | 'Biology' | 'General STEM' | string
}

interface NoteSummaryCardProps {
  data: NoteSummaryData
  onClose: () => void
  onPinToCanvas?: () => void
}

export function NoteSummaryCard({ data, onClose, onPinToCanvas }: NoteSummaryCardProps) {
  const [showExtracted, setShowExtracted] = useState(false)
  const [copied, setCopied] = useState(false)

  const subjectBadge = {
    Math: { bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', icon: Calculator },
    Chem: { bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', icon: Atom },
    Physics: { bg: 'bg-sky-500/20 text-sky-300 border-sky-500/30', icon: Orbit },
    Biology: { bg: 'bg-lime-500/20 text-lime-300 border-lime-500/30', icon: BookOpen },
    'General STEM': { bg: 'bg-violet-500/20 text-violet-300 border-violet-500/30', icon: Sparkles }
  }[data.detectedSubject] || { bg: 'bg-violet-500/20 text-violet-300 border-violet-500/30', icon: Sparkles }

  const Icon = subjectBadge.icon

  const handleCopy = () => {
    const text = `Subject: ${data.detectedSubject}\n\nSummary:\n${data.summary.map(s => `• ${s}`).join('\n')}\n\nExtracted Text:\n${data.extractedText}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-violet-500/30 bg-slate-900/95 p-4 text-slate-100 shadow-2xl backdrop-blur-xl transition-all">
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${subjectBadge.bg}`}>
            <Icon size={13} />
            {data.detectedSubject} Note
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onPointerDown={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
            onClick={e => {
              e.stopPropagation()
              handleCopy()
            }}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 cursor-pointer"
            title="Copy summary"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
          <button
            type="button"
            onPointerDown={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
            onClick={e => {
              e.stopPropagation()
              onClose()
            }}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors cursor-pointer"
            title="Dismiss summary"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Core Concepts & Takeaways
        </h5>
        <ul className="space-y-1.5 text-xs leading-relaxed text-slate-200">
          {data.summary.map((point, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-violet-400" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {data.extractedText && (
        <div className="mt-3 border-t border-slate-800/80 pt-2.5">
          <button
            type="button"
            onPointerDown={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
            onClick={e => {
              e.stopPropagation()
              setShowExtracted(v => !v)
            }}
            className="flex w-full items-center justify-between text-[11px] font-medium text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            <span>Transcribed Formulas & Text</span>
            {showExtracted ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showExtracted && (
            <div className="mt-2 max-h-36 overflow-y-auto rounded-lg bg-slate-950/80 p-2 font-mono text-[11px] leading-relaxed text-slate-300 border border-slate-800">
              <pre className="whitespace-pre-wrap">{data.extractedText}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
