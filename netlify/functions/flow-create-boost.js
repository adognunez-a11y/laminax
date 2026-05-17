// netlify/functions/flow-create-boost.js
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

// Precio del boost según escasez
function getBoostPrice(scarcityIndex) {
  if (scarcityIndex <= 33) return { tier: 'bronce', price: 490 }
  if (scarcityIndex <= 66) return { tier: 'plata',  price: 690 }
  return { tier: 'oro', price: 990 }
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' }

  try {
    const { userId, userEmail, listingId, scarcityIndex, isFreeMonthly } = JSON.parse(event.body)

    if (!userId || !listingId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Faltan datos' }) }
    }

    // Si es el boost mensual gratuito de Premium, no cobrar
    if (isFreeMonthly) {
      return {
        statusCode: 200,
        body: JSON.stringify({ free: true, listingId }),
      }
    }

    const { tier, price } = getBoostPrice(scarcityIndex || 0)
    const commerceOrder = `BOOST-${listingId.slice(0,8)}-${Date.now().toString().slice(-6)}`
    const baseUrl = process.env.URL || 'https://laminax-chile.netlify.app'

    const params = {
      apiKey: API_KEY,
      amount: price,
      commerceOrder,
      currency: 'CLP',
      email: userEmail,
      paymentMethod: 9,
      subject: `LaminaX Boost ${tier} — 48 horas destacado`,
      urlConfirmation: `${baseUrl}/.netlify/functions/flow-confirm-boost`,
      urlReturn: `${baseUrl}/listing/${listingId}?boost=success`,
      optional: JSON.stringify({ userId, listingId, tier, price }),
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
          tier,
          price,
          commerceOrder,
        }),
      }
    } else {
      return { statusCode: 400, body: JSON.stringify({ error: data.message || 'Error Flow' }) }
    }
  } catch (err) {
    console.error('Boost error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: 'Error interno' }) }
  }
}
