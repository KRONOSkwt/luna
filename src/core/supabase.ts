import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    '[supabase] VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set (see .env.example)',
  )
}

export const supabase = createClient(url, anonKey, {
  auth: {
    flowType: 'pkce',
    autoRefreshToken: true,
    persistSession: true,
  },
})

export type Memory = {
  id: string
  date: string
  title: string
  description: string
  is_first_kiss: boolean
  location: string
  order_index: number
  metadata: Record<string, unknown>
  created_at: string
}

export type MemoryInput = Pick<
  Memory,
  'date' | 'title' | 'description' | 'is_first_kiss' | 'order_index'
> &
  Partial<Pick<Memory, 'location' | 'metadata'>>