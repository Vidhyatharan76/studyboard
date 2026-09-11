'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  MousePointer2,
  Hand,
  Pen,
  Highlighter,
  Eraser,
  Sparkles,
  Square,
  Circle,
  Triangle,
  Diamond,
  ArrowRight,
  MoveHorizontal,
  Minus,
  FileUp,
  Type,
  StickyNote,
  ChevronDown,
  RotateCcw,
  RotateCw,
  Trash2,
  Sliders,
  Pipette
} from 'lucide-react'

export type ToolType =
  | 'select'
  | 'pan'
  | 'pen'
  | 'highlighter'
  | 'eraser'
  | 'lasso'
  | 'shape'
  | 'connector'
  | 'note'
  | 'text'

export type ShapeKind = 'rectangle' | 'ellipse' | 'triangle' | 'diamond'
export type ConnectorKind = 'line' | 'arrow' | 'double'
export type LineStyle = 'solid' | 'dashed'

interface FloatingToolbarProps {
  currentTool: ToolType
  onSelectTool: (tool: ToolType) => void
  shapeKind: ShapeKind
  onChangeShapeKind: (kind: ShapeKind) => void
  connectorKind: ConnectorKind
  onChangeConnectorKind: (kind: ConnectorKind) => void
  lineStyle: LineStyle
  onToggleLineStyle: () => void
  currentColor: string
  onChangeColor: (color: string) => void
  brushSize: number
  onChangeBrushSize: (size: number) => void
  textSize?: number
  onChangeTextSize?: (size: number) => void
  onImportFile: (file: File) => void
  onClearCanvas: () => void
  onUndo?: () => void
  onRedo?: () => void
  canUndo?: boolean
  canRedo?: boolean
}

const PALETTE = [
  '#f8fafc',
  '#fef08a',
  '#38bdf8',
  '#4ade80',
  '#f472b6',
  '#c084fc',
  '#fb923c',
  '#f87171',
  '#818cf8',
  '#2dd4bf',
  '#94a3b8',
  '#0f172a'
]

const STROKE_PRESETS = [
  { label: 'Fine', size: 2 },
  { label: 'Medium', size: 4 },
  { label: 'Bold', size: 8 },
  { label: 'Heavy', size: 14 }
]

export const TEXT_SIZE_PRESETS = [
  { label: 'Small', size: 14 },
  { label: 'Medium', size: 18 },
  { label: 'Large', size: 24 },
  { label: 'Extra Large', size: 32 },
  { label: 'Display', size: 44 }
]

export function FloatingToolbar({
  currentTool,
  onSelectTool,
  shapeKind,
  onChangeShapeKind,
  connectorKind,
  onChangeConnectorKind,
  lineStyle,
  onToggleLineStyle,
  currentColor,
  onChangeColor,
  brushSize,
  onChangeBrushSize,
  textSize = 18,
  onChangeTextSize,
  onImportFile,
  onClearCanvas,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false
}: FloatingToolbarProps) {
  const [showShapeMenu, setShowShapeMenu] = useState(false)
  const [showConnectorMenu, setShowConnectorMenu] = useState(false)
  const [showColorMenu, setShowColorMenu] = useState(false)
  const [showStrokeMenu, setShowStrokeMenu] = useState(false)
  const [showTextSizeMenu, setShowTextSizeMenu] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const shapeMenuRef = useRef<HTMLDivElement>(null)
  const connectorMenuRef = useRef<HTMLDivElement>(null)
  const colorMenuRef = useRef<HTMLDivElement>(null)
  const strokeMenuRef = useRef<HTMLDivElement>(null)
  const textSizeMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: Event) => {
      const target = e.target as Node
      if (shapeMenuRef.current && !shapeMenuRef.current.contains(target)) {
        setShowShapeMenu(false)
      }
      if (connectorMenuRef.current && !connectorMenuRef.current.contains(target)) {
        setShowConnectorMenu(false)
      }
      if (colorMenuRef.current && !colorMenuRef.current.contains(target)) {
        setShowColorMenu(false)
      }
      if (strokeMenuRef.current && !strokeMenuRef.current.contains(target)) {
        setShowStrokeMenu(false)
      }
      if (textSizeMenuRef.current && !textSizeMenuRef.current.contains(target)) {
        setShowTextSizeMenu(false)
      }
    }
    document.addEventListener('pointerdown', handleClickOutside)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const shapeIcons = {
    rectangle: Square,
    ellipse: Circle,
    triangle: Triangle,
    diamond: Diamond
  }
  const ActiveShapeIcon = shapeIcons[shapeKind]

  const connectorIcons = {
    line: Minus,
    arrow: ArrowRight,
    double: MoveHorizontal
  }
  const ActiveConnectorIcon = connectorIcons[connectorKind]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onImportFile(file)
      e.target.value = ''
    }
  }

  return (
    <div
      id="floating-toolbar"
      className="fixed top-14 sm:top-16 left-1/2 z-40 flex flex-col md:flex-row -translate-x-1/2 items-center gap-1 rounded-2xl border border-slate-700/80 bg-slate-950/95 p-1 sm:p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.7)] backdrop-blur-xl select-none max-w-[calc(100vw-0.75rem)] sm:max-w-fit"
    >

      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">

        {(onUndo || onRedo) && (
          <div className="flex items-center gap-0.5 pr-1 border-r border-slate-800 shrink-0">
            {onUndo && (
              <button
                id="toolbar-undo"
                onClick={onUndo}
                disabled={!canUndo}
                className={`flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center rounded-xl transition-all ${
                  canUndo ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-slate-600 cursor-not-allowed'
                }`}
                title="Undo (Ctrl+Z)"
              >
                <RotateCcw size={14} />
              </button>
            )}
            {onRedo && (
              <button
                id="toolbar-redo"
                onClick={onRedo}
                disabled={!canRedo}
                className={`flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center rounded-xl transition-all ${
                  canRedo ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-slate-600 cursor-not-allowed'
                }`}
                title="Redo (Ctrl+Shift+Z)"
              >
                <RotateCw size={14} />
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-0.5 px-0.5 sm:px-1 border-r border-slate-800 shrink-0">
          <button
            id="toolbar-select"
            onClick={() => onSelectTool('select')}
            className={`flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center rounded-xl transition-all shrink-0 ${
              currentTool === 'select'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
            title="Select & Move (V)"
          >
            <MousePointer2 size={15} />
          </button>

          <button
            id="toolbar-pan"
            onClick={() => onSelectTool('pan')}
            className={`flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center rounded-xl transition-all shrink-0 ${
              currentTool === 'pan'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
            title="Pan Canvas (H / Hold Space)"
          >
            <Hand size={15} />
          </button>
        </div>

        <div className="flex items-center px-0.5 shrink-0">
          <button
            id="toolbar-lasso-ai"
            onClick={() => onSelectTool('lasso')}
            className={`relative flex h-8 sm:h-9 items-center gap-1.5 px-2.5 sm:px-3 rounded-xl font-semibold text-xs whitespace-nowrap transition-all shrink-0 cursor-pointer ${
              currentTool === 'lasso'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md ring-1 ring-violet-400'
                : 'text-violet-300 hover:bg-violet-950/60 hover:text-white'
            }`}
            title="AI Lasso: Draw a crop box around equations or structures to analyze"
          >
            <Sparkles size={14} className="text-violet-400 shrink-0" />
            <span className="font-semibold text-xs whitespace-nowrap">AI Lasso</span>
          </button>
        </div>

        <div className="flex items-center gap-0.5 px-0.5 sm:px-1 border-r border-slate-800 shrink-0">
          <button
            id="toolbar-pen"
            onClick={() => onSelectTool('pen')}
            className={`flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center rounded-xl transition-all shrink-0 ${
              currentTool === 'pen'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
            title="Pen (P)"
          >
            <Pen size={15} />
          </button>

          <button
            id="toolbar-highlighter"
            onClick={() => onSelectTool('highlighter')}
            className={`flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center rounded-xl transition-all shrink-0 ${
              currentTool === 'highlighter'
                ? 'bg-amber-500/25 text-amber-300 ring-1 ring-amber-400/50'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
            title="Highlighter"
          >
            <Highlighter size={15} />
          </button>

          <button
            id="toolbar-eraser"
            onClick={() => onSelectTool('eraser')}
            className={`flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center rounded-xl transition-all shrink-0 ${
              currentTool === 'eraser'
                ? 'bg-rose-500/25 text-rose-300 ring-1 ring-rose-400/50'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
            title="Eraser (E)"
          >
            <Eraser size={15} />
          </button>
        </div>

        <div className="relative px-0.5 shrink-0" ref={connectorMenuRef}>
          <div className="flex items-center rounded-xl overflow-hidden">
            <button
              id="toolbar-line-tool"
              onClick={() => {
                onSelectTool('connector')
                setShowConnectorMenu(false)
                setShowShapeMenu(false)
                setShowColorMenu(false)
                setShowStrokeMenu(false)
              }}
              className={`flex h-8 sm:h-9 items-center justify-center px-1.5 sm:px-2 transition-all shrink-0 ${
                currentTool === 'connector'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
              title={`Line / Arrow Tool (${connectorKind})`}
            >
              <ActiveConnectorIcon size={15} />
            </button>
            <button
              id="toolbar-line-dropdown"
              onClick={() => {
                setShowConnectorMenu(c => !c)
                setShowShapeMenu(false)
                setShowColorMenu(false)
                setShowStrokeMenu(false)
              }}
              className={`flex h-8 sm:h-9 items-center justify-center px-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all shrink-0 border-l border-slate-800/60 ${
                currentTool === 'connector' ? 'bg-violet-700 text-white' : ''
              }`}
              title="Line options: Straight, Arrow, Double Arrow, Dashed"
            >
              <ChevronDown size={10} />
            </button>
          </div>

          {showConnectorMenu && (
            <div
              className="absolute top-full mt-2 left-0 sm:left-auto sm:right-0 z-50 flex flex-col gap-1 rounded-xl border border-slate-700 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-xl min-w-[170px] animate-in fade-in zoom-in-95"
              onPointerDown={e => e.stopPropagation()}
              onClick={e => e.stopPropagation()}
            >
              <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Line Type</span>
              <button
                id="connector-type-line"
                onClick={() => {
                  onChangeConnectorKind('line')
                  onSelectTool('connector')
                  setShowConnectorMenu(false)
                }}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-left transition-colors ${
                  connectorKind === 'line' ? 'bg-violet-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Minus size={14} /> Straight Line
              </button>
              <button
                id="connector-type-arrow"
                onClick={() => {
                  onChangeConnectorKind('arrow')
                  onSelectTool('connector')
                  setShowConnectorMenu(false)
                }}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-left transition-colors ${
                  connectorKind === 'arrow' ? 'bg-violet-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <ArrowRight size={14} /> Single Arrow
              </button>
              <button
                id="connector-type-double"
                onClick={() => {
                  onChangeConnectorKind('double')
                  onSelectTool('connector')
                  setShowConnectorMenu(false)
                }}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-left transition-colors ${
                  connectorKind === 'double' ? 'bg-violet-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <MoveHorizontal size={14} /> Double Arrow
              </button>

              <div className="my-1 h-[1px] bg-slate-800" />
              <div className="flex items-center justify-between px-2 py-1 text-xs">
                <span className="text-slate-400">Style:</span>
                <button
                  id="connector-toggle-style"
                  onClick={() => onToggleLineStyle()}
                  className="rounded px-2 py-0.5 font-semibold text-violet-400 bg-slate-800 hover:bg-slate-700 capitalize transition-colors"
                >
                  {lineStyle}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="relative px-0.5 shrink-0" ref={shapeMenuRef}>
          <div className="flex items-center rounded-xl overflow-hidden">
            <button
              id="toolbar-shape-tool"
              onClick={() => {
                onSelectTool('shape')
                setShowShapeMenu(false)
                setShowConnectorMenu(false)
                setShowColorMenu(false)
                setShowStrokeMenu(false)
              }}
              className={`flex h-8 sm:h-9 items-center justify-center px-1.5 sm:px-2 transition-all shrink-0 ${
                currentTool === 'shape'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
              title={`Shape Tool (${shapeKind})`}
            >
              <ActiveShapeIcon size={15} />
            </button>
            <button
              id="toolbar-shape-dropdown"
              onClick={() => {
                setShowShapeMenu(s => !s)
                setShowConnectorMenu(false)
                setShowColorMenu(false)
                setShowStrokeMenu(false)
              }}
              className={`flex h-8 sm:h-9 items-center justify-center px-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all shrink-0 border-l border-slate-800/60 ${
                currentTool === 'shape' ? 'bg-violet-700 text-white' : ''
              }`}
              title="Shape options: Rectangle, Circle, Triangle, Diamond"
            >
              <ChevronDown size={10} />
            </button>
          </div>

          {showShapeMenu && (
            <div
              className="absolute top-full mt-2 left-0 sm:left-auto sm:right-0 z-50 flex flex-col gap-1 rounded-xl border border-slate-700 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-xl min-w-[150px] animate-in fade-in zoom-in-95"
              onPointerDown={e => e.stopPropagation()}
              onClick={e => e.stopPropagation()}
            >
              <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Shapes</span>
              <button
                onClick={() => {
                  onChangeShapeKind('rectangle')
                  onSelectTool('shape')
                  setShowShapeMenu(false)
                }}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-left transition-colors ${
                  shapeKind === 'rectangle' ? 'bg-violet-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Square size={14} /> Rectangle
              </button>
              <button
                onClick={() => {
                  onChangeShapeKind('ellipse')
                  onSelectTool('shape')
                  setShowShapeMenu(false)
                }}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-left transition-colors ${
                  shapeKind === 'ellipse' ? 'bg-violet-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Circle size={14} /> Circle
              </button>
              <button
                onClick={() => {
                  onChangeShapeKind('triangle')
                  onSelectTool('shape')
                  setShowShapeMenu(false)
                }}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-left transition-colors ${
                  shapeKind === 'triangle' ? 'bg-violet-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Triangle size={14} /> Triangle
              </button>
              <button
                onClick={() => {
                  onChangeShapeKind('diamond')
                  onSelectTool('shape')
                  setShowShapeMenu(false)
                }}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-left transition-colors ${
                  shapeKind === 'diamond' ? 'bg-violet-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Diamond size={14} /> Diamond
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 border-t md:border-t-0 md:border-l border-slate-800/80 pt-1 md:pt-0 md:pl-1 w-full md:w-auto justify-center">
        <div className="relative px-0.5 shrink-0" ref={strokeMenuRef}>
          <button
            id="toolbar-stroke-menu"
            onClick={() => {
              setShowStrokeMenu(s => !s)
              setShowColorMenu(false)
              setShowShapeMenu(false)
              setShowConnectorMenu(false)
              setShowTextSizeMenu(false)
            }}
            className={`flex h-8 sm:h-9 items-center gap-1.5 px-2 rounded-xl text-xs font-medium transition-all shrink-0 ${
              showStrokeMenu
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            title={`Stroke width: ${brushSize}px`}
          >
            <div className="flex items-center gap-1">
              <Sliders size={13} className="text-slate-400" />
              <div
                className="rounded-full bg-slate-200"
                style={{
                  width: `${Math.max(3, Math.min(10, brushSize))}px`,
                  height: `${Math.max(3, Math.min(10, brushSize))}px`
                }}
              />
              <span className="font-mono text-[11px] font-semibold text-slate-200">{brushSize}px</span>
            </div>
            <ChevronDown size={10} className="opacity-70" />
          </button>

          {showStrokeMenu && (
            <div
              className="absolute top-full mt-2 left-0 sm:left-auto sm:right-0 z-50 flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-xl min-w-[210px] animate-in fade-in zoom-in-95"
              onPointerDown={e => e.stopPropagation()}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Stroke Thickness</span>
                <span className="font-mono text-xs font-bold text-violet-400">{brushSize}px</span>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {STROKE_PRESETS.map(preset => (
                  <button
                    key={preset.size}
                    id={`stroke-preset-${preset.size}`}
                    onClick={() => {
                      onChangeBrushSize(preset.size)
                      setShowStrokeMenu(false)
                    }}
                    className={`flex flex-col items-center gap-1 rounded-lg p-2 text-[10px] transition-all ${
                      brushSize === preset.size
                        ? 'bg-violet-600 text-white font-bold shadow'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div
                      className="rounded-full bg-current"
                      style={{
                        width: `${Math.max(3, Math.min(12, preset.size))}px`,
                        height: `${Math.max(3, Math.min(12, preset.size))}px`
                      }}
                    />
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-1.5 pt-1.5 border-t border-slate-800">
                <input
                  id="stroke-width-slider"
                  type="range"
                  min="1"
                  max="24"
                  value={brushSize}
                  onChange={e => onChangeBrushSize(Number(e.target.value))}
                  className="w-full accent-violet-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                  <span>1px</span>
                  <span>12px</span>
                  <span>24px</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="relative px-0.5 shrink-0" ref={colorMenuRef}>
          <button
            id="toolbar-color-menu"
            onClick={() => {
              setShowColorMenu(c => !c)
              setShowStrokeMenu(false)
              setShowShapeMenu(false)
              setShowConnectorMenu(false)
              setShowTextSizeMenu(false)
            }}
            className="flex h-8 sm:h-9 items-center gap-1.5 rounded-xl px-2 hover:bg-slate-800 transition-colors shrink-0"
            title="Color palette"
          >
            <div
              className="size-4 sm:size-5 rounded-full border border-white/50 shadow-sm shrink-0"
              style={{ backgroundColor: currentColor }}
            />
            <ChevronDown size={10} className="text-slate-400" />
          </button>

          {showColorMenu && (
            <div
              className="absolute top-full mt-2 left-0 sm:left-auto sm:right-0 z-50 flex flex-col gap-2.5 rounded-xl border border-slate-700 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-xl min-w-[210px] animate-in fade-in zoom-in-95"
              onPointerDown={e => e.stopPropagation()}
              onClick={e => e.stopPropagation()}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Color Palette</span>

              <div className="grid grid-cols-6 gap-2">
                {PALETTE.map(col => (
                  <button
                    key={col}
                    id={`color-preset-${col.replace('#', '')}`}
                    onClick={() => {
                      onChangeColor(col)
                      setShowColorMenu(false)
                    }}
                    className={`size-6 rounded-full border transition-transform ${
                      currentColor.toLowerCase() === col.toLowerCase()
                        ? 'scale-125 border-white ring-2 ring-violet-500 shadow-md'
                        : 'border-white/20 hover:scale-110'
                    }`}
                    style={{ backgroundColor: col }}
                    title={col}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <label htmlFor="custom-color-input" className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer hover:text-white">
                  <Pipette size={13} className="text-violet-400" />
                  <span>Custom Color</span>
                </label>
                <input
                  id="custom-color-input"
                  type="color"
                  value={currentColor}
                  onChange={e => onChangeColor(e.target.value)}
                  className="size-7 rounded cursor-pointer border-0 bg-transparent p-0"
                  title="Choose custom color"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-0.5 px-0.5 sm:px-1 border-l border-slate-800 shrink-0">
          <button
            id="toolbar-note"
            onClick={() => onSelectTool('note')}
            className={`flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center rounded-xl transition-all shrink-0 ${
              currentTool === 'note'
                ? 'bg-amber-500/25 text-amber-300 ring-1 ring-amber-400/50'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
            title="Add Sticky Note (N)"
          >
            <StickyNote size={15} />
          </button>

          <div className="relative px-0.5 shrink-0" ref={textSizeMenuRef}>
            <div className="flex items-center rounded-xl overflow-hidden">
              <button
                id="toolbar-text"
                onClick={() => {
                  onSelectTool('text')
                  setShowTextSizeMenu(false)
                  setShowShapeMenu(false)
                  setShowConnectorMenu(false)
                  setShowColorMenu(false)
                  setShowStrokeMenu(false)
                }}
                className={`flex h-8 sm:h-9 items-center justify-center px-1.5 sm:px-2 transition-all shrink-0 ${
                  currentTool === 'text'
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
                title={`Add Text Label (T) - Current Size: ${textSize}px`}
              >
                <Type size={15} />
              </button>
              <button
                id="toolbar-text-size-dropdown"
                onClick={() => {
                  setShowTextSizeMenu(s => !s)
                  setShowShapeMenu(false)
                  setShowConnectorMenu(false)
                  setShowColorMenu(false)
                  setShowStrokeMenu(false)
                }}
                className={`flex h-8 sm:h-9 items-center justify-center px-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all shrink-0 border-l border-slate-800/60 ${
                  currentTool === 'text' ? 'bg-violet-700 text-white' : ''
                }`}
                title={`Text Size Options (${textSize}px)`}
              >
                <ChevronDown size={10} />
              </button>
            </div>

            {showTextSizeMenu && (
              <div
                className="absolute top-full mt-2 left-0 sm:left-auto sm:right-0 z-50 flex flex-col gap-2.5 rounded-xl border border-slate-700 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-xl min-w-[210px] animate-in fade-in zoom-in-95"
                onPointerDown={e => e.stopPropagation()}
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Text Size</span>
                  <span className="font-mono text-xs font-bold text-violet-400">{textSize}px</span>
                </div>

                <div className="flex flex-col gap-1">
                  {TEXT_SIZE_PRESETS.map(preset => (
                    <button
                      key={preset.size}
                      id={`text-size-preset-${preset.size}`}
                      onClick={() => {
                        onChangeTextSize?.(preset.size)
                        setShowTextSizeMenu(false)
                      }}
                      className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 transition-all text-left cursor-pointer ${
                        textSize === preset.size
                          ? 'bg-violet-600 text-white font-semibold shadow'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-baseline gap-2">
                        <span style={{ fontSize: `${Math.min(22, preset.size)}px` }} className="font-bold leading-none select-none">
                          Aa
                        </span>
                        <span className="text-xs">{preset.label}</span>
                      </div>
                      <span className="font-mono text-[11px] opacity-75">{preset.size}px</span>
                    </button>
                  ))}
                </div>

                <div className="my-0.5 h-[1px] bg-slate-800" />

                <div className="space-y-1.5 pt-1 border-t border-slate-800">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Custom Size</span>
                    <span className="font-mono">{textSize}px</span>
                  </div>
                  <input
                    id="text-size-slider"
                    type="range"
                    min="12"
                    max="64"
                    step="2"
                    value={textSize}
                    onChange={e => onChangeTextSize?.(Number(e.target.value))}
                    className="w-full accent-violet-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                    <span>12px</span>
                    <span>32px</span>
                    <span>64px</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            id="import-notes-file-input"
            type="file"
            accept="image/*,.pdf,application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            id="toolbar-import-notes"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-8 sm:h-9 items-center gap-1.5 px-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-xs font-semibold text-slate-200 hover:text-white transition-colors shrink-0 whitespace-nowrap cursor-pointer"
            title="Import Notes: Upload PDF or image to render on canvas"
          >
            <FileUp size={14} className="text-violet-400 shrink-0" />
            <span className="text-xs font-medium whitespace-nowrap">Import Notes</span>
          </button>
        </div>

        <div className="flex items-center pl-0.5 border-l border-slate-800 shrink-0">
          <button
            id="toolbar-clear-canvas"
            onClick={onClearCanvas}
            className="flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors shrink-0"
            title="Clear Board Canvas"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
