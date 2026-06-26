import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pvlxifljjgnlghurjtvz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2bHhpZmxqamdubGdodXJqdHZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0NjY3MjksImV4cCI6MjA5ODA0MjcyOX0.hNbiCexe87yOS2ZYWnmf9vicoduuS71HS4VsBgSogo8'

export const supabase = createClient(supabaseUrl, supabaseKey)

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}