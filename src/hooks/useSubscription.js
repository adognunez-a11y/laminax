// src/hooks/useSubscription.js
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useSubscription() {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    fetchSubscription()
  }, [user])

  async function fetchSubscription() {
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()
    setSubscription(data)
    setLoading(false)
  }

  const isPremium = subscription?.plan === 'premium' && subscription?.status === 'active'
  const isFree = !isPremium

  // Verifica si puede publicar (Free: máx 10 listings activos)
  async function canPublish() {
    if (isPremium) return { allowed: true }
    const { count } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', user.id)
      .eq('status', 'active')
    if (count >= 10) return { allowed: false, reason: 'límite de 10 publicaciones activas' }
    return { allowed: true, remaining: 10 - count }
  }

  // Verifica si puede crear remates (solo Premium)
  function canCreateAuction() {
    if (isPremium) return { allowed: true }
    return { allowed: false, reason: 'crear remates es exclusivo de Premium' }
  }

  return { subscription, loading, isPremium, isFree, canPublish, canCreateAuction, refetch: fetchSubscription }
}
