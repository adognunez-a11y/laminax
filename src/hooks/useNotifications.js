import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useNotifications() {
  const { user } = useAuth()
  const [mensajes, setMensajes] = useState(0)
  const [intercambios, setIntercambios] = useState(0)

  useEffect(() => {
    if (!user) return
    cargarNotificaciones()

    const sub = supabase
      .channel('notificaciones')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` },
        () => cargarNotificaciones()
      )
      .subscribe()

    return () => supabase.removeChannel(sub)
  }, [user])

  async function cargarNotificaciones() {
    const { data: msgs } = await supabase
      .from('messages')
      .select('id')
      .eq('receiver_id', user.id)
      .is('read_at', null)
    setMensajes(msgs?.length || 0)

    const { data: txs } = await supabase
      .from('transactions')
      .select('id')
      .eq('seller_id', user.id)
      .eq('status', 'pending')
    setIntercambios(txs?.length || 0)
  }

  return { mensajes, intercambios, total: mensajes + intercambios }
}
