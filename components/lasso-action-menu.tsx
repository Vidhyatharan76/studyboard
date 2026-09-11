'use client'

import { Atom, LineChart, Sparkles, X } from 'lucide-react'

interface LassoActionMenuProps {
  position: { x: number; y: number }
  onRenderMolecule: () => void
  onPlotGraph: () => void
  onAiExplain: () => void
  onCancel: () => void
}

export function LassoActionMenu({
  position,
  onRenderMolecule,
  onPlotGraph,
  onAiExplain,
  onCancel
}: LassoActionMenuProps) {
  const top = Math.max(70, Math.min(window.innerHeight - 100, position.y))
  const left = Math.max(20, Math.min(window.innerWidth - 360, position.x))

  return (
    <div
      style={{ left: `${left}px`, top: `${top}px` }}
      className="fixed z-50 flex items-center gap-1 rounded-2xl border border-violet-500/40 bg-slate-950/95 p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.8)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 select-none"
    >
      <div className="flex items-center gap-1">
        <button
          onClick={onRenderMolecule}
          className="flex items-center gap-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600 px-3 py-2 text-xs font-semibold text-violet-200 hover:text-white transition-all shadow-sm group"
          title="Detect chemical formula and render interactive 3D molecule"
        >
          <Atom size={15} className="text-violet-400 group-hover:text-white" />
          <span>Render 3D Molecule</span>
        </button>

        <button
          onClick={onPlotGraph}
          className="flex items-center gap-1.5 rounded-xl bg-sky-600/20 hover:bg-sky-600 px-3 py-2 text-xs font-semibold text-sky-200 hover:text-white transition-all shadow-sm group"
          title="Plot quadratic parabola graph & roots"
        >
          <LineChart size={15} className="text-sky-400 group-hover:text-white" />
          <span>Plot Graph</span>
        </button>

        <button
          onClick={onAiExplain}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 px-3 py-2 text-xs font-semibold text-emerald-200 hover:text-white transition-all shadow-sm group"
          title="General-purpose AI: explain, answer, brainstorm, or analyze anything selected"
        >
          <Sparkles size={15} className="text-emerald-400 group-hover:text-white" />
          <span>AI Assistant</span>
        </button>
      </div>

      <div className="h-5 w-[1px] bg-slate-800 mx-1" />

      <button
        onClick={onCancel}
        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
        title="Deselect"
      >
        <X size={15} />
      </button>
    </div>
  )
}
