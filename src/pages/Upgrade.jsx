import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSubscription } from '../hooks/useSubscription'
import { useAuth } from '../hooks/useAuth'

const BENEFICIOS = [
  { icon: '📢', titulo: 'Publicaciones ilimitadas', desc: 'Sin límite de láminas activas. Publica todo lo que quieras.' },
  { icon: '🔥', titulo: 'Crear remates', desc: 'Abre subastas y deja que el precio suba solo.' },
  { icon: '⚡', titulo: '1 boost mensual incluido', desc: 'Destaca una lámina gratis cada mes para vender más rápido.' },
  { icon: '✅', titulo: 'Badge verificado', desc: 'Genera más confianza con el badge Premium en tu perfil.' },
  { icon: '📊', titulo: 'Historial completo', desc: 'Accede a todo tu historial de transacciones sin límite de tiempo.' },
  { icon: '🎯', titulo: 'Estadísticas completas', desc: 'Ve datos detallados de tu colección y actividad en el mercado.' },
]

export default function Upgrade() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isPremium, loading, refetch } = useSubscription()
  const { user } = useAuth()
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState(null)

  const paymentSuccess = searchParams.get('status') === 'success'

  async function iniciarPago() {
    setPaying(true)
    setError(null)
    try {
      const response = await fetch('/.netlify/functions/flow-create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, userEmail: user.email }),
      })
      const data = await response.json()
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl
      } else {
        setError(data.error || 'Error al iniciar el pago')
        setPaying(false)
      }
    } catch (err) {
      setError('Error de conexión. Intenta nuevamente.')
      setPaying(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#050508]">
      <div className="text-[#ccff00]">Cargando...</div>
    </div>
  )

  if (paymentSuccess || isPremium) return (
    <div className="bg-[#050508] min-h-screen text-white p-4 pb-24">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate('/perfil')} className="text-gray-400 text-xl w-8 h-8 flex items-center justify-center">←</button>
        <h1 className="text-xl font-black">Mi Plan</h1>
      </div>
      <div className="flex flex-col items-center justify-center mt-16">
        <div className="w-24 h-24 bg-[#ccff00]/10 border-2 border-[#ccff00] rounded-full flex items-center justify-center text-4xl mb-4">⚡</div>
        <h2 className="text-2xl font-black mb-2">{paymentSuccess ? '¡Bienvenido a Premium!' : 'Eres Premium'}</h2>
        <p className="text-gray-400 text-sm text-center mb-8">
          {paymentSuccess
            ? 'Tu pago fue procesado. Ya tienes acceso a todas las funciones Premium.'
            : 'Tienes acceso a todas las funcionalidades de LaminaX.'}
        </p>
        <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between mb-6">
          <div>
            <div className="font-bold text-sm">Plan Premium</div>
            <div className="text-gray-400 text-xs mt-0.5">Renovación mensual</div>
          </div>
          <div className="text-[#ccff00] font-black">$2.990/mes</div>
        </div>
        <button onClick={() => navigate('/perfil')} className="w-full bg-[#ccff00] text-black font-black py-4 rounded-2xl text-lg">
          Ir a mi perfil
        </button>
      </div>
    </div>
  )

  return (
    <div className="bg-[#050508] min-h-screen text-white pb-32">
      <div className="p-4 pt-6 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 text-xl w-8 h-8 flex items-center justify-center">←</button>
        <h1 className="text-xl font-black">Hazte Premium</h1>
      </div>

      <div className="px-4 mb-6">
        <div className="relative bg-[#ccff00]/5 border border-[#ccff00]/20 rounded-3xl p-6 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#ccff00]/10 rounded-full blur-3xl" />
          <div className="relative">
            <div className="text-5xl mb-3">⚡</div>
            <h2 className="text-2xl font-black mb-1">LaminaX Premium</h2>
            <p className="text-gray-400 text-sm mb-4">Desbloquea todo el potencial del marketplace y vende más rápido.</p>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-black text-[#ccff00]">$2.990</span>
              <span className="text-gray-400 text-sm mb-1">/mes CLP</span>
            </div>
            <p className="text-gray-600 text-xs mt-1">Cancela cuando quieras</p>
          </div>
        </div>
      </div>

      <div className="px-4 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-3 border-b border-white/10">
            <div className="p-3 text-gray-500 text-xs font-bold">Función</div>
            <div className="p-3 text-center text-gray-400 text-xs font-bold border-l border-white/10">Free</div>
            <div className="p-3 text-center text-[#ccff00] text-xs font-bold border-l border-white/10">Premium</div>
          </div>
          {[
            { label: 'Publicaciones', free: '10 activas', premium: 'Ilimitadas' },
            { label: 'Remates', free: 'Solo participar', premium: 'Crear + participar' },
            { label: 'Boost mensual', free: '—', premium: '1 gratis' },
            { label: 'Badge verificado', free: '—', premium: '✅' },
            { label: 'Historial', free: '30 días', premium: 'Completo' },
            { label: 'Estadísticas', free: 'Básicas', premium: 'Completas' },
          ].map((row, i) => (
            <div key={i} className="grid grid-cols-3 border-b border-white/5 last:border-0">
              <div className="p-3 text-gray-400 text-xs">{row.label}</div>
              <div className="p-3 text-center text-gray-600 text-xs border-l border-white/10">{row.free}</div>
              <div className="p-3 text-center text-[#ccff00] text-xs font-bold border-l border-white/10">{row.premium}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 mb-6">
        <h3 className="text-sm font-black text-gray-400 mb-3 uppercase tracking-wider">Todo lo que incluye</h3>
        <div className="flex flex-col gap-3">
          {BENEFICIOS.map((b, i) => (
            <div key={i} className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-2xl p-4">
              <span className="text-2xl">{b.icon}</span>
              <div>
                <div className="font-bold text-sm">{b.titulo}</div>
                <div className="text-gray-500 text-xs mt-0.5">{b.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="mx-4 mb-4 bg-red-500/10 border border-red-500/30 rounded-2xl p-3 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#050508]/95 backdrop-blur-sm border-t border-white/10">
        <button
          onClick={iniciarPago}
          disabled={paying}
          className="w-full bg-[#ccff00] text-black font-black py-4 rounded-2xl text-lg disabled:opacity-50"
        >
          {paying ? 'Redirigiendo a Flow...' : 'Activar Premium — $2.990/mes'}
        </button>
        <p className="text-center text-gray-600 text-xs mt-2">Pago seguro vía Flow · Cancela cuando quieras</p>
      </div>
    </div>
  )
}
