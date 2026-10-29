// @ts-nocheck
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { StatusEntrega } from '@/lib/types'

export async function updateDeliveryStatus(formData: FormData) {
  const id = String(formData.get('id') || '')
  const status = String(formData.get('status') || '') as StatusEntrega
  const linkEntrega = String(formData.get('link_entrega') || '')

  if (!id || !status) return

  const supabase = await createClient()
  const updates: Record<string, string> = { status }

  if (linkEntrega) {
    updates.link_entrega = linkEntrega
  }

  const { error } = await supabase.from('entregas').update(updates).eq('id', id)
  if (error) throw error

  revalidatePath('/admin/entregas')
  revalidatePath('/admin/dashboard')
  revalidatePath('/time/kanban')
}
