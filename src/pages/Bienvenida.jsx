import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const PASOS = [
  {
    emoji: '🏆',
    titulo: 'Bienvenido a LaminaX',
    descripcion: 'El mercado P2P de láminas del Mundial 2026. Compra, vende e intercambia con otros coleccionistas.',
  },
  {
    emoji: '📋',
    titulo: 'Registra tu álbum',
    descripcion: 'Marca las láminas que tienes, las que te faltan y las repetidas. Todo en un grid visual.',
  },
  {
    emoji: '🔄',
    titulo: 'Intercambia y vende',
    descripcion: 'Publica tus repetidas para venta directa, intercambio o remate. El precio lo pones tú.',
  },
  {
    emoji: '🛡️',
    titulo: 'Pagos protegidos',
    descripcion: 'Tu dinero queda retenido hasta confirmar la recepción. Si algo falla, te devolvemos el pago.',
  },
]

export default function Bienvenida() {
  const [paso, setPaso] = useState(0)
  const navigate = useNavigate()
  const { user } = useAuth()

  async function terminar() {
    await supabase.from('users').update({ bio: 'onboarded' }).eq('id', user.id)
    navigate('/')
  }

  const actual = PASOS[paso]
  const esUltimo = paso === PASOS.length - 1

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-between px-6 py-12 text-white">

      {/* Skip */}
      <div className="w-full flex justify-end">
        <button onClick={terminar} className="text-[#6b6b80] text-sm font-bold">
          Saltar
        </button>
      </div>

      {/* Contenido */}
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
        <div className="text-8xl mb-4">{actual.emoji}</div>
        <h1 className="text-3xl font-black leading-tight">{actual.titulo}</h1>
        <p className="text-[#8b8b9a] text-base leading-relaxed max-w-xs">{actual.descripcion}</p>
      </div>

      {/* Dots indicadores */}
      <div className="flex gap-2 mb-8">
        {PASOS.map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-300 ${
              i === paso ? 'w-6 h-2 bg-[#ccff00]' : 'w-2 h-2 bg-[#2a2a38]'
            }`}
          />
        ))}
      </div>

      {/* Botón */}
      <button
        onClick={() => esUltimo ? terminar() : setPaso(p => p + 1)}
        className="w-full bg-[#ccff00] text-black font-black py-4 rounded-2xl text-lg"
      >
        {esUltimo ? '¡Empezar!' : 'Siguiente →'}
      </button>
    </div>
  )
}
