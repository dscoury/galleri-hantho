import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const months = ['januar','februar','mars','april','mai','juni',
                  'juli','august','september','oktober','november','desember']
  const [year, month] = dateStr.split('-')
  return `${months[parseInt(month) - 1]} ${year}`
}