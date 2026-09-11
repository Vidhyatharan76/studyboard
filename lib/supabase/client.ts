import { createBrowserClient } from '@supabase/ssr'

let client: any = undefined

class MockSupabaseClient {
  private user: { id: string; email?: string } | null = {
    id: 'user-demo-1',
    email: 'student@studyboard.app',
  }
  private rooms: Array<{ id: string; name: string; owner_id: string; created_at: string }> = [
    {
      id: 'room-default-study',
      name: 'Calculus & Physics Study Group',
      owner_id: 'user-demo-1',
      created_at: new Date().toISOString(),
    },
  ]
  private items: Array<{
    id: string
    board_id: string
    owner_id: string
    item_type: 'note' | 'stroke' | 'shape' | 'text' | 'connector' | 'document'
    payload: any
    created_at: string
  }> = [
    {
      id: 'item-demo-note',
      board_id: 'room-default-study',
      owner_id: 'user-demo-1',
      item_type: 'note',
      payload: {
        x: 100,
        y: 100,
        width: 280,
        height: 120,
        text: 'Welcome to Studyboard!\nUse Pen to write math, or AI Explain to solve formulas.',
        color: '#fef08a',
      },
      created_at: new Date().toISOString(),
    },
  ]
  private invites = new Map<string, string>()
  private authListeners: Array<(event: string, session: any) => void> = []
  private channels = new Map<string, any>()

  auth = {
    getUser: async () => ({
      data: { user: this.user ? { ...this.user } : null },
      error: null,
    }),
    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      this.authListeners.push(callback)
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              this.authListeners = this.authListeners.filter(l => l !== callback)
            },
          },
        },
      }
    },
    signInWithPassword: async ({ email }: { email: string; password?: string }) => {
      this.user = { id: `user-${email.replace(/[^a-zA-Z0-9]/g, '_')}`, email }
      const session = { user: this.user }
      this.authListeners.forEach(l => l('SIGNED_IN', session))
      return { data: { user: this.user, session }, error: null }
    },
    signUp: async ({ email }: { email: string; password?: string; options?: any }) => {
      this.user = { id: `user-${email.replace(/[^a-zA-Z0-9]/g, '_')}`, email }
      const session = { user: this.user }
      this.authListeners.forEach(l => l('SIGNED_IN', session))
      return { data: { user: this.user, session }, error: null }
    },
    signOut: async () => {
      this.user = null
      this.authListeners.forEach(l => l('SIGNED_OUT', null))
      return { error: null }
    },
  }

  from(table: string) {
    const self = this
    const filters: Record<string, any> = {}

    const queryBuilder: any = {
      select: () => queryBuilder,
      order: () => queryBuilder,
      eq: (col: string, val: any) => {
        filters[col] = val
        return queryBuilder
      },
      single: async () => {
        const res = await queryBuilder.execute()
        return { data: Array.isArray(res.data) ? (res.data[0] ?? null) : res.data, error: res.error }
      },
      insert: (record: any) => {
        if (table === 'boards') {
          const newRoom = {
            id: `room-${Date.now()}`,
            name: record.name,
            owner_id: record.owner_id || self.user?.id || 'user-demo-1',
            created_at: new Date().toISOString(),
          }
          self.rooms.push(newRoom)
          return {
            select: () => ({
              single: async () => ({ data: newRoom, error: null }),
            }),
          }
        }
        if (table === 'board_items') {
          const newItem = {
            id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            board_id: record.board_id,
            owner_id: record.owner_id || self.user?.id || 'user-demo-1',
            item_type: record.item_type,
            payload: record.payload,
            created_at: new Date().toISOString(),
          }
          self.items.push(newItem)
          return {
            select: () => ({
              single: async () => ({ data: newItem, error: null }),
            }),
          }
        }
        if (table === 'board_invites') {
          self.invites.set(record.token, record.board_id)
          return {
            select: () => ({
              single: async () => ({ data: { token: record.token }, error: null }),
            }),
          }
        }
        return {
          select: () => ({
            single: async () => ({ data: record, error: null }),
          }),
        }
      },
      update: (updates: any) => ({
        eq: async (col: string, val: any) => {
          if (table === 'board_items') {
            self.items = self.items.map(item => {
              if ((item as any)[col] === val) {
                return { ...item, ...updates }
              }
              return item
            })
          }
          return { error: null }
        },
      }),
      delete: () => ({
        eq: async (col: string, val: any) => {
          if (table === 'board_items') {
            self.items = self.items.filter(item => (item as any)[col] !== val)
          }
          return { error: null }
        },
      }),
      execute: async () => {
        if (table === 'boards') {
          if (filters.id) {
            const found = self.rooms.find(r => r.id === filters.id)
            return { data: found || null, error: null }
          }
          return { data: [...self.rooms], error: null }
        }
        if (table === 'board_members') {
          return { data: [], error: null }
        }
        if (table === 'board_items') {
          let list = [...self.items]
          if (filters.board_id) {
            list = list.filter(i => i.board_id === filters.board_id)
          }
          return { data: list, error: null }
        }
        return { data: [], error: null }
      },
      then: (resolve: (val: any) => void) => queryBuilder.execute().then(resolve),
    }

    return queryBuilder
  }

  rpc(fnName: string, args: any) {
    if (fnName === 'accept_board_invite') {
      const boardId = this.invites.get(args.invite_token) || this.rooms[0]?.id
      return Promise.resolve({ data: boardId, error: null })
    }
    return Promise.resolve({ data: null, error: null })
  }

  channel(channelName: string, _config?: any) {
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)
    }

    const listeners: Record<string, Array<(payload: any) => void>> = {}
    const ch = {
      on: (type: string, filterOrCb: any, maybeCb?: any) => {
        const event = filterOrCb?.event || type
        const cb = maybeCb || filterOrCb
        if (!listeners[event]) listeners[event] = []
        listeners[event].push(cb)
        return ch
      },
      subscribe: (callback?: (status: string) => void) => {
        setTimeout(() => callback?.('SUBSCRIBED'), 10)
        return ch
      },
      send: async ({ type, event, payload }: any) => {
        const targetEvent = event || type
        if (listeners[targetEvent]) {
          listeners[targetEvent].forEach(cb => {
            try {
              cb({ payload })
            } catch (e) {
              console.error(e)
            }
          })
        }
        return 'ok'
      },
      track: async (_presence: any) => {},
      untrack: async () => {},
      presenceState: () => ({ 'user-demo-1': [{}] }),
    }
    this.channels.set(channelName, ch)
    return ch
  }

  removeChannel(_ch: any) {
  }
}

export function createClient(): any {
  if (client) return client
  let rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (rawUrl.includes('=')) rawUrl = rawUrl.slice(rawUrl.indexOf('=') + 1)
  const supabaseUrl = rawUrl.trim()

  let rawKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  if (rawKey.includes('=')) rawKey = rawKey.slice(rawKey.indexOf('=') + 1)
  const supabaseKey = rawKey.trim()

  if (supabaseUrl && supabaseUrl.startsWith('http') && supabaseKey) {
    client = createBrowserClient(supabaseUrl, supabaseKey)
  } else {
    client = new MockSupabaseClient()
  }
  return client
}
