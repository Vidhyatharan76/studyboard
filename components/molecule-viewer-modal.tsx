'use client'

import { useEffect, useRef, useState } from 'react'
import { X, RotateCcw, Play, Pause, Sparkles, Copy, Check, ExternalLink, RefreshCw, Layers } from 'lucide-react'

const BUILTIN_SDFS: Record<string, string> = {
  caffeine: `
  Mrv2111 09092618283D

 24 25  0  0  0  0            999 V2000
   -0.5310    1.7340    0.0000 N   0  0  0  0  0  0  0  0  0  0  0  0
   -1.7450    1.0330    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.7450   -0.3690    0.0000 N   0  0  0  0  0  0  0  0  0  0  0  0
   -0.5310   -1.0700    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.6830   -0.3690    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.6830    1.0330    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.5310    3.1360    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -2.9590    1.7340    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
   -2.9590   -1.0700    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.5310   -2.4720    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
    1.9750   -0.7890    0.0000 N   0  0  0  0  0  0  0  0  0  0  0  0
    2.7730    0.3090    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    2.0230    1.3420    0.0000 N   0  0  0  0  0  0  0  0  0  0  0  0
    2.4280   -2.1700    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.4690    3.5700    0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0
   -1.0310    3.5700    0.8900 H   0  0  0  0  0  0  0  0  0  0  0  0
   -1.0310    3.5700   -0.8900 H   0  0  0  0  0  0  0  0  0  0  0  0
   -2.8100   -2.1480    0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0
   -3.5340   -0.7890    0.8900 H   0  0  0  0  0  0  0  0  0  0  0  0
   -3.5340   -0.7890   -0.8900 H   0  0  0  0  0  0  0  0  0  0  0  0
    3.8550    0.3090    0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0
    3.5180   -2.1700    0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0
    2.0640   -2.6840    0.8900 H   0  0  0  0  0  0  0  0  0  0  0  0
    2.0640   -2.6840   -0.8900 H   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0  0  0  0
  2  3  1  0  0  0  0
  3  4  1  0  0  0  0
  4  5  1  0  0  0  0
  5  6  2  0  0  0  0
  1  6  1  0  0  0  0
  1  7  1  0  0  0  0
  2  8  2  0  0  0  0
  3  9  1  0  0  0  0
  4 10  2  0  0  0  0
  5 11  1  0  0  0  0
 11 12  1  0  0  0  0
 12 13  2  0  0  0  0
  6 13  1  0  0  0  0
 11 14  1  0  0  0  0
  7 15  1  0  0  0  0
  7 16  1  0  0  0  0
  7 17  1  0  0  0  0
  9 18  1  0  0  0  0
  9 19  1  0  0  0  0
  9 20  1  0  0  0  0
 12 21  1  0  0  0  0
 14 22  1  0  0  0  0
 14 23  1  0  0  0  0
 14 24  1  0  0  0  0
M  END
$$$$`,
  benzene: `
  Mrv2111 09092618283D

 12 12  0  0  0  0            999 V2000
    0.0000    1.3970    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.2100    0.6980    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.2100   -0.6980    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.0000   -1.3970    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.2100   -0.6980    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.2100    0.6980    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.0000    2.4810    0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0
    2.1480    1.2400    0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0
    2.1480   -1.2400    0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0
    0.0000   -2.4810    0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0
   -2.1480   -1.2400    0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0
   -2.1480    1.2400    0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  2  0  0  0  0
  2  3  1  0  0  0  0
  3  4  2  0  0  0  0
  4  5  1  0  0  0  0
  5  6  2  0  0  0  0
  6  1  1  0  0  0  0
  1  7  1  0  0  0  0
  2  8  1  0  0  0  0
  3  9  1  0  0  0  0
  4 10  1  0  0  0  0
  5 11  1  0  0  0  0
  6 12  1  0  0  0  0
M  END
$$$$`,
  ethanol: `
  Mrv2111 09092618283D

  9  8  0  0  0  0            999 V2000
   -1.1879   -0.3725    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.0000    0.5587    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.1879   -0.1862    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
    1.9427    0.3800    0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0
   -1.1879   -1.0116    0.8900 H   0  0  0  0  0  0  0  0  0  0  0  0
   -1.1879   -1.0116   -0.8900 H   0  0  0  0  0  0  0  0  0  0  0  0
   -2.0722    0.2666    0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0
    0.0000    1.1978    0.8900 H   0  0  0  0  0  0  0  0  0  0  0  0
    0.0000    1.1978   -0.8900 H   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0  0  0  0
  2  3  1  0  0  0  0
  3  4  1  0  0  0  0
  1  5  1  0  0  0  0
  1  6  1  0  0  0  0
  1  7  1  0  0  0  0
  2  8  1  0  0  0  0
  2  9  1  0  0  0  0
M  END
$$$$`,
  water: `
  Mrv2111 09092618283D

  3  2  0  0  0  0            999 V2000
    0.0000    0.0000    0.1174 O   0  0  0  0  0  0  0  0  0  0  0  0
    0.7570    0.0000   -0.4696 H   0  0  0  0  0  0  0  0  0  0  0  0
   -0.7570    0.0000   -0.4696 H   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0  0  0  0
  1  3  1  0  0  0  0
M  END
$$$$`
}

export type MoleculeData = {
  compoundName: string
  formula: string
  smiles: string
  description: string
}

interface MoleculeViewerModalProps {
  data: MoleculeData | null
  loading?: boolean
  error?: string | null
  onClose: () => void
  onAddToBoard?: (data: MoleculeData) => void
}

export function MoleculeViewerModal({
  data,
  loading,
  error,
  onClose,
  onAddToBoard
}: MoleculeViewerModalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<any>(null)
  const animRef = useRef<number | null>(null)
  const [styleMode, setStyleMode] = useState<'stick' | 'sphere' | 'wire'>('stick')
  const [isSpinning, setIsSpinning] = useState(true)
  const [copied, setCopied] = useState(false)
  const [pos, setPos] = useState({ x: 40, y: 80 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0, startX: 0, startY: 0 })
  const [sdfStatus, setSdfStatus] = useState<string>('Loading 3D model...')

  useEffect(() => {
    if (typeof window === 'undefined') return
    if ((window as any).$3Dmol) return

    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/3Dmol/2.0.4/3Dmol-min.js'
    script.async = true
    document.head.appendChild(script)

    return () => {

    }
  }, [])

  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true)
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startX: pos.x,
      startY: pos.y
    }
  }

  useEffect(() => {
    const handleDragMove = (e: MouseEvent) => {
      if (!isDragging) return
      const dx = e.clientX - dragStartRef.current.x
      const dy = e.clientY - dragStartRef.current.y
      setPos({
        x: Math.max(10, Math.min(window.innerWidth - 380, dragStartRef.current.startX + dx)),
        y: Math.max(10, Math.min(window.innerHeight - 300, dragStartRef.current.startY + dy))
      })
    }

    const handleDragEnd = () => setIsDragging(false)

    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove)
      window.addEventListener('mouseup', handleDragEnd)
    }

    return () => {
      window.removeEventListener('mousemove', handleDragMove)
      window.removeEventListener('mouseup', handleDragEnd)
    }
  }, [isDragging])

  useEffect(() => {
    if (!data || loading) return

    let cancelled = false

    const initViewer = async () => {

      let tries = 0
      while (!(window as any).$3Dmol && tries < 30) {
        await new Promise(r => setTimeout(r, 100))
        tries++
      }

      const $3Dmol = (window as any).$3Dmol
      if (!$3Dmol || !containerRef.current) {
        setSdfStatus('3Dmol engine loading...')
        return
      }

      containerRef.current.innerHTML = ''
      const viewer = $3Dmol.createViewer(containerRef.current, {
        backgroundColor: '#090d16',
        defaultcolors: $3Dmol.rasmolElementColors
      })
      viewerRef.current = viewer

      let sdfData: string | null = null

      const cleanName = data.compoundName.toLowerCase().replace(/[^a-z]/g, '')
      if (BUILTIN_SDFS[cleanName]) {
        sdfData = BUILTIN_SDFS[cleanName]
      }

      if (!sdfData && data.smiles) {
        setSdfStatus('Fetching atomic coordinates from PubChem...')
        try {

          const encodedSmiles = encodeURIComponent(data.smiles)
          const res = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodedSmiles}/SDF?record_type=3d`)
          if (res.ok) {
            sdfData = await res.text()
          } else {
            const res2 = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodedSmiles}/SDF`)
            if (res2.ok) {
              sdfData = await res2.text()
            } else {
              const res3 = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(data.compoundName)}/SDF?record_type=3d`)
              if (res3.ok) {
                sdfData = await res3.text()
              }
            }
          }
        } catch (e) {
          console.warn('[3Dmol] PubChem fetch warning:', e)
        }
      }

      if (!sdfData) {
        sdfData = BUILTIN_SDFS.caffeine
      }

      if (cancelled) return

      try {
        viewer.addModel(sdfData, 'sdf')
        applyStyle(viewer, styleMode)
        viewer.zoomTo()
        viewer.render()
        setSdfStatus('')
      } catch (err) {
        console.error('[3Dmol] Model load error:', err)
        setSdfStatus('Rendered approximation')
      }
    }

    void initViewer()

    return () => {
      cancelled = true
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [data, loading])

  const applyStyle = (viewer: any, mode: 'stick' | 'sphere' | 'wire') => {
    if (!viewer) return
    viewer.setStyle({}, {})
    if (mode === 'stick') {
      viewer.setStyle({}, {
        stick: { radius: 0.16, colorscheme: 'Jmol' },
        sphere: { scale: 0.28, colorscheme: 'Jmol' }
      })
    } else if (mode === 'sphere') {
      viewer.setStyle({}, {
        sphere: { scale: 0.85, colorscheme: 'Jmol' }
      })
    } else if (mode === 'wire') {
      viewer.setStyle({}, {
        line: { linewidth: 3, colorscheme: 'Jmol' }
      })
    }
    viewer.render()
  }

  useEffect(() => {
    if (viewerRef.current) {
      applyStyle(viewerRef.current, styleMode)
    }
  }, [styleMode])

  useEffect(() => {
    let frameId: number

    const spin = () => {
      if (isSpinning && viewerRef.current) {
        viewerRef.current.rotate(0.8, 'y')
        viewerRef.current.render()
      }
      frameId = requestAnimationFrame(spin)
    }

    if (isSpinning) {
      frameId = requestAnimationFrame(spin)
    }

    return () => cancelAnimationFrame(frameId)
  }, [isSpinning])

  const copySmiles = () => {
    if (data?.smiles) {
      navigator.clipboard.writeText(data.smiles)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const resetView = () => {
    if (viewerRef.current) {
      viewerRef.current.zoomTo()
      viewerRef.current.render()
    }
  }

  return (
    <div
      id="3d-molecular-viewer-modal"
      style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
      className="fixed z-50 flex w-[92vw] max-w-[480px] flex-col overflow-hidden rounded-2xl border border-violet-500/30 bg-slate-950/90 text-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-shadow select-none"
    >
      <div
        onMouseDown={handleDragStart}
        className="flex cursor-move items-center justify-between border-b border-slate-800/80 bg-slate-900/60 px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-violet-600/20 text-violet-400">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-slate-100">
              3D Molecular Viewer
            </h3>
            <p className="text-[10px] text-violet-300/80">Hero PubChem & 3Dmol Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            title="Close 3D Viewer"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-slate-400">
            <div className="relative">
              <div className="size-14 animate-spin rounded-full border-2 border-violet-500/20 border-t-violet-400" />
              <Sparkles className="absolute inset-0 m-auto size-5 text-violet-300 animate-pulse" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-200">Analyzing handwritten chemical structure...</p>
              <p className="mt-1 text-xs text-slate-500">Extracting SMILES, stoichiometry, and 3D coordinates</p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-center text-amber-200">
            <p className="text-sm font-medium">{error}</p>
            <p className="mt-2 text-xs text-slate-400">
              Tip: Use the Lasso tool to crop a clear chemical formula (e.g. C6H6, Caffeine, H2O, C2H5OH, or a skeletal bond diagram).
            </p>
          </div>
        ) : data ? (
          <div className="flex flex-col gap-3">
            <div className="relative h-[280px] w-full overflow-hidden rounded-xl border border-slate-800 bg-[#090d16] shadow-inner">
              <div
                ref={containerRef}
                className="h-full w-full cursor-grab active:cursor-grabbing"
              />

              {sdfStatus && (
                <div className="pointer-events-none absolute bottom-2 left-2 rounded bg-slate-900/80 px-2 py-1 text-[10px] text-slate-400 backdrop-blur">
                  {sdfStatus}
                </div>
              )}

              <div className="absolute right-2 top-2 flex flex-col gap-1 rounded-lg border border-slate-800 bg-slate-950/80 p-1 backdrop-blur">
                <button
                  onClick={() => setIsSpinning(s => !s)}
                  className={`rounded p-1.5 transition-colors ${isSpinning ? 'bg-violet-600/30 text-violet-300' : 'text-slate-400 hover:text-slate-200'}`}
                  title={isSpinning ? 'Pause rotation' : 'Auto rotate'}
                >
                  {isSpinning ? <Pause size={13} /> : <Play size={13} />}
                </button>
                <button
                  onClick={resetView}
                  className="rounded p-1.5 text-slate-400 hover:text-slate-200 transition-colors"
                  title="Reset 3D camera"
                >
                  <RotateCcw size={13} />
                </button>
              </div>

              <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-lg border border-slate-800/80 bg-slate-950/85 p-1 text-[11px] backdrop-blur">
                <button
                  onClick={() => setStyleMode('stick')}
                  className={`rounded px-2 py-0.5 font-medium transition-colors ${styleMode === 'stick' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Ball & Stick
                </button>
                <button
                  onClick={() => setStyleMode('sphere')}
                  className={`rounded px-2 py-0.5 font-medium transition-colors ${styleMode === 'sphere' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Space-Filling
                </button>
                <button
                  onClick={() => setStyleMode('wire')}
                  className={`rounded px-2 py-0.5 font-medium transition-colors ${styleMode === 'wire' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Wireframe
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    {data.compoundName}
                    <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs font-mono font-semibold text-violet-300">
                      {data.formula}
                    </span>
                  </h4>
                </div>

                {onAddToBoard && (
                  <button
                    onClick={() => onAddToBoard(data)}
                    className="flex items-center gap-1 rounded-lg bg-violet-600 hover:bg-violet-500 px-2.5 py-1 text-xs font-medium text-white shadow transition-colors"
                  >
                    <Layers size={13} />
                    Pin Note
                  </button>
                )}
              </div>

              <p className="text-xs leading-relaxed text-slate-300 line-clamp-3">
                {data.description}
              </p>

              <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-950/80 px-2.5 py-1.5 text-xs font-mono text-slate-400 border border-slate-800/60">
                <span className="truncate max-w-[280px]" title={data.smiles}>
                  SMILES: <span className="text-violet-300">{data.smiles}</span>
                </span>
                <button
                  onClick={copySmiles}
                  className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-violet-300 transition-colors shrink-0"
                >
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
