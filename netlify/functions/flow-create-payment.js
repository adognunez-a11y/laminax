// netlify/functions/flow-create-payment.js
import crypto from 'crypto'

const FLOW_API_URL = process.env.FLOW_ENV === 'sandbox'
  ? 'https://sandbox.flow.cl/api'
  : 'https://www.flow.cl/api'

const API_KEY = process.env.FLOW_API_KEY
const SECRET_KEY = process.env.FLOW_SECRET_KEY

function signParams(params) {
  const keys = Object.keys(params).sort()
  const toSign = keys.map(k => `${k}${params[k]}`).join('')
  return crypto.createHmac('sha256', SECRET_KEY).update(toSign).digest('hex')
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  try {
    const { userId, userEmail } = JSON.parse(event.body)

    if (!userId || !userEmail) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Faltan datos' }) }
    }

    const commerceOrder = `PRM-${userId.slice(0,8)}-${Date.now().toString().slice(-6)}`
    const baseUrl = process.env.URL || 'https://laminax-chile.netlify.app'

    const params = {
      apiKey: API_KEY,
      amount: 2990,
      commerceOrder,
      currency: 'CLP',
      email: userEmail,
      paymentMethod: 9,
      subject: 'LaminaX Premium - Suscripción mensual',
      urlConfirmation: `${baseUrl}/.netlify/functions/flow-confirm-payment`,
      urlReturn: `${baseUrl}/upgrade?status=success`,
      optional: JSON.stringify({ userId }),
    }

    params.s = signParams(params)

    const formBody = Object.keys(params)
      .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
      .join('&')

    const response = await fetch(`${FLOW_API_URL}/payment/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody,
    })

    const data = await response.json()

    if (data.url && data.token) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          paymentUrl: `${data.url}?token=${data.token}`,
          token: data.token,
          commerceOrder,
        }),
      }
    } else {
      console.error('Flow error:', data)
      return {
        statusCode: 400,
        body: JSON.stringify({ error: data.message || 'Error al crear pago en Flow' }),
      }
    }
  } catch (err) {
    console.error('Function error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error interno del servidor' }),
    }
  }
}
