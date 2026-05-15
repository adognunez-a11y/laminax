// netlify/functions/flow-confirm-payment.js
// Flow llama a esta función cuando el pago se confirma

const crypto = require('crypto')
const { createClient } = require('@supabase/supabase-js')

const FLOW_API_URL = process.env.FLOW_ENV === 'sandbox'
  ? 'https://sandbox.flow.cl/api'
  : 'https://www.flow.cl/api'

const API_KEY = process.env.FLOW_API_KEY
const SECRET_KEY = process.env.FLOW_SECRET_KEY

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Service key (no la anon key) para escribir desde backend
)

function signParams(params) {
  const keys = Object.keys(params).sort()
  const toSign = keys.map(k => `${k}${params[k]}`).join('')
  return crypto.createHmac('sha256', SECRET_KEY).update(toSign).digest('hex')
}

exports.handler = async (event) => {
  try {
    // Flow envía el token por POST
    const body = new URLSearchParams(event.body)
    const token = body.get('token')

    if (!token) {
      return { statusCode: 400, body: 'Token requerido' }
    }

    // Consultar estado del pago a Flow
    const params = { apiKey: API_KEY, token }
    params.s = signParams(params)

    const query = Object.keys(params)
      .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
      .join('&')

    const response = await fetch(`${FLOW_API_URL}/payment/getStatus?${query}`)
    const payment = await response.json()

    // Status 2 = pago exitoso en Flow
    if (payment.status === 2) {
      const optional = JSON.parse(payment.optional || '{}')
      const userId = optional.userId

      if (!userId) {
        console.error('No userId en optional:', payment)
        return { statusCode: 400, body: 'userId no encontrado' }
      }

      // Calcular período: hoy + 30 días
      const now = new Date()
      const periodEnd = new Date(now)
      periodEnd.setDate(periodEnd.getDate() + 30)

      // Activar Premium en Supabase
      const { error } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          plan: 'premium',
          status: 'active',
          flow_order_id: payment.commerceOrder,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          monthly_boost_used: false,
          monthly_boost_reset_at: periodEnd.toISOString(),
          updated_at: now.toISOString(),
        }, { onConflict: 'user_id' })

      if (error) {
        console.error('Supabase error:', error)
        return { statusCode: 500, body: 'Error actualizando suscripción' }
      }

      console.log(`Premium activado para usuario ${userId}`)
    } else {
      console.log(`Pago no exitoso, status: ${payment.status}`)
    }

    return { statusCode: 200, body: 'OK' }
  } catch (err) {
    console.error('Confirm error:', err)
    return { statusCode: 500, body: 'Error interno' }
  }
}
