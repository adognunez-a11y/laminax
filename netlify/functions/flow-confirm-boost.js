// netlify/functions/flow-confirm-boost.js
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const FLOW_API_URL = process.env.FLOW_ENV === 'sandbox'
  ? 'https://sandbox.flow.cl/api'
  : 'https://www.flow.cl/api'

const API_KEY = process.env.FLOW_API_KEY
const SECRET_KEY = process.env.FLOW_SECRET_KEY

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

function signParams(params) {
  const keys = Object.keys(params).sort()
  const toSign = keys.map(k => `${k}${params[k]}`).join('')
  return crypto.createHmac('sha256', SECRET_KEY).update(toSign).digest('hex')
}

export const handler = async (event) => {
  try {
    const body = new URLSearchParams(event.body)
    const token = body.get('token')
    if (!token) return { statusCode: 400, body: 'Token requerido' }

    const params = { apiKey: API_KEY, token }
    params.s = signParams(params)
    const query = Object.keys(params).map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join('&')

    const response = await fetch(`${FLOW_API_URL}/payment/getStatus?${query}`)
    const payment = await response.json()

    if (payment.status === 2) {
      const optional = JSON.parse(payment.optional || '{}')
      const { userId, listingId, tier, price } = optional

      // Activar boost: 48 horas desde ahora
      const now = new Date()
      const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000)

      await supabase
        .from('listings')
        .update({ boosted_until: expiresAt.toISOString() })
        .eq('id', listingId)

      await supabase.from('boost_payments').insert({
        user_id: userId,
        listing_id: listingId,
        tier,
        amount_clp: price,
        flow_order_id: payment.commerceOrder,
        status: 'paid',
        starts_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        is_free_monthly: false,
      })

      console.log(`Boost activado para listing ${listingId} hasta ${expiresAt}`)
    }

    return { statusCode: 200, body: 'OK' }
  } catch (err) {
    console.error('Confirm boost error:', err)
    return { statusCode: 500, body: 'Error interno' }
  }
}
