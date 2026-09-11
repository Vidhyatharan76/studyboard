'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'
import { createClient } from '@/lib/supabase/client'
import {
  LogOut,
  Plus,
  Send,
  Sparkles,
  Users,
  X,
  FileText,
  FileUp,
  RotateCcw,
  Layers,
  Check,
  Atom,
  LineChart as ChartIcon,
  BookOpen,
  Eye,
  Maximize2,
  Pencil
} from 'lucide-react'
import { FloatingToolbar, ToolType, ShapeKind, ConnectorKind, LineStyle } from './floating-toolbar'
import { LassoActionMenu } from './lasso-action-menu'
import { MoleculeViewerModal, MoleculeData } from './molecule-viewer-modal'
import { GraphPlotterModal, MathPlotData } from './graph-plotter-modal'
import { NoteSummaryCard, NoteSummaryData } from './note-summary-card'
import { ExportStudyGuideButton } from './export-study-guide-button'

type Point = { x: number; y: number }
type Payload = {
  x: number
  y: number
  width?: number
  height?: number
  text?: string
  color?: string
  textColor?: string
  fontSize?: number
  isAiSolution?: boolean
  points?: Point[]
  clientId?: string
  opacity?: number
  strokeWidth?: number
  shape?: ShapeKind
  connector?: ConnectorKind
  lineStyle?: LineStyle
  start?: Point
  end?: Point
  imageUrl?: string
  fileData?: string
  fileName?: string
  fileType?: string
  isDocument?: boolean
  itemType?: string
  summaryData?: NoteSummaryData
}

function getContrastTextColor(hexColor?: string, explicitTextColor?: string): string {
  if (explicitTextColor) return explicitTextColor
  if (!hexColor) return '#090d16'
  const hex = hexColor.replace('#', '').trim()
  let r = 255, g = 255, b = 255
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16) || 0
    g = parseInt(hex[1] + hex[1], 16) || 0
    b = parseInt(hex[2] + hex[2], 16) || 0
  } else if (hex.length >= 6) {
    r = parseInt(hex.slice(0, 2), 16) || 0
    g = parseInt(hex.slice(2, 4), 16) || 0
    b = parseInt(hex.slice(4, 6), 16) || 0
  }
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b
  return luminance < 145 ? '#ffffff' : '#090d16'
}

function getCanvasTextColor(color?: string, explicitTextColor?: string): string {
  if (explicitTextColor) return explicitTextColor
  if (!color) return '#f8fafc'
  const hex = color.replace('#', '').trim()
  let r = 255, g = 255, b = 255
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16) || 0
    g = parseInt(hex[1] + hex[1], 16) || 0
    b = parseInt(hex[2] + hex[2], 16) || 0
  } else if (hex.length >= 6) {
    r = parseInt(hex.slice(0, 2), 16) || 0
    g = parseInt(hex.slice(2, 4), 16) || 0
    b = parseInt(hex.slice(4, 6), 16) || 0
  }
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b

  if (luminance < 75) return '#f8fafc'
  return color
}

type Item = {
  id: string
  board_id: string
  owner_id: string
  item_type: 'note' | 'stroke' | 'shape' | 'connector' | 'text' | 'document'
  payload: Payload
}

type Room = { id: string; name: string; owner_id: string }

const WORLD = { width: 2400, height: 1600 }
const COLORS = ['#f8fafc', '#fef08a', '#bae6fd', '#bbf7d0', '#fecdd3', '#c084fc', '#f97316']

export function Whiteboard() {
  const [client, setClient] = useState<ReturnType<typeof createClient> | null>(null)
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [error, setError] = useState('')

  const [rooms, setRooms] = useState<Room[]>([])
  const [room, setRoom] = useState<Room | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [roomName, setRoomName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [invite, setInvite] = useState('')
  const [showRooms, setShowRooms] = useState(false)

  const [tool, setTool] = useState<ToolType>('select')
  const [shapeKind, setShapeKind] = useState<ShapeKind>('rectangle')
  const [connectorKind, setConnectorKind] = useState<ConnectorKind>('line')
  const [lineStyle, setLineStyle] = useState<LineStyle>('solid')
  const [brushSize, setBrushSize] = useState(4)
  const [color, setColor] = useState(COLORS[0])
  const [textSize, setTextSize] = useState(18)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 })
  const [selected, setSelected] = useState<string | null>(null)
  const selectedRef = useRef<string | null>(null)
  useEffect(() => {
    selectedRef.current = selected
  }, [selected])

  useEffect(() => {
    if (selected) {
      const it = items.find(x => x.id === selected)
      if (it?.payload?.fontSize) {
        setTextSize(it.payload.fontSize)
      }
    }
  }, [selected, items])

  const handleUpdateTextSize = (size: number) => {
    setTextSize(size)
    if (selected) {
      const it = items.find(x => x.id === selected)
      if (it && (it.item_type === 'text' || it.item_type === 'note')) {
        void update(it.id, { ...it.payload, fontSize: size })
      }
    }
  }
  const [saving, setSaving] = useState(false)
  const [syncError, setSyncError] = useState('')
  const [onlineUsers, setOnlineUsers] = useState(1)

  const [livePoints, setLivePoints] = useState<Point[]>([])
  const [liveShape, setLiveShape] = useState<{ start: Point; end: Point } | null>(null)
  const [textDraft, setTextDraft] = useState<{ x: number; y: number } | null>(null)
  const [textValue, setTextValue] = useState('')

  const [lassoStart, setLassoStart] = useState<Point | null>(null)
  const [lassoRect, setLassoRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [activeLassoMenu, setActiveLassoMenu] = useState<{
    rect: { x: number; y: number; width: number; height: number }
    screenPos: { x: number; y: number }
  } | null>(null)

  const [moleculeModalOpen, setMoleculeModalOpen] = useState(false)
  const [moleculeLoading, setMoleculeLoading] = useState(false)
  const [moleculeError, setMoleculeError] = useState<string | null>(null)
  const [moleculeData, setMoleculeData] = useState<MoleculeData | null>(null)

  const [graphModalOpen, setGraphModalOpen] = useState(false)
  const [graphLoading, setGraphLoading] = useState(false)
  const [graphError, setGraphError] = useState<string | null>(null)
  const [graphData, setGraphData] = useState<MathPlotData | null>(null)

  const [aiTutorOpen, setAiTutorOpen] = useState(false)
  const [aiTutorLoading, setAiTutorLoading] = useState(false)
  const [aiTutorError, setAiTutorError] = useState('')
  const [aiTutorResult, setAiTutorResult] = useState<{
    parsedEquation: string
    contentType?: string
    steps: string[]
    coreConcept: string
  } | null>(null)
  const [lastCropSelection, setLastCropSelection] = useState<{ x: number; y: number; width: number; height: number } | null>(null)

  const [summarizingDocId, setSummarizingDocId] = useState<string | null>(null)

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingNoteText, setEditingNoteText] = useState('')
  const noteTextareaRef = useRef<HTMLTextAreaElement>(null)
  const lastNoteClickRef = useRef<{ id: string; time: number }>({ id: '', time: 0 })

  const resizingRef = useRef<{ id: string; startWidth: number; startHeight: number; startX: number; startY: number } | null>(null)

  const [history, setHistory] = useState<Item[][]>([])
  const [redoStack, setRedoStack] = useState<Item[][]>([])

  const channelRef = useRef<any>(null)
  const surfaceRef = useRef<HTMLDivElement>(null)
  const drawingRef = useRef(false)
  const pointsRef = useRef<Point[]>([])
  const startRef = useRef<Point | null>(null)
  const liveShapeRef = useRef<{ start: Point; end: Point } | null>(null)
  const dragRef = useRef<{
    id: string
    dx?: number
    dy?: number
    payload?: Payload
    connectorStart?: Point
    connectorEnd?: Point
    downPoint?: Point
  } | null>(null)
  const isSpaceDown = useRef(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        isSpaceDown.current = true
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) handleRedo()
        else handleUndo()
      }
      if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)
      ) {
        if (selectedRef.current) {
          e.preventDefault()
          const idToDelete = selectedRef.current
          setSelected(null)
          void remove(idToDelete)
        }
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') isSpaceDown.current = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [history, redoStack])

  const worldPoint = (e: React.PointerEvent | React.MouseEvent) => {
    const r = surfaceRef.current!.getBoundingClientRect()
    return {
      x: (e.clientX - r.left - r.width / 2 - pan.x) / zoom + WORLD.width / 2,
      y: (e.clientY - r.top - r.height / 2 - pan.y) / zoom + WORLD.height / 2
    }
  }

  const renderPath = (points: Point[]) => points.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ')

  const renderArrowHead = (from: Point, to: Point, color: string, strokeWidth: number) => {
    const angle = Math.atan2(to.y - from.y, to.x - from.x)
    const headLength = Math.max(12, strokeWidth * 2.8)
    const angleOffset = Math.PI / 6
    const p1 = {
      x: to.x - headLength * Math.cos(angle - angleOffset),
      y: to.y - headLength * Math.sin(angle - angleOffset)
    }
    const p2 = {
      x: to.x - headLength * Math.cos(angle + angleOffset),
      y: to.y - headLength * Math.sin(angle + angleOffset)
    }
    return (
      <polygon
        points={`${to.x},${to.y} ${p1.x},${p1.y} ${p2.x},${p2.y}`}
        fill={color}
      />
    )
  }

  useEffect(() => {
    const c = createClient()
    setClient(c)
    const params = new URLSearchParams(location.search)
    const token = params.get('invite')
    if (token) setJoinCode(token)

    c.auth.getUser().then(({ data }: any) => {
      setUser(data?.user ? { id: data.user.id, email: data.user.email } : null)
    })

    const { data } = c.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email } : null)
    })

    return () => data.subscription.unsubscribe()
  }, [])

  const loadRooms = useCallback(async () => {
    if (!client || !user) return
    const { data } = await client.from('boards').select('id,name,owner_id').order('created_at')
    const owned = (data ?? []) as Room[]
    const { data: memberships } = await client.from('board_members').select('board_id').eq('user_id', user.id)
    const ids = new Set(owned.map(r => r.id))
    const joined = await Promise.all(
      (memberships ?? [])
        .filter((m: any) => !ids.has(m.board_id))
        .map(async (m: any) => (await client.from('boards').select('id,name,owner_id').eq('id', m.board_id).single()).data)
    )
    setRooms([...owned, ...(joined.filter(Boolean) as Room[])])
  }, [client, user])

  useEffect(() => {
    loadRooms()
  }, [loadRooms])

  const openRoom = useCallback(async (next: Room) => {
    if (!client) return
    setRoom(next)
    setItems([])
    setHistory([])
    setRedoStack([])
    setSyncError('')
    const { data, error: loadError } = await client
      .from('board_items')
      .select('id,board_id,owner_id,item_type,payload')
      .eq('board_id', next.id)
      .order('created_at')
    if (loadError) setSyncError('You are not a member of this room. Join it with an invite first.')
    const mapped = ((data ?? []) as any[]).map(i => {
      if (i.payload?.isDocument || i.payload?.itemType === 'document') {
        return { ...i, item_type: 'document' }
      }
      return i
    })
    setItems(mapped as Item[])
    setShowRooms(false)
  }, [client])

  useEffect(() => {
    if (!client || !room || !user) return
    const channel = client.channel(`room-${room.id}`, { config: { presence: { key: user.id } } })
      .on('broadcast', { event: 'item' }, ({ payload }: any) => {
        const next = payload as Item
        if (next.owner_id === user.id) return
        setItems(current => {
          const match = current.find(i => i.id === next.id || (next.payload?.clientId && i.payload?.clientId === next.payload.clientId))
          return match ? current.map(i => i.id === match.id ? next : i) : [...current, next]
        })
      })
      .on('broadcast', { event: 'remove' }, ({ payload }: any) => {
        setItems(current => current.filter(i => i.id !== (payload as { id: string }).id))
      })
      .on('broadcast', { event: 'clear' }, () => setItems([]))
      .on('presence', { event: 'sync' }, () => setOnlineUsers(Object.keys(channel.presenceState()).length))
      .on('presence', { event: 'join' }, () => setOnlineUsers(Object.keys(channel.presenceState()).length + 1))
      .on('presence', { event: 'leave' }, () => setOnlineUsers(Math.max(1, Object.keys(channel.presenceState()).length - 1)))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'board_items', filter: `board_id=eq.${room.id}` }, ({ eventType, new: next, old }: any) => {
        setItems(current => {
          if (eventType === 'INSERT') return current.some(i => i.id === (next as Item).id) ? current : [...current, next as Item]
          if (eventType === 'UPDATE') return current.map(i => i.id === (next as Item).id ? next as Item : i)
          return current.filter(i => i.id !== (old as Item).id)
        })
      })
      .subscribe(async (status: any) => {
        if (status === 'SUBSCRIBED') {
          channelRef.current = channel
          setSyncError('')
          await channel.track({ userId: user.id, email: user.email, tool })
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setSyncError('Realtime sync is retrying…')
        }
      })

    return () => {
      channelRef.current = null
      void channel.untrack()
      client.removeChannel(channel)
      setOnlineUsers(1)
    }
  }, [client, room, user, tool, openRoom])

  const insert = async (item: Omit<Item, 'id' | 'board_id' | 'owner_id'>) => {
    if (!client || !user || !room) return
    setHistory(h => [...h.slice(-20), items])
    setRedoStack([])

    const pending = {
      ...item,
      id: `pending-${crypto.randomUUID()}`,
      board_id: room.id,
      owner_id: user.id
    } as Item

    setItems(c => [...c, pending])
    setSaving(true)

    const isLargePayload = (pending.payload?.fileData?.length ?? 0) > 100000
    const broadcastPayload = {
      ...pending,
      payload: {
        ...pending.payload,
        clientId: pending.id,

        fileData: isLargePayload ? undefined : pending.payload.fileData
      }
    }

    try {
      await channelRef.current?.send({ type: 'broadcast', event: 'item', payload: broadcastPayload })
    } catch (wsErr) {
      console.warn('Realtime broadcast warning:', wsErr)
    }

    try {

      const dbItemType = (item.item_type === 'document' ? 'note' : item.item_type) as any
      const dbPayload = isLargePayload
        ? { ...broadcastPayload.payload, fileData: undefined }
        : broadcastPayload.payload

      const { data, error: saveError } = await client
        .from('board_items')
        .insert({
          board_id: room.id,
          owner_id: user.id,
          item_type: dbItemType,
          payload: dbPayload
        })
        .select('id,board_id,owner_id,item_type,payload')
        .single()

      if (saveError) {
        console.warn('Cloud database sync warning:', saveError.message)

        setSyncError(`Offline/Local canvas active`)
      }
      if (data) {
        const saved: Item = {
          ...(data as Item),
          item_type: item.item_type,
          payload: {
            ...pending.payload,
            ...((data as Item).payload || {})
          }
        }
        setItems(c => c.map(i => (i.id === pending.id ? saved : i)))
        try {
          await channelRef.current?.send({ type: 'broadcast', event: 'item', payload: saved })
        } catch {

        }
      }
    } catch (err: any) {
      console.warn('Insert handler error:', err)

    } finally {
      setSaving(false)
    }
  }

  const update = async (id: string, payload: Payload) => {
    const previous = items.find(i => i.id === id)
    setItems(c => c.map(i => (i.id === id ? { ...i, payload } : i)))
    if (!id.startsWith('pending-')) {
      const result = await client?.from('board_items').update({ payload }).eq('id', id)
      if (result?.error) {
        setItems(c => (previous ? c.map(i => (i.id === id ? previous : i)) : c))
        setSyncError(`Could not update: ${result.error.message}`)
      } else {
        await channelRef.current?.send({ type: 'broadcast', event: 'item', payload: { ...previous, payload } })
      }
    }
  }

  const remove = async (id: string) => {
    const removed = items.find(i => i.id === id)
    setHistory(h => [...h.slice(-20), items])
    setItems(c => c.filter(i => i.id !== id))
    if (!id.startsWith('pending-')) {
      const result = await client?.from('board_items').delete().eq('id', id)
      if (result?.error) {
        if (removed) setItems(c => (c.some(i => i.id === id) ? c : [...c, removed]))
        setSyncError(`Could not delete: ${result.error.message}`)
      } else {
        await channelRef.current?.send({ type: 'broadcast', event: 'remove', payload: { id } })
      }
    }
  }

  const handleUndo = () => {
    if (!history.length) return
    const prev = history[history.length - 1]
    setRedoStack(r => [...r, items])
    setHistory(h => h.slice(0, -1))
    setItems(prev)
  }

  const handleRedo = () => {
    if (!redoStack.length) return
    const next = redoStack[redoStack.length - 1]
    setHistory(h => [...h, items])
    setRedoStack(r => r.slice(0, -1))
    setItems(next)
  }

  const hitTest = (p: Point) => {
    return [...items].reverse().find(i => {
      const q = i.payload
      if (i.item_type === 'stroke') {
        return q.points?.some(a => Math.hypot(a.x - p.x, a.y - p.y) < Math.max(30, 36 / zoom))
      }
      if (i.item_type === 'connector' && q.start && q.end) {
        const l2 = (q.end.x - q.start.x) ** 2 + (q.end.y - q.start.y) ** 2
        if (l2 === 0) return Math.hypot(p.x - q.start.x, p.y - q.start.y) < 20
        const t = Math.max(0, Math.min(1, ((p.x - q.start.x) * (q.end.x - q.start.x) + (p.y - q.start.y) * (q.end.y - q.start.y)) / l2))
        const projX = q.start.x + t * (q.end.x - q.start.x)
        const projY = q.start.y + t * (q.end.y - q.start.y)
        return Math.hypot(p.x - projX, p.y - projY) < Math.max(16, 22 / zoom)
      }
      const w = q.width ?? (i.item_type === 'note' ? 220 : i.item_type === 'document' ? 380 : 180)
      const h = q.height ?? (i.item_type === 'note' ? 120 : i.item_type === 'document' ? 260 : 60)
      return p.x >= q.x - 10 && p.x <= q.x + w + 10 && p.y >= q.y - 10 && p.y <= q.y + h + 10
    })
  }

  const down = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('button, input, textarea, a, select, [data-interactive="true"]')) {
      return
    }

    const p = worldPoint(e)

    if (tool === 'pan' || isSpaceDown.current || e.button === 1) {
      e.currentTarget.setPointerCapture?.(e.pointerId)
      startRef.current = { x: e.clientX, y: e.clientY }
      return
    }

    if (tool === 'lasso') {
      e.currentTarget.setPointerCapture?.(e.pointerId)
      setActiveLassoMenu(null)
      setLassoStart(p)
      setLassoRect({ x: p.x, y: p.y, width: 0, height: 0 })
      return
    }

    if (tool === 'select') {
      const hit = hitTest(p)
      setSelected(hit?.id ?? null)
      if (hit) {
        if (!target.closest('.note-editable-area, .document-interactive')) {
          e.currentTarget.setPointerCapture?.(e.pointerId)
        }
        if (hit.item_type === 'connector' && hit.payload.start && hit.payload.end) {
          dragRef.current = {
            id: hit.id,
            connectorStart: { ...hit.payload.start },
            connectorEnd: { ...hit.payload.end },
            downPoint: p
          }
        } else {
          dragRef.current = { id: hit.id, dx: p.x - (hit.payload.x ?? 0), dy: p.y - (hit.payload.y ?? 0) }
        }
      }
      return
    }

    e.currentTarget.setPointerCapture?.(e.pointerId)

    if (tool === 'eraser') {
      const hit = hitTest(p)
      if (hit) remove(hit.id)
      return
    }

    if (tool === 'pen' || tool === 'highlighter') {
      drawingRef.current = true
      pointsRef.current = [p]
      setLivePoints([p])
      return
    }

    if (tool === 'shape' || tool === 'connector') {
      drawingRef.current = true
      startRef.current = p
      liveShapeRef.current = { start: p, end: p }
      setLiveShape({ start: p, end: p })
      return
    }

    if (tool === 'note') {
      insert({
        item_type: 'note',
        payload: {
          x: p.x - 100,
          y: p.y - 50,
          width: 220,
          height: 140,
          text: 'Double click to edit note',
          color
        }
      })
      setTool('select')
      return
    }

    if (tool === 'text') {
      setTextDraft(p)
      setTextValue('')
      setTool('select')
      return
    }
  }

  const move = (e: React.PointerEvent) => {
    const p = worldPoint(e)

    if ((tool === 'pan' || isSpaceDown.current || e.buttons === 4) && startRef.current) {
      const dx = e.clientX - startRef.current.x
      const dy = e.clientY - startRef.current.y
      startRef.current = { x: e.clientX, y: e.clientY }
      setPan(curr => ({ x: curr.x + dx, y: curr.y + dy }))
      return
    }

    if (tool === 'lasso' && lassoStart) {
      setLassoRect({
        x: Math.min(lassoStart.x, p.x),
        y: Math.min(lassoStart.y, p.y),
        width: Math.abs(p.x - lassoStart.x),
        height: Math.abs(p.y - lassoStart.y)
      })
      return
    }

    if (dragRef.current) {
      const i = items.find(x => x.id === dragRef.current?.id)
      if (i) {
        let nextPayload = { ...i.payload }
        if (i.item_type === 'connector' && dragRef.current.connectorStart && dragRef.current.connectorEnd && dragRef.current.downPoint) {
          const dx = p.x - dragRef.current.downPoint.x
          const dy = p.y - dragRef.current.downPoint.y
          nextPayload = {
            ...nextPayload,
            start: { x: dragRef.current.connectorStart.x + dx, y: dragRef.current.connectorStart.y + dy },
            end: { x: dragRef.current.connectorEnd.x + dx, y: dragRef.current.connectorEnd.y + dy }
          }
        } else if (dragRef.current.dx !== undefined && dragRef.current.dy !== undefined) {
          nextPayload = { ...nextPayload, x: p.x - dragRef.current.dx, y: p.y - dragRef.current.dy }
        }
        setItems(c => c.map(item => (item.id === i.id ? { ...item, payload: nextPayload } : item)))
        dragRef.current.payload = nextPayload
      }
      return
    }

    if (resizingRef.current) {
      const r = resizingRef.current
      const item = items.find(x => x.id === r.id)
      if (item) {
        const dx = p.x - r.startX
        const dy = p.y - r.startY
        const nextWidth = Math.max(200, r.startWidth + dx)
        const nextHeight = Math.max(160, r.startHeight + dy)
        const nextPayload = { ...item.payload, width: nextWidth, height: nextHeight }
        setItems(c => c.map(x => (x.id === item.id ? { ...x, payload: nextPayload } : x)))
      }
      return
    }

    if (drawingRef.current && (tool === 'pen' || tool === 'highlighter')) {
      pointsRef.current.push(p)
      setLivePoints([...pointsRef.current])
      return
    }

    if (drawingRef.current && (tool === 'shape' || tool === 'connector') && startRef.current) {
      liveShapeRef.current = { start: startRef.current, end: p }
      setLiveShape({ start: startRef.current, end: p })
      return
    }
  }

  const up = (e?: React.PointerEvent) => {
    if (e) e.currentTarget.releasePointerCapture?.(e.pointerId)

    if (tool === 'lasso') {
      const selection = lassoRect
      setLassoStart(null)

      if (selection && selection.width > 16 && selection.height > 16) {
        setLastCropSelection(selection)
        const r = surfaceRef.current?.getBoundingClientRect()
        if (r) {
          const screenX = (selection.x + selection.width / 2 - WORLD.width / 2) * zoom + pan.x + r.left + r.width / 2
          const screenY = (selection.y + selection.height - WORLD.height / 2) * zoom + pan.y + r.top + r.height / 2 + 12
          setActiveLassoMenu({ rect: selection, screenPos: { x: screenX, y: screenY } })
        }
      } else {
        setActiveLassoMenu(null)
        setLassoRect(null)
      }
      return
    }

    const points = [...pointsRef.current]
    const shape = liveShapeRef.current || liveShape
    liveShapeRef.current = null
    const drag = dragRef.current
    const resizing = resizingRef.current

    if (drag?.payload) void update(drag.id, drag.payload)
    if (resizing) {
      const item = items.find(x => x.id === resizing.id)
      if (item) void update(item.id, item.payload)
    }

    drawingRef.current = false
    pointsRef.current = []
    startRef.current = null
    dragRef.current = null
    resizingRef.current = null
    setLivePoints([])
    setLiveShape(null)

    if ((tool === 'pen' || tool === 'highlighter') && points.length > 1) {
      insert({
        item_type: 'stroke',
        payload: {
          x: 0,
          y: 0,
          points,
          color: tool === 'highlighter' ? (color === '#f8fafc' ? '#fef08a' : color) : color,
          strokeWidth: tool === 'highlighter' ? Math.max(22, brushSize * 4) : brushSize,
          opacity: tool === 'highlighter' ? 0.35 : 1
        }
      })
    }

    if (tool === 'shape' && shape) {
      const w = Math.abs(shape.end.x - shape.start.x)
      const h = Math.abs(shape.end.y - shape.start.y)
      if (w >= 3 || h >= 3) {
        insert({
          item_type: 'shape',
          payload: {
            x: Math.min(shape.start.x, shape.end.x),
            y: Math.min(shape.start.y, shape.end.y),
            width: Math.max(12, w),
            height: Math.max(12, h),
            color,
            shape: shapeKind,
            strokeWidth: brushSize
          }
        })
      }
    }

    if (tool === 'connector' && shape) {
      const dist = Math.hypot(shape.end.x - shape.start.x, shape.end.y - shape.start.y)
      if (dist >= 3) {
        insert({
          item_type: 'connector',
          payload: {
            x: 0,
            y: 0,
            start: shape.start,
            end: shape.end,
            color,
            connector: connectorKind,
            lineStyle,
            strokeWidth: brushSize
          }
        })
      }
    }
  }

  const captureCroppedArea = async (crop: { x: number; y: number; width: number; height: number }): Promise<string> => {
    const canvas = document.createElement('canvas')
    const scale = 2
    canvas.width = Math.max(20, Math.round(crop.width * scale))
    canvas.height = Math.max(20, Math.round(crop.height * scale))
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D unavailable')

    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.save()
    ctx.scale(scale, scale)
    ctx.translate(-crop.x, -crop.y)

    items.forEach(item => {
      if (item.item_type === 'stroke' && item.payload.points && item.payload.points.length > 1) {
        const points = item.payload.points
        const inside = points.some(p => p.x >= crop.x - 50 && p.x <= crop.x + crop.width + 50 && p.y >= crop.y - 50 && p.y <= crop.y + crop.height + 50)
        if (inside) {
          ctx.beginPath()
          ctx.strokeStyle = item.payload.color || '#ffffff'
          ctx.lineWidth = item.payload.strokeWidth || 4
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          ctx.globalAlpha = item.payload.opacity ?? 1
          points.forEach((p, idx) => {
            if (idx === 0) ctx.moveTo(p.x, p.y)
            else ctx.lineTo(p.x, p.y)
          })
          ctx.stroke()
          ctx.globalAlpha = 1
        }
      }

      if (item.item_type === 'shape') {
        const { x = 0, y = 0, width = 100, height = 80, shape = 'rectangle', color = '#ffffff', strokeWidth = 3 } = item.payload
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
        const { start, end, color = '#ffffff', strokeWidth = 3 } = item.payload
        ctx.beginPath()
        ctx.strokeStyle = color
        ctx.lineWidth = strokeWidth
        ctx.moveTo(start.x, start.y)
        ctx.lineTo(end.x, end.y)
        ctx.stroke()
      }

      if (item.item_type === 'text' && item.payload.text) {
        const itemFSize = item.payload.fontSize || 18
        ctx.fillStyle = item.payload.color || '#ffffff'
        ctx.font = `${itemFSize}px sans-serif`
        const lines = item.payload.text.split('\n')
        lines.forEach((line, idx) => {
          ctx.fillText(line, item.payload.x, item.payload.y + itemFSize + idx * (itemFSize * 1.25))
        })
      }
    })

    ctx.restore()
    return canvas.toDataURL('image/png')
  }

  const triggerRenderMolecule = async () => {
    const crop = activeLassoMenu?.rect || lastCropSelection
    setActiveLassoMenu(null)
    setLassoRect(null)
    setTool('select')

    if (!crop) return

    setMoleculeModalOpen(true)
    setMoleculeLoading(true)
    setMoleculeError(null)

    try {
      const base64Image = await captureCroppedArea(crop)
      const res = await fetch('/api/parse-chem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image })
      })
      const result = await res.json()

      if (!res.ok) {
        const errorMsg = result.error || 'No valid chemical formula detected in crop'
        setMoleculeError(errorMsg)
        void Swal.fire({
          icon: 'info',
          title: 'Chemical Formula Detection',
          text: errorMsg,
          customClass: { popup: 'studyboard-swal' }
        })
        return
      }

      setMoleculeData(result)
    } catch (err: any) {
      setMoleculeError(err.message || 'Failed to analyze chemical structure')
    } finally {
      setMoleculeLoading(false)
    }
  }

  const triggerPlotGraph = async () => {
    const crop = activeLassoMenu?.rect || lastCropSelection
    setActiveLassoMenu(null)
    setLassoRect(null)
    setTool('select')

    if (!crop) return

    setGraphModalOpen(true)
    setGraphLoading(true)
    setGraphError(null)

    try {
      const base64Image = await captureCroppedArea(crop)
      const res = await fetch('/api/parse-math', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image })
      })
      const result = await res.json()

      if (!res.ok) {
        const errorMsg = result.error || 'No valid quadratic or mathematical expression detected in crop'
        setGraphError(errorMsg)
        void Swal.fire({
          icon: 'info',
          title: 'Math Expression Detection',
          text: errorMsg,
          customClass: { popup: 'studyboard-swal' }
        })
        return
      }

      setGraphData(result)
    } catch (err: any) {
      setGraphError(err.message || 'Failed to plot graph from expression')
    } finally {
      setGraphLoading(false)
    }
  }

  const triggerAiExplain = async () => {
    const crop = activeLassoMenu?.rect || lastCropSelection
    setActiveLassoMenu(null)
    setLassoRect(null)
    setTool('select')

    if (!crop) return

    setAiTutorOpen(true)
    setAiTutorLoading(true)
    setAiTutorError('')

    try {
      const base64Image = await captureCroppedArea(crop)
      const res = await fetch('/api/ai-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image })
      })
      const result = await res.json()

      if (!res.ok) throw new Error(result.error || 'AI Assistant analysis failed')
      setAiTutorResult(result)
    } catch (err: any) {
      setAiTutorError(err.message || 'Analysis failed')
    } finally {
      setAiTutorLoading(false)
    }
  }

  const handleImportFile = async (file: File) => {
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf')
    const localBlobUrl = URL.createObjectURL(file)

    const rawSpawnX = Math.round((-pan.x) / zoom + WORLD.width / 2 - 200)
    const rawSpawnY = Math.round((-pan.y) / zoom + WORLD.height / 2 - 170)
    const spawnX = Math.max(40, Math.min(WORLD.width - 440, rawSpawnX))
    const spawnY = Math.max(40, Math.min(WORLD.height - 380, rawSpawnY))

    const uploadPromise = (async (): Promise<string> => {
      try {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/files', {
          method: 'POST',
          body: formData
        })
        if (res.ok) {
          const json = await res.json()
          if (json.url) return json.url as string
        }
      } catch (err) {
        console.warn('File upload to /api/files failed:', err)
      }
      return ''
    })()

    let compressedDataUrl = ''
    if (!isPdf) {
      compressedDataUrl = await new Promise<string>((resolve) => {
        const img = new window.Image()
        img.onload = () => {
          const maxDim = 1280
          let w = img.width
          let h = img.height
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w)
              w = maxDim
            } else {
              w = Math.round((w * maxDim) / h)
              h = maxDim
            }
          }
          const canvas = document.createElement('canvas')
          canvas.width = w
          canvas.height = h
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h)
            resolve(canvas.toDataURL('image/jpeg', 0.85))
          } else {
            resolve('')
          }
        }
        img.onerror = () => resolve('')
        img.src = localBlobUrl
      })
    }

    const serverUrl = await uploadPromise
    const sharedUrl = serverUrl || compressedDataUrl || localBlobUrl

    insert({
      item_type: 'document',
      payload: {
        x: spawnX,
        y: spawnY,
        width: 400,
        height: 340,
        text: file.name,
        color: '#1e293b',
        imageUrl: sharedUrl,
        fileData: compressedDataUrl,
        fileName: file.name,
        fileType: isPdf ? 'pdf' : 'image',
        isDocument: true
      }
    })

    void Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: `Imported "${file.name}"`,
      text: serverUrl ? 'Synced across all screens & devices.' : 'Document placed on whiteboard canvas.',
      timer: 2500,
      showConfirmButton: false,
      customClass: { popup: 'studyboard-swal' }
    })
  }

  const resolveBase64FromDocument = async (doc: Payload): Promise<string> => {
    if (doc.fileData && doc.fileData.includes('base64,')) {
      return doc.fileData
    }
    if (doc.imageUrl && doc.imageUrl.startsWith('data:')) {
      return doc.imageUrl
    }
    if (doc.imageUrl) {
      try {
        const res = await fetch(doc.imageUrl)
        const blob = await res.blob()
        return await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = () => resolve('')
          reader.readAsDataURL(blob)
        })
      } catch (e) {
        console.warn('Could not read image URL as base64:', e)
      }
    }
    return ''
  }

  const handleSummarizeDocument = async (item: Item) => {
    const doc = item.payload
    setSummarizingDocId(item.id)

    try {
      const base64Data = await resolveBase64FromDocument(doc)
      const res = await fetch('/api/summarize-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Data || doc.fileData || doc.imageUrl,
          text: doc.fileName || doc.text,
          fileName: doc.fileName
        })
      })

      const result: NoteSummaryData = await res.json()
      if (!res.ok) throw new Error((result as any).error || 'Failed to summarize document.')

      await update(item.id, {
        ...item.payload,
        summaryData: result
      })

      insert({
        item_type: 'note',
        payload: {
          x: item.payload.x + (item.payload.width ?? 380) + 20,
          y: item.payload.y,
          width: 320,
          height: 260,
          color: '#0f172a',
          summaryData: result,
          text: `[${result.detectedSubject} Takeaways]\n` + result.summary.map(s => `• ${s}`).join('\n')
        }
      })

      void Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Document Summarized',
        text: `Key concepts extracted from "${doc.fileName || 'Document'}".`,
        timer: 3000,
        showConfirmButton: false,
        customClass: { popup: 'studyboard-swal' }
      })
    } catch (err: any) {
      void Swal.fire({
        icon: 'error',
        title: 'Summarization Error',
        text: err.message,
        customClass: { popup: 'studyboard-swal' }
      })
    } finally {
      setSummarizingDocId(null)
    }
  }

  const clear = async () => {
    if (!client || !room || !items.length) return
    const confirmed = await Swal.fire({
      title: 'Clear entire whiteboard?',
      text: 'This will remove all drawings, notes, and imported documents for all collaborators.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, clear board',
      cancelButtonText: 'Cancel',
      customClass: { popup: 'studyboard-swal' }
    })
    if (!confirmed.isConfirmed) return

    const prev = items
    setHistory(h => [...h.slice(-20), items])
    setItems([])
    const res = await client.from('board_items').delete().eq('board_id', room.id)
    if (res.error) {
      setItems(prev)
      setSyncError(`Could not clear room: ${res.error.message}`)
      return
    }
    await channelRef.current?.send({ type: 'broadcast', event: 'clear', payload: { roomId: room.id } })
  }

  const createRoom = async () => {
    if (!roomName.trim()) {
      setSyncError('Enter a room name first.')
      return
    }
    if (!client || !user) {
      setSyncError('Session loading…')
      return
    }
    const { data, error: roomErr } = await client
      .from('boards')
      .insert({ owner_id: user.id, name: roomName.trim() })
      .select('id,name,owner_id')
      .single()
    if (roomErr || !data) {
      setSyncError(roomErr?.message ?? 'Could not create room.')
      return
    }
    setRoomName('')
    await loadRooms()
    openRoom(data as Room)
  }

  const makeInvite = async () => {
    if (!client || !user || !room) return
    const token = crypto.randomUUID().replaceAll('-', '')
    const { data } = await client.from('board_invites').insert({ board_id: room.id, token, created_by: user.id }).select('token').single()
    if (data) {
      const url = `${location.origin}?room=${room.id}&invite=${data.token}`
      setInvite(url)
      await navigator.clipboard?.writeText(url)
      void Swal.fire({
        icon: 'success',
        title: 'Invite Link Copied!',
        text: url,
        timer: 2500,
        showConfirmButton: false,
        customClass: { popup: 'studyboard-swal' }
      })
    }
  }

  const joinRoom = async () => {
    if (!client || !user || !joinCode.trim()) return
    const raw = joinCode.trim()
    let token = raw
    try {
      token = raw.includes('invite=') ? new URL(raw).searchParams.get('invite') ?? raw : raw
    } catch {
      token = raw
    }
    const { data, error: joinError } = await client.rpc('accept_board_invite', { invite_token: token })
    if (joinError || !data) {
      setError('Room code is invalid or expired.')
      return
    }
    setError('')
    await loadRooms()
    const { data: next } = await client.from('boards').select('id,name,owner_id').eq('id', data).single()
    if (next) openRoom(next as Room)
    setJoinCode('')
  }

  const auth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!client) return
    const result =
      authMode === 'signin'
        ? await client.auth.signInWithPassword({ email, password })
        : await client.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${location.origin}/auth/callback` }
          })
    if (result.error) setError(authMode === 'signin' ? 'Invalid email or password.' : 'Check your credentials or confirm email.')
  }

  const startEditingNote = (item: Item) => {
    setEditingNoteId(item.id)
    setEditingNoteText(item.payload.text || '')
    setTimeout(() => {
      noteTextareaRef.current?.focus()
      noteTextareaRef.current?.select()
    }, 50)
  }

  const finishEditingNote = async () => {
    if (!editingNoteId) return
    const idToSave = editingNoteId
    const currentText = editingNoteText.trim()
    setEditingNoteId(null)
    setEditingNoteText('')

    const itemToUpdate = items.find(it => it.id === idToSave)
    if (itemToUpdate) {
      const fallback = itemToUpdate.item_type === 'note' ? 'Sticky Note' : 'Text'
      const finalVal = currentText || fallback
      await update(itemToUpdate.id, { ...itemToUpdate.payload, text: finalVal })
    }
  }

  const editItemText = (item: Item) => {
    startEditingNote(item)
  }

  const worldStyle = {
    width: WORLD.width,
    height: WORLD.height,
    transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom})`,
    transformOrigin: 'center center'
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-100">
        <form onSubmit={auth} className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Sparkles className="size-6 text-violet-400" /> Studyboard
            </h1>
            <p className="text-xs text-slate-400">Interactive collaborative whiteboard with 3D molecular & math visualizers.</p>
          </div>
          <input
            required
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500"
          />
          <input
            required
            minLength={6}
            type="password"
            placeholder="Password (minimum 6 chars)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500"
          />
          <button className="rounded-xl bg-violet-600 hover:bg-violet-500 py-2.5 font-semibold text-white shadow-lg transition-colors">
            {authMode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
          {error && <p className="text-xs text-rose-400">{error}</p>}
          <button
            type="button"
            onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
            className="text-xs text-slate-400 hover:text-slate-200 text-center"
          >
            {authMode === 'signin' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
          </button>
        </form>
      </div>
    )
  }

  if (!room) {
    return (
      <main className="min-h-[100dvh] bg-slate-950 p-4 text-slate-100 sm:p-8">
        <div className="mx-auto flex max-w-4xl flex-col gap-8">
          <header className="flex items-center justify-between border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="size-5 text-violet-400" />
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-300">Studyboard Whiteboard</p>
              </div>
              <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight">Your Collaborative Study Rooms</h1>
              <p className="mt-1 text-sm text-slate-400">Open a shared study canvas or launch a new one.</p>
            </div>
            <button
              onClick={() => client?.auth.signOut()}
              className="rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Sign out
            </button>
          </header>

          <div className="grid gap-5 md:grid-cols-2">
            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur">
              <h2 className="font-semibold text-base text-slate-100">Create New Room</h2>
              <p className="mt-1 text-xs text-slate-400">Launch a private room with 3D molecular and equation visualizers.</p>
              <form onSubmit={e => { e.preventDefault(); void createRoom() }} className="mt-5 flex gap-2">
                <input
                  required
                  value={roomName}
                  onChange={e => setRoomName(e.target.value)}
                  placeholder="e.g. Organic Chem & Calculus"
                  className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-violet-500"
                />
                <button className="rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2 text-xs font-semibold text-white shadow transition-colors">
                  Create
                </button>
              </form>
              {syncError && <p className="mt-2 text-xs text-rose-400">{syncError}</p>}
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur">
              <h2 className="font-semibold text-base text-slate-100">Join Existing Room</h2>
              <p className="mt-1 text-xs text-slate-400">Paste an invite token or URL from a classmate.</p>
              <form onSubmit={e => { e.preventDefault(); joinRoom() }} className="mt-5 flex gap-2">
                <input
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value)}
                  placeholder="Invite token or URL"
                  className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-violet-500"
                />
                <button className="rounded-xl border border-slate-700 hover:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors">
                  Join
                </button>
              </form>
            </section>
          </div>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-400">Available Rooms ({rooms.length})</h3>
            </div>
            {rooms.length ? (
              <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                {rooms.map(r => (
                  <button
                    key={r.id}
                    onClick={() => openRoom(r)}
                    className="flex flex-col gap-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-left hover:border-violet-500/50 hover:bg-slate-900 transition-all group"
                  >
                    <span className="font-semibold text-slate-100 group-hover:text-violet-300 transition-colors">
                      {r.name}
                    </span>
                    <span className="text-xs text-slate-500">Open interactive study canvas →</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500">
                No rooms yet. Create your first room above to start drawing!
              </div>
            )}
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-slate-950 text-slate-100 select-none">
      <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-slate-800/80 bg-slate-950/90 px-3 sm:px-4 backdrop-blur z-30">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <button
            onClick={() => { setRoom(null); setItems([]); loadRooms() }}
            className="truncate font-semibold text-xs sm:text-sm hover:text-violet-300 transition-colors flex items-center gap-1.5 shrink-0 max-w-[180px] sm:max-w-xs"
          >
            <Sparkles size={16} className="text-violet-400 shrink-0" />
            <span className="truncate">{room?.name}</span>
          </button>
          <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] sm:text-[11px] font-medium text-emerald-400 border border-emerald-500/20 shrink-0">
            <Users size={11} />
            <span>{onlineUsers} live</span>
          </div>
          <span className="text-[11px] text-slate-500 hidden md:inline truncate">
            {items.length} items · {saving ? 'saving…' : 'synced'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <ExportStudyGuideButton
            items={items}
            roomName={room?.name || 'Studyboard Session'}
            surfaceRef={surfaceRef}
          />

          <button
            onClick={makeInvite}
            title="Copy room invite link"
            className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Send size={13} />
            <span className="hidden sm:inline">Invite</span>
          </button>

          <button
            onClick={() => client?.auth.signOut()}
            title="Sign out"
            className="rounded-xl border border-slate-800 bg-slate-900/80 p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <LogOut size={14} />
          </button>
        </div>
      </header>

      <FloatingToolbar
        currentTool={tool}
        onSelectTool={t => {
          setTool(t)
          setActiveLassoMenu(null)
          setLassoRect(null)
        }}
        shapeKind={shapeKind}
        onChangeShapeKind={setShapeKind}
        connectorKind={connectorKind}
        onChangeConnectorKind={setConnectorKind}
        lineStyle={lineStyle}
        onToggleLineStyle={() => setLineStyle(s => (s === 'solid' ? 'dashed' : 'solid'))}
        currentColor={color}
        onChangeColor={c => {
          setColor(c)
          if (selected) {
            const it = items.find(x => x.id === selected)
            if (it) {
              const nextPayload = { ...it.payload, color: c }
              void update(it.id, nextPayload)
            }
          }
        }}
        brushSize={brushSize}
        onChangeBrushSize={size => {
          setBrushSize(size)
          if (selected) {
            const it = items.find(x => x.id === selected)
            if (it) {
              const nextPayload = { ...it.payload, strokeWidth: size }
              void update(it.id, nextPayload)
            }
          }
        }}
        textSize={textSize}
        onChangeTextSize={handleUpdateTextSize}
        onImportFile={handleImportFile}
        onClearCanvas={clear}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={history.length > 0}
        canRedo={redoStack.length > 0}
      />

      {activeLassoMenu && (
        <LassoActionMenu
          position={activeLassoMenu.screenPos}
          onRenderMolecule={triggerRenderMolecule}
          onPlotGraph={triggerPlotGraph}
          onAiExplain={triggerAiExplain}
          onCancel={() => {
            setActiveLassoMenu(null)
            setLassoRect(null)
          }}
        />
      )}

      {moleculeModalOpen && (
        <MoleculeViewerModal
          data={moleculeData}
          loading={moleculeLoading}
          error={moleculeError}
          onClose={() => setMoleculeModalOpen(false)}
          onAddToBoard={mol => {
            insert({
              item_type: 'note',
              payload: {
                x: (lastCropSelection?.x ?? 200) + 50,
                y: (lastCropSelection?.y ?? 200) + 50,
                width: 260,
                height: 180,
                color: '#0f172a',
                text: `🔬 ${mol.compoundName} (${mol.formula})\nSMILES: ${mol.smiles}\n\n${mol.description}`
              }
            })
            setMoleculeModalOpen(false)
          }}
        />
      )}

      {graphModalOpen && (
        <GraphPlotterModal
          data={graphData}
          loading={graphLoading}
          error={graphError}
          onClose={() => setGraphModalOpen(false)}
          onAddToBoard={plot => {
            insert({
              item_type: 'note',
              payload: {
                x: (lastCropSelection?.x ?? 200) + 50,
                y: (lastCropSelection?.y ?? 200) + 50,
                width: 320,
                height: 200,
                color: '#0f172a',
                textColor: '#ffffff',
                text: `📈 ${plot.equation}\nVertex: (${plot.vertex.x}, ${plot.vertex.y})\nRoots: ${plot.roots.join(', ') || 'None'}\nFactored: ${plot.factoredForm}`
              }
            })
            setGraphModalOpen(false)
          }}
        />
      )}

      {aiTutorOpen && (
        <aside className="fixed right-0 top-12 z-50 flex h-[calc(100%-3rem)] w-full max-w-md flex-col border-l border-slate-800 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-xl animate-in slide-in-from-right duration-200 select-text">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-100">AI Assistant</h3>
                <p className="text-[10px] text-slate-400">General intelligence for notes, questions, concepts, people & problems</p>
              </div>
            </div>
            <button
              onClick={() => setAiTutorOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1">
            {aiTutorError && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200 flex flex-col gap-2">
                <p>{aiTutorError}</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      void triggerAiExplain()
                    }}
                    className="px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors cursor-pointer text-xs"
                  >
                    Try Again
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiTutorError('')}
                    className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer text-xs"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {aiTutorLoading ? (
              <div className="flex flex-col items-center justify-center gap-4 py-20 text-slate-400">
                <div className="size-10 animate-spin rounded-full border-2 border-emerald-500/20 border-t-emerald-400" />
                <p className="text-xs">Analyzing selection with AI...</p>
              </div>
            ) : aiTutorResult ? (
              <>
                <section className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      {aiTutorResult.contentType === 'problem'
                        ? 'Parsed Problem / Expression'
                        : aiTutorResult.contentType === 'entity'
                        ? 'Identified Subject / Person'
                        : aiTutorResult.contentType === 'brainstorm'
                        ? 'Topic / Brainstorm'
                        : 'Identified Topic / Subject'}
                    </span>
                    {aiTutorResult.contentType && (
                      <span className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold tracking-wider border border-emerald-500/30">
                        {aiTutorResult.contentType.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 font-medium text-sm text-emerald-300 whitespace-pre-wrap leading-snug">
                    {aiTutorResult.parsedEquation}
                  </div>
                </section>

                <section className="space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    {aiTutorResult.contentType === 'problem'
                      ? 'Step-by-Step Solution & Explanation'
                      : 'Key Insights & Details'}
                  </span>
                  <ol className="space-y-2 text-xs leading-relaxed text-slate-200">
                    {aiTutorResult.steps.map((step, idx) => (
                      <li key={idx} className="flex gap-2 rounded-lg bg-slate-950/50 p-2.5 border border-slate-800/80">
                        <span className="font-bold text-emerald-400 shrink-0">{idx + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </section>

                <section className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    {aiTutorResult.contentType === 'problem' ? 'Core Principle & Key Takeaway' : 'Summary & Key Takeaways'}
                  </span>
                  <p className="mt-1 text-xs leading-relaxed text-slate-300">{aiTutorResult.coreConcept}</p>
                </section>

                <button
                  id="pin-solution-to-board-btn"
                  onClick={() => {
                    if (aiTutorResult && lastCropSelection) {
                      insert({
                        item_type: 'note',
                        payload: {
                          x: lastCropSelection.x + lastCropSelection.width + 24,
                          y: lastCropSelection.y,
                          width: 360,
                          height: 280,
                          color: '#0f172a',
                          textColor: '#ffffff',
                          isAiSolution: true,
                          text: `Parsed: ${aiTutorResult.parsedEquation}\n\nSteps:\n${aiTutorResult.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nCore Concept:\n${aiTutorResult.coreConcept}`
                        }
                      })
                      setAiTutorOpen(false)
                      void Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'success',
                        title: 'Insights Pinned to Canvas',
                        text: 'Sticky note added with white text.',
                        timer: 2000,
                        showConfirmButton: false,
                        customClass: { popup: 'studyboard-swal' }
                      })
                    }
                  }}
                  className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-semibold text-white shadow transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles size={14} />
                  <span>Pin Insights Note to Canvas</span>
                </button>
              </>
            ) : null}
          </div>
        </aside>
      )}

      {textDraft && (
        <div
          id="add-text-modal-backdrop"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          onClick={() => setTextDraft(null)}
        >
          <div
            id="add-text-dialog"
            className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl"
            onClick={e => e.stopPropagation()}
            onPointerDown={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-semibold text-white">Add Canvas Text</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Color:</span>
                <div className="flex items-center gap-1.5">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`size-5 rounded-full border transition-transform ${
                        color === c ? 'scale-125 ring-2 ring-violet-400 border-white' : 'border-white/20 hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            </div>
            <textarea
              id="add-text-textarea"
              autoFocus
              value={textValue}
              onChange={e => setTextValue(e.target.value)}
              onKeyDown={e => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault()
                  if (textDraft) {
                    const finalVal = textValue.trim() || 'Text'
                    const chosenColor = getCanvasTextColor(color)
                    insert({
                      item_type: 'text',
                      payload: {
                        x: textDraft.x,
                        y: textDraft.y,
                        text: finalVal,
                        color: chosenColor,
                        textColor: chosenColor,
                        fontSize: textSize
                      }
                    })
                  }
                  setTextDraft(null)
                }
              }}
              placeholder="Type notes, formulas, or labels... (Ctrl+Enter to save)"
              className="mt-3 min-h-24 w-full resize-none rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm outline-none focus:border-violet-500"
              style={{ color: getCanvasTextColor(color), fontSize: `${textSize}px` }}
            />
            <div className="flex items-center justify-between mt-3 px-0.5">
              <span className="text-xs text-slate-400 font-medium">Text Size:</span>
              <div className="flex items-center gap-1.5">
                {[
                  { label: 'S', size: 14, title: 'Small (14px)' },
                  { label: 'M', size: 18, title: 'Medium (18px)' },
                  { label: 'L', size: 24, title: 'Large (24px)' },
                  { label: 'XL', size: 32, title: 'Extra Large (32px)' },
                  { label: '2XL', size: 44, title: 'Display (44px)' }
                ].map(opt => (
                  <button
                    key={opt.size}
                    type="button"
                    onClick={() => setTextSize(opt.size)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      textSize === opt.size
                        ? 'bg-violet-600 text-white shadow ring-1 ring-violet-400'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                    title={opt.title}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">Tip: Ctrl+Enter to save</span>
              <div className="flex gap-2">
                <button
                  id="cancel-text-btn"
                  type="button"
                  onClick={() => setTextDraft(null)}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="submit-text-btn"
                  type="button"
                  onClick={() => {
                    if (textDraft) {
                      const finalVal = textValue.trim() || 'Text'
                      const chosenColor = getCanvasTextColor(color)
                      insert({
                        item_type: 'text',
                        payload: {
                          x: textDraft.x,
                          y: textDraft.y,
                          text: finalVal,
                          color: chosenColor,
                          textColor: chosenColor,
                          fontSize: textSize
                        }
                      })
                    }
                    setTextDraft(null)
                  }}
                  className="rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2 text-xs font-semibold text-white shadow transition-colors cursor-pointer"
                >
                  Add Text
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <section
        id="studyboard-canvas-surface"
        ref={surfaceRef}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onDragOver={e => {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'copy'
        }}
        onDrop={e => {
          e.preventDefault()
          const file = e.dataTransfer.files?.[0]
          if (file) {
            void handleImportFile(file)
          }
        }}
        onWheel={e => {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            setZoom(current => Math.min(2.5, Math.max(0.4, current - e.deltaY * 0.001)))
          }
        }}
        className={`relative min-w-0 flex-1 overflow-hidden bg-slate-950 ${
          tool === 'pan' || isSpaceDown.current
            ? 'cursor-grab active:cursor-grabbing'
            : tool === 'lasso'
            ? 'cursor-crosshair'
            : tool === 'pen' || tool === 'highlighter'
            ? 'cursor-crosshair'
            : tool === 'eraser'
            ? 'cursor-not-allowed'
            : 'cursor-default'
        }`}
        style={{
          touchAction: 'none',
          backgroundImage:
            'radial-gradient(circle, #334155 1px, transparent 1px), radial-gradient(circle, #1e293b 1px, transparent 1px)',
          backgroundSize: '32px 32px, 8px 8px'
        }}
      >
        <div className="absolute left-1/2 top-1/2" style={worldStyle}>
          <svg width={WORLD.width} height={WORLD.height} className="absolute inset-0 overflow-visible pointer-events-none">
            <defs>
              <marker id="arrow-end" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
              </marker>
              <marker id="arrow-start" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 10 0 L 0 5 L 10 10 z" fill="currentColor" />
              </marker>
            </defs>

            {items.map(i => {
              if (i.item_type === 'stroke') {
                return (
                  <path
                    key={i.id}
                    d={renderPath(i.payload.points ?? [])}
                    fill="none"
                    stroke={i.payload.color}
                    strokeWidth={i.payload.strokeWidth ?? 4}
                    opacity={i.payload.opacity ?? 1}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )
              }

              if (i.item_type === 'shape') {
                const { x, y, width = 100, height = 80, shape = 'rectangle', color = '#fff', strokeWidth = 3 } = i.payload
                if (shape === 'rectangle') {
                  return <rect key={i.id} x={x} y={y} width={width} height={height} fill="transparent" stroke={color} strokeWidth={strokeWidth} rx="8" />
                }
                if (shape === 'ellipse') {
                  return <ellipse key={i.id} cx={x + width / 2} cy={y + height / 2} rx={width / 2} ry={height / 2} fill="transparent" stroke={color} strokeWidth={strokeWidth} />
                }
                if (shape === 'triangle') {
                  return <polygon key={i.id} points={`${x + width / 2},${y} ${x},${y + height} ${x + width},${y + height}`} fill="transparent" stroke={color} strokeWidth={strokeWidth} />
                }
                if (shape === 'diamond') {
                  return <polygon key={i.id} points={`${x + width / 2},${y} ${x + width},${y + height / 2} ${x + width / 2},${y + height} ${x},${y + height / 2}`} fill="transparent" stroke={color} strokeWidth={strokeWidth} />
                }
              }

              if (i.item_type === 'connector' && i.payload.start && i.payload.end) {
                const { start, end, color = '#fff', connector = 'line', lineStyle = 'solid', strokeWidth = 3 } = i.payload
                return (
                  <g key={i.id}>
                    <line
                      x1={start.x}
                      y1={start.y}
                      x2={end.x}
                      y2={end.y}
                      stroke={color}
                      strokeWidth={strokeWidth}
                      strokeDasharray={lineStyle === 'dashed' ? '6,6' : undefined}
                      strokeLinecap="round"
                    />
                    {(connector === 'arrow' || connector === 'double') && renderArrowHead(start, end, color, strokeWidth)}
                    {connector === 'double' && renderArrowHead(end, start, color, strokeWidth)}
                  </g>
                )
              }

              return null
            })}

            {livePoints.length > 1 && (
              <path
                d={renderPath(livePoints)}
                fill="none"
                stroke={tool === 'highlighter' ? (color === '#f8fafc' ? '#fef08a' : color) : color}
                strokeWidth={tool === 'highlighter' ? Math.max(22, brushSize * 4) : brushSize}
                opacity={tool === 'highlighter' ? 0.35 : 1}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {liveShape && tool === 'shape' && (
              <>
                {shapeKind === 'rectangle' && (
                  <rect
                    x={Math.min(liveShape.start.x, liveShape.end.x)}
                    y={Math.min(liveShape.start.y, liveShape.end.y)}
                    width={Math.abs(liveShape.end.x - liveShape.start.x)}
                    height={Math.abs(liveShape.end.y - liveShape.start.y)}
                    fill="transparent"
                    stroke={color}
                    strokeWidth={brushSize}
                    rx="8"
                  />
                )}
                {shapeKind === 'ellipse' && (
                  <ellipse
                    cx={(liveShape.start.x + liveShape.end.x) / 2}
                    cy={(liveShape.start.y + liveShape.end.y) / 2}
                    rx={Math.abs(liveShape.end.x - liveShape.start.x) / 2}
                    ry={Math.abs(liveShape.end.y - liveShape.start.y) / 2}
                    fill="transparent"
                    stroke={color}
                    strokeWidth={brushSize}
                  />
                )}
                {shapeKind === 'triangle' && (
                  <polygon
                    points={`${(liveShape.start.x + liveShape.end.x) / 2},${Math.min(liveShape.start.y, liveShape.end.y)} ${Math.min(liveShape.start.x, liveShape.end.x)},${Math.max(liveShape.start.y, liveShape.end.y)} ${Math.max(liveShape.start.x, liveShape.end.x)},${Math.max(liveShape.start.y, liveShape.end.y)}`}
                    fill="transparent"
                    stroke={color}
                    strokeWidth={brushSize}
                  />
                )}
                {shapeKind === 'diamond' && (
                  <polygon
                    points={`${(liveShape.start.x + liveShape.end.x) / 2},${Math.min(liveShape.start.y, liveShape.end.y)} ${Math.max(liveShape.start.x, liveShape.end.x)},${(liveShape.start.y + liveShape.end.y) / 2} ${(liveShape.start.x + liveShape.end.x) / 2},${Math.max(liveShape.start.y, liveShape.end.y)} ${Math.min(liveShape.start.x, liveShape.end.x)},${(liveShape.start.y + liveShape.end.y) / 2}`}
                    fill="transparent"
                    stroke={color}
                    strokeWidth={brushSize}
                  />
                )}
              </>
            )}

            {liveShape && tool === 'connector' && (
              <g>
                <line
                  x1={liveShape.start.x}
                  y1={liveShape.start.y}
                  x2={liveShape.end.x}
                  y2={liveShape.end.y}
                  stroke={color}
                  strokeWidth={brushSize}
                  strokeDasharray={lineStyle === 'dashed' ? '6,6' : undefined}
                  strokeLinecap="round"
                />
                {(connectorKind === 'arrow' || connectorKind === 'double') && renderArrowHead(liveShape.start, liveShape.end, color, brushSize)}
                {connectorKind === 'double' && renderArrowHead(liveShape.end, liveShape.start, color, brushSize)}
              </g>
            )}
          </svg>

          {lassoRect && (
            <div
              className="pointer-events-none absolute z-40 border-2 border-dashed border-violet-400 bg-violet-500/10 shadow-[0_0_15px_rgba(168,85,247,0.3)] rounded-lg"
              style={{
                left: `${lassoRect.x}px`,
                top: `${lassoRect.y}px`,
                width: `${lassoRect.width}px`,
                height: `${lassoRect.height}px`
              }}
            />
          )}

          {items.filter(i => i.item_type === 'document' || i.payload.isDocument).map(i => {
            const isSelected = selected === i.id
            const isSummarizing = summarizingDocId === i.id
            let previewSource = i.payload.imageUrl || i.payload.fileData
            if (previewSource?.startsWith('blob:') && i.payload.fileData && !i.payload.fileData.startsWith('blob:')) {
              previewSource = i.payload.fileData
            }

            return (
              <div
                key={i.id}
                onClick={() => setSelected(i.id)}
                className={`absolute rounded-2xl overflow-hidden border transition-all ${
                  isSelected ? 'ring-2 ring-violet-400 border-violet-400' : 'border-slate-800'
                } bg-slate-900 shadow-2xl`}
                style={{
                  left: `${i.payload.x}px`,
                  top: `${i.payload.y}px`,
                  width: `${i.payload.width ?? 400}px`,
                  height: `${i.payload.height ?? 340}px`,
                  zIndex: isSelected ? 20 : 10
                }}
              >
                <div className="flex h-10 items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-3 select-none">
                  <div className="flex items-center gap-2 truncate">
                    <FileText size={15} className="text-violet-400 shrink-0" />
                    <span className="truncate text-xs font-semibold text-slate-200">
                      {i.payload.fileName || 'Imported Document'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 document-interactive">
                    <button
                      type="button"
                      onPointerDown={e => e.stopPropagation()}
                      onMouseDown={e => e.stopPropagation()}
                      onClick={e => {
                        e.stopPropagation()
                        void handleSummarizeDocument(i)
                      }}
                      disabled={isSummarizing}
                      className="flex items-center gap-1 rounded-lg bg-violet-600/40 hover:bg-violet-600 px-2.5 py-1 text-[11px] font-semibold text-violet-200 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                      title="AI Summarize: extract formulas and core concepts using Gemini Vision"
                    >
                      <Sparkles size={12} className={isSummarizing ? 'animate-spin text-amber-300' : 'text-violet-300'} />
                      <span>{isSummarizing ? 'Summarizing…' : 'AI Summarize'}</span>
                    </button>

                    <button
                      type="button"
                      onPointerDown={e => e.stopPropagation()}
                      onMouseDown={e => e.stopPropagation()}
                      onClick={e => {
                        e.stopPropagation()
                        void remove(i.id)
                      }}
                      className="rounded p-1 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete document"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                <div className="h-[calc(100%-2.5rem)] w-full overflow-hidden bg-slate-950 flex items-center justify-center relative">
                  {i.payload.fileType === 'pdf' ? (
                    previewSource ? (
                      <iframe
                        src={previewSource.startsWith('data:') ? previewSource : `${previewSource}#toolbar=0`}
                        className="h-full w-full border-none pointer-events-auto bg-slate-900"
                        title={i.payload.fileName || 'PDF Preview'}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 p-4 text-center text-slate-400">
                        <FileText size={36} className="text-violet-400" />
                        <span className="text-xs text-slate-300 font-medium">{i.payload.fileName || 'PDF Document'}</span>
                        <span className="text-[11px] text-slate-500">Preview loading or unavailable</span>
                      </div>
                    )
                  ) : previewSource ? (
                    <img
                      src={previewSource}
                      alt={i.payload.fileName || 'Uploaded notes'}
                      className="h-full w-full object-contain pointer-events-none select-none"
                      onError={e => {
                        if (i.payload.fileData && i.payload.fileData !== previewSource) {
                          (e.currentTarget as HTMLImageElement).src = i.payload.fileData
                        }
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 p-4 text-center text-slate-400">
                      <FileText size={32} className="text-slate-600" />
                      <span className="text-xs text-slate-300 font-medium">{i.payload.fileName || 'Document'}</span>
                      <span className="text-[11px] text-slate-500">Document preview unavailable</span>
                    </div>
                  )}

                  <div
                    onMouseDown={e => {
                      e.stopPropagation()
                      resizingRef.current = {
                        id: i.id,
                        startWidth: i.payload.width ?? 400,
                        startHeight: i.payload.height ?? 340,
                        startX: worldPoint(e).x,
                        startY: worldPoint(e).y
                      }
                    }}
                    className="absolute bottom-1 right-1 size-5 cursor-se-resize flex items-center justify-center text-slate-500 hover:text-violet-400 bg-slate-900/80 rounded"
                    title="Drag to resize document"
                  >
                    <Maximize2 size={12} className="rotate-90" />
                  </div>
                </div>
              </div>
            )
          })}

          {items.filter(i => (i.item_type === 'note' || i.item_type === 'text') && !i.payload.isDocument).map(i => {
            const isSelected = selected === i.id
            const isSummary = !!i.payload.summaryData

            if (isSummary && i.payload.summaryData) {
              return (
                <div
                  key={i.id}
                  style={{ left: `${i.payload.x}px`, top: `${i.payload.y}px` }}
                  className="absolute"
                  onClick={() => setSelected(i.id)}
                >
                  <NoteSummaryCard
                    data={i.payload.summaryData}
                    onClose={() => void remove(i.id)}
                  />
                </div>
              )
            }

            const isNote = i.item_type === 'note'
            const isText = i.item_type === 'text'

            const noteCardIsDark = getContrastTextColor(i.payload.color, i.payload.textColor) === '#ffffff'
            const itemTextColor = isText
              ? getCanvasTextColor(i.payload.color, i.payload.textColor)
              : (i.payload.textColor || (noteCardIsDark ? '#ffffff' : '#090d16'))
            const isDark = isText ? true : noteCardIsDark

            return (
              <div
                key={i.id}
                onPointerDown={e => {
                  if ((e.target as HTMLElement).closest('button, textarea, input, a')) {
                    return
                  }
                  const now = Date.now()
                  if (lastNoteClickRef.current.id === i.id && now - lastNoteClickRef.current.time < 380) {
                    e.stopPropagation()
                    startEditingNote(i)
                    lastNoteClickRef.current = { id: '', time: 0 }
                    return
                  }
                  lastNoteClickRef.current = { id: i.id, time: now }
                }}
                onDoubleClick={e => {
                  e.stopPropagation()
                  startEditingNote(i)
                }}
                onClick={() => setSelected(i.id)}
                className={`absolute cursor-pointer transition-all note-editable-area ${
                  isSelected ? 'ring-2 ring-violet-400' : ''
                } ${
                  isNote
                    ? 'rounded-2xl p-4 shadow-xl border flex flex-col'
                    : 'rounded-xl px-2.5 py-1.5 font-sans flex flex-col hover:ring-1 hover:ring-white/20'
                }`}
                style={{
                  left: `${i.payload.x}px`,
                  top: `${i.payload.y}px`,
                  width: i.payload.width ?? (isNote ? 240 : undefined),
                  minWidth: isText ? 80 : undefined,
                  minHeight: i.payload.height ?? (isNote ? 120 : undefined),
                  background: isNote ? (i.payload.color || '#0f172a') : 'transparent',
                  color: itemTextColor,
                  borderColor: isNote ? (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)') : 'transparent',
                  fontSize: `${i.payload.fontSize ?? (isText ? 18 : 15)}px`
                }}
              >
                {isNote && (
                  <div className={`flex items-center justify-between mb-2 pb-1 border-b ${
                    isDark ? 'border-white/20 text-white/80' : 'border-black/15 text-black/65'
                  } text-[10px] font-bold uppercase tracking-wider select-none`}>
                    <span className="flex items-center gap-1">
                      {i.payload.isAiSolution && <Sparkles size={11} className="text-emerald-400" />}
                      <span>{i.payload.isAiSolution ? 'AI Solution Note' : 'Sticky Note'}</span>
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onPointerDown={e => e.stopPropagation()}
                        onMouseDown={e => e.stopPropagation()}
                        onClick={e => {
                          e.stopPropagation()
                          const cur = i.payload.fontSize || 15
                          const next = cur === 13 ? 15 : cur === 15 ? 18 : cur === 18 ? 22 : 13
                          void update(i.id, { ...i.payload, fontSize: next })
                        }}
                        className="px-1.5 py-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 text-[9px] font-bold transition-colors cursor-pointer"
                        title={`Text size: ${i.payload.fontSize || 15}px (Click to cycle)`}
                      >
                        Aa
                      </button>
                      <button
                        type="button"
                        onPointerDown={e => e.stopPropagation()}
                        onMouseDown={e => e.stopPropagation()}
                        onClick={e => {
                          e.stopPropagation()
                          startEditingNote(i)
                        }}
                        className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
                        title="Edit note text"
                      >
                        <Pencil size={11} />
                      </button>
                      <button
                        type="button"
                        onPointerDown={e => e.stopPropagation()}
                        onMouseDown={e => e.stopPropagation()}
                        onClick={e => {
                          e.stopPropagation()
                          void remove(i.id)
                        }}
                        className="p-1 rounded hover:bg-rose-500/20 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete note"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                )}

                {isText && isSelected && (
                  <div className="absolute -top-9 right-0 flex items-center gap-1.5 bg-slate-900/95 border border-slate-700/80 rounded-xl px-2 py-1 shadow-xl select-none z-30 backdrop-blur-md">
                    <div className="flex items-center gap-1 pr-1.5 border-r border-slate-700">
                      {[
                        { label: 'S', size: 14, title: 'Small (14px)' },
                        { label: 'M', size: 18, title: 'Medium (18px)' },
                        { label: 'L', size: 24, title: 'Large (24px)' },
                        { label: 'XL', size: 32, title: 'Extra Large (32px)' },
                        { label: '2XL', size: 44, title: 'Display (44px)' }
                      ].map(sz => (
                        <button
                          key={sz.size}
                          type="button"
                          onPointerDown={e => e.stopPropagation()}
                          onMouseDown={e => e.stopPropagation()}
                          onClick={e => {
                            e.stopPropagation()
                            handleUpdateTextSize(sz.size)
                          }}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                            (i.payload.fontSize || 18) === sz.size
                              ? 'bg-violet-600 text-white shadow'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                          title={sz.title}
                        >
                          {sz.label}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onPointerDown={e => e.stopPropagation()}
                      onMouseDown={e => e.stopPropagation()}
                      onClick={e => {
                        e.stopPropagation()
                        startEditingNote(i)
                      }}
                      className="p-1 rounded text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title="Edit text"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      type="button"
                      onPointerDown={e => e.stopPropagation()}
                      onMouseDown={e => e.stopPropagation()}
                      onClick={e => {
                        e.stopPropagation()
                        void remove(i.id)
                      }}
                      className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                      title="Delete text"
                    >
                      <X size={13} />
                    </button>
                  </div>
                )}

                {editingNoteId === i.id ? (
                  <div
                    className="w-full flex-1 flex flex-col gap-2"
                    onPointerDown={e => e.stopPropagation()}
                    onMouseDown={e => e.stopPropagation()}
                  >
                    <textarea
                      ref={noteTextareaRef}
                      autoFocus
                      value={editingNoteText}
                      onChange={e => setEditingNoteText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Escape' || ((e.ctrlKey || e.metaKey) && e.key === 'Enter')) {
                          e.preventDefault()
                          void finishEditingNote()
                        }
                      }}
                      onBlur={() => void finishEditingNote()}
                      rows={isNote ? 4 : 2}
                      className="w-full flex-1 resize-none rounded-lg border border-violet-400/50 bg-slate-900/95 p-2 font-medium outline-none focus:ring-2 focus:ring-violet-400 shadow-inner"
                      style={{
                        color: itemTextColor,
                        fontSize: `${i.payload.fontSize ?? (isNote ? 15 : 18)}px`,
                        lineHeight: 1.4
                      }}
                      placeholder={isNote ? "Type note content..." : "Type text..."}
                    />
                    <div className="flex items-center justify-between text-[10px] opacity-80 select-none">
                      <span>Ctrl+Enter or click outside to save</span>
                      <button
                        type="button"
                        onPointerDown={e => e.stopPropagation()}
                        onMouseDown={e => e.stopPropagation()}
                        onClick={e => {
                          e.stopPropagation()
                          void finishEditingNote()
                        }}
                        className="rounded bg-violet-600 px-2 py-0.5 font-semibold text-white hover:bg-violet-500 cursor-pointer transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`whitespace-pre-wrap leading-relaxed ${
                      isText ? 'font-semibold tracking-wide' : 'font-medium'
                    } cursor-text select-text flex-1`}
                    style={{
                      color: itemTextColor,
                      fontSize: `${i.payload.fontSize ?? (isText ? 18 : 15)}px`
                    }}
                    title="Double click or click pencil to edit"
                  >
                    {i.payload.text || (isNote ? 'Sticky Note' : 'Text')}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="fixed bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-slate-700/80 bg-slate-950/90 px-3 py-1.5 text-xs shadow-xl backdrop-blur-xl">
          <button
            onClick={() => setZoom(z => Math.max(0.4, Number((z - 0.1).toFixed(1))))}
            className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Zoom out"
          >
            −
          </button>
          <span className="w-12 text-center font-mono font-semibold text-slate-200">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(z => Math.min(2.5, Number((z + 0.1).toFixed(1))))}
            className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Zoom in"
          >
            ＋
          </button>

          <div className="h-4 w-[1px] bg-slate-800 mx-1" />

          <button
            onClick={() => {
              setZoom(1)
              setPan({ x: 0, y: 0 })
            }}
            className="rounded-lg px-2 py-1 text-[11px] text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Reset pan & zoom"
          >
            Reset
          </button>
        </div>
      </section>
    </main>
  )
}
