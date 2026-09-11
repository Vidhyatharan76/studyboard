'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot
} from 'recharts'
import { X, LineChart as ChartIcon, Sparkles, Layers, Sliders, RefreshCw } from 'lucide-react'

export type MathPlotData = {
  equation: string
  a: number
  b: number
  c: number
  roots: number[]
  vertex: { x: number; y: number }
  yIntercept: number
  discriminant?: number
  factoredForm?: string
  axisOfSymmetry?: string
}

interface GraphPlotterModalProps {
  data: MathPlotData | null
  loading?: boolean
  error?: string | null
  onClose: () => void
  onAddToBoard?: (data: MathPlotData) => void
}

export function GraphPlotterModal({
  data,
  loading,
  error,
  onClose,
  onAddToBoard
}: GraphPlotterModalProps) {
  const [pos, setPos] = useState({ x: 60, y: 90 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0, startX: 0, startY: 0 })

  const [coeffA, setCoeffA] = useState(1)
  const [coeffB, setCoeffB] = useState(-4)
  const [coeffC, setCoeffC] = useState(3)

  useEffect(() => {
    if (data) {
      setCoeffA(data.a ?? 1)
      setCoeffB(data.b ?? 0)
      setCoeffC(data.c ?? 0)
    }
  }, [data])

  const calculated = useMemo(() => {
    const a = coeffA === 0 ? 0.001 : coeffA
    const b = coeffB
    const c = coeffC
    const disc = b * b - 4 * a * c
    const vx = -b / (2 * a)
    const vy = a * vx * vx + b * vx + c

    let roots: number[] = []
    if (disc >= 0) {
      const r1 = (-b + Math.sqrt(disc)) / (2 * a)
      const r2 = (-b - Math.sqrt(disc)) / (2 * a)
      roots = Array.from(new Set([Number(r2.toFixed(2)), Number(r1.toFixed(2))]))
    }

    let factored = 'No real factors (complex roots)'
    if (disc > 0 && roots.length === 2) {
      const sign0 = roots[0] >= 0 ? `- ${roots[0]}` : `+ ${Math.abs(roots[0])}`
      const sign1 = roots[1] >= 0 ? `- ${roots[1]}` : `+ ${Math.abs(roots[1])}`
      factored = `y = ${a !== 1 ? `${a}` : ''}(x ${sign0})(x ${sign1})`
    } else if (disc === 0 && roots.length === 1) {
      const sign = roots[0] >= 0 ? `- ${roots[0]}` : `+ ${Math.abs(roots[0])}`
      factored = `y = ${a !== 1 ? `${a}` : ''}(x ${sign})²`
    }

    return {
      a,
      b,
      c,
      disc: Number(disc.toFixed(2)),
      vertex: { x: Number(vx.toFixed(2)), y: Number(vy.toFixed(2)) },
      roots,
      factored,
      equation: `y = ${a !== 1 ? `${a}` : ''}x² ${b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`}x ${c >= 0 ? `+ ${c}` : `- ${Math.abs(c)}`}`
    }
  }, [coeffA, coeffB, coeffC])

  const chartData = useMemo(() => {
    const points: Array<{ x: number; y: number }> = []
    const step = 0.5
    for (let x = -10; x <= 10.05; x += step) {
      const cleanX = Number(x.toFixed(1))
      const y = calculated.a * cleanX * cleanX + calculated.b * cleanX + calculated.c
      if (y >= -50 && y <= 60) {
        points.push({ x: cleanX, y: Number(y.toFixed(2)) })
      }
    }
    return points
  }, [calculated])

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
        x: Math.max(10, Math.min(window.innerWidth - 450, dragStartRef.current.startX + dx)),
        y: Math.max(10, Math.min(window.innerHeight - 320, dragStartRef.current.startY + dy))
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

  return (
    <div
      id="graph-plotter-panel-modal"
      style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
      className="fixed z-50 flex w-[94vw] max-w-[560px] flex-col overflow-hidden rounded-2xl border border-sky-500/30 bg-slate-950/90 text-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-xl select-none"
    >
      <div
        onMouseDown={handleDragStart}
        className="flex cursor-move items-center justify-between border-b border-slate-800/80 bg-slate-900/60 px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400">
            <ChartIcon size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-slate-100">
              Quadratic Equation Visualizer
            </h3>
            <p className="text-[10px] text-sky-300/80">2D Cartesian Coordinate Parabola Analysis</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            title="Close Plotter"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-slate-400">
            <div className="size-12 animate-spin rounded-full border-2 border-sky-500/20 border-t-sky-400" />
            <div className="text-center">
              <p className="text-sm font-medium text-slate-200">Parsing quadratic mathematical expression...</p>
              <p className="mt-1 text-xs text-slate-500">Extracting coefficients, vertex, discriminant, and roots</p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-center text-amber-200">
            <p className="text-sm font-medium">{error}</p>
            <p className="mt-2 text-xs text-slate-400">
              Tip: Ensure the Lasso crop contains a clear quadratic or algebraic equation (e.g. y = x^2 - 4x + 3).
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-900/60 p-3 border border-slate-800/80">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-sky-400">Standard Form</span>
                <p className="font-mono text-base font-bold text-sky-200">
                  {calculated.equation}
                </p>
              </div>

              {onAddToBoard && (
                <button
                  onClick={() => onAddToBoard({
                    equation: calculated.equation,
                    a: calculated.a,
                    b: calculated.b,
                    c: calculated.c,
                    roots: calculated.roots,
                    vertex: calculated.vertex,
                    yIntercept: calculated.c,
                    discriminant: calculated.disc,
                    factoredForm: calculated.factored
                  })}
                  className="flex items-center gap-1 rounded-lg bg-sky-600 hover:bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white shadow transition-colors"
                >
                  <Layers size={13} />
                  Pin to Board
                </button>
              )}
            </div>

            <div className="relative h-[250px] w-full rounded-xl border border-slate-800 bg-[#090d16] p-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 12, right: 15, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="x"
                    stroke="#64748b"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    domain={[-10, 10]}
                    type="number"
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    domain={[-15, 25]}
                    allowDataOverflow={true}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const pt = payload[0].payload
                        return (
                          <div className="rounded-lg border border-slate-700 bg-slate-900/95 p-2 text-xs shadow-xl backdrop-blur font-mono">
                            <p className="text-slate-300">x: <span className="text-sky-300">{pt.x}</span></p>
                            <p className="text-slate-300">y: <span className="text-indigo-300">{pt.y}</span></p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />

                  <ReferenceLine x={0} stroke="#475569" strokeWidth={1.5} />
                  <ReferenceLine y={0} stroke="#475569" strokeWidth={1.5} />

                  <Line
                    type="monotone"
                    dataKey="y"
                    stroke="#38bdf8"
                    strokeWidth={2.5}
                    dot={false}
                    isAnimationActive={false}
                  />

                  {calculated.vertex.x >= -10 && calculated.vertex.x <= 10 && (
                    <ReferenceDot
                      x={calculated.vertex.x}
                      y={calculated.vertex.y}
                      r={5}
                      fill="#f43f5e"
                      stroke="#ffffff"
                      strokeWidth={1.5}
                      label={{
                        value: `V(${calculated.vertex.x}, ${calculated.vertex.y})`,
                        position: calculated.a > 0 ? 'bottom' : 'top',
                        fill: '#f43f5e',
                        fontSize: 10,
                        fontWeight: 'bold'
                      }}
                    />
                  )}

                  {calculated.roots.map((r, idx) => (
                    <ReferenceDot
                      key={`root-${idx}`}
                      x={r}
                      y={0}
                      r={4.5}
                      fill="#10b981"
                      stroke="#ffffff"
                      strokeWidth={1.5}
                      label={{
                        value: `x=${r}`,
                        position: 'top',
                        fill: '#10b981',
                        fontSize: 9,
                        fontWeight: 'bold'
                      }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-2.5">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Vertex (h, k)</span>
                <p className="mt-1 font-mono font-bold text-rose-400">
                  ({calculated.vertex.x}, {calculated.vertex.y})
                </p>
                <span className="text-[9px] text-slate-500">
                  {calculated.a > 0 ? 'Global Minimum' : 'Global Maximum'}
                </span>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-2.5">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Discriminant Δ</span>
                <p className="mt-1 font-mono font-bold text-amber-300">
                  {calculated.disc}
                </p>
                <span className="text-[9px] text-slate-500">
                  {calculated.disc > 0 ? '2 Real Roots' : calculated.disc === 0 ? '1 Repeated Root' : '0 Real Roots'}
                </span>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-2.5">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Factored Form</span>
                <p className="mt-1 font-mono font-bold text-emerald-400 truncate" title={calculated.factored}>
                  {calculated.factored}
                </p>
                <span className="text-[9px] text-slate-500">Roots: {calculated.roots.join(', ') || 'None'}</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-3 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                <span className="flex items-center gap-1 text-slate-300">
                  <Sliders size={12} /> Interactive Coefficients
                </span>
                <button
                  onClick={() => {
                    setCoeffA(1)
                    setCoeffB(-4)
                    setCoeffC(3)
                  }}
                  className="flex items-center gap-1 text-[10px] text-sky-400 hover:underline"
                >
                  <RefreshCw size={10} /> Reset
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>a (curvature)</span>
                    <span className="text-sky-300">{coeffA}</span>
                  </div>
                  <input
                    type="range"
                    min="-5"
                    max="5"
                    step="0.5"
                    value={coeffA}
                    onChange={e => setCoeffA(parseFloat(e.target.value))}
                    className="w-full accent-sky-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>b (shift)</span>
                    <span className="text-sky-300">{coeffB}</span>
                  </div>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="0.5"
                    value={coeffB}
                    onChange={e => setCoeffB(parseFloat(e.target.value))}
                    className="w-full accent-sky-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>c (intercept)</span>
                    <span className="text-sky-300">{coeffC}</span>
                  </div>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="0.5"
                    value={coeffC}
                    onChange={e => setCoeffC(parseFloat(e.target.value))}
                    className="w-full accent-sky-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
