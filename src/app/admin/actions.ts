// Client-side logout — não usa 'use server'
import { createClient } from '@/lib/supabase/client'

export async function adminSignOutAction(): Promise<void> {
  const supabase = createClient()
  await supabase.auth.signOut()
  window.location.href = '/login'
}
