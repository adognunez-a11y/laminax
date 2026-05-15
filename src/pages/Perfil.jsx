import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useSubscription } from '../hooks/useSubscription'
import { useState, useEffect } from 'react'

export default function Perfil() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { isPremium } = useSubscription()
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { cargarPerfil() }, [])

  async function cargarPerfil() {
    const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
    setPerfil(data)
    setLoading(false)
  }

  async function cerrarSesion() {
    await signOut()
    navigate('/login')
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#050508]">
      <div className="text-[#ccff00]">Cargando...</div>
    </div>
  )

  return (
    <div className="bg-[#050508] min-h-screen text-white pb-24">
      {/* Avatar y datos */}
      <div className="p-6 flex flex-col items-center border-b border-white/5">
        <div className="relative mb-3">
          <div className="w-20 h-20 bg-[#ccff00] rounded-full flex items-center justify-center text-black text-3xl font-black">
            {perfil?.username?.[0]?.toUpperCase()}
          </div>
          {isPremium && (
            <div className="absolute -bottom-1 -right-1 bg-[#ccff00] text-black text-xs font-black px-1.5 py-0.5 rounded-full">
              ⚡
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-black">@{perfil?.username}</h1>
          {isPremium && (
            <span className="bg-[#ccff00]/10 border border-[#ccff00]/30 text-[#ccff00] text-xs font-bold px-2 py-0.5 rounded-full">
              Premium
            </span>
          )}
        </div>
        {perfil?.full_name && <p className="text-gray-400 text-sm mt-1">{perfil.full_name}</p>}
        <p className="text-gray-600 text-xs mt-1">{user.email}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 p-4">
        <div className="glass-card p-4 text-center">
          <div className="text-green-400 text-2xl font-black">{perfil?.total_sales || 0}</div>
          <div className="text-gray-500 text-xs mt-1">Ventas completadas</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-blue-400 text-2xl font-black">{perfil?.total_purchases || 0}</div>
          <div className="text-gray-500 text-xs mt-1">Compras realizadas</div>
        </div>
      </div>

      <div className="px-4 flex flex-col gap-3">
        {/* Banner Premium / Free */}
        {isPremium ? (
          <div className="bg-[#ccff00]/5 border border-[#ccff00]/20 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚡</span>
              <div>
                <div className="font-black text-[#ccff00] text-sm">Plan Premium activo</div>
                <div className="text-gray-500 text-xs">Publicaciones ilimitadas y más</div>
              </div>
            </div>
            <button
              onClick={() => navigate('/upgrade')}
              className="text-gray-500 text-xs underline"
            >
              Ver plan
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate('/upgrade')}
            className="w-full bg-[#ccff00]/10 border border-[#ccff00]/30 rounded-2xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚡</span>
              <div className="text-left">
                <div className="font-black text-[#ccff00] text-sm">Hazte Premium</div>
                <div className="text-gray-500 text-xs">Publicaciones ilimitadas · Remates · Boosts</div>
              </div>
            </div>
            <span className="text-[#ccff00] font-black text-sm">$2.990 →</span>
          </button>
        )}

        {/* Miembro desde */}
        <div className="glass-card p-4">
          <div className="text-gray-500 text-xs mb-1">Miembro desde</div>
          <div className="font-bold">
            {perfil?.created_at
              ? new Date(perfil.created_at).toLocaleDateString('es-CL', { year: 'numeric', month: 'long' })
              : '—'}
          </div>
        </div>

        {perfil?.is_verified && (
          <div className="bg-green-900/20 border border-green-800/50 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <div className="font-bold text-green-400">Usuario verificado</div>
              <div className="text-gray-500 text-xs">RUT confirmado</div>
            </div>
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="px-4 mt-4 flex flex-col gap-3">
        <button onClick={() => navigate('/editar-perfil')} className="w-full glass-card text-white font-bold py-4 rounded-2xl flex items-center justify-between px-5">
          <span>✏️ Editar perfil</span>
          <span className="text-gray-500">→</span>
        </button>
        <button onClick={() => navigate('/transacciones')} className="w-full glass-card text-white font-bold py-4 rounded-2xl flex items-center justify-between px-5">
          <span>🔄 Mis intercambios</span>
          <span className="text-gray-500">→</span>
        </button>
        <button onClick={() => navigate('/nuevo')} className="w-full glass-card text-white font-bold py-4 rounded-2xl flex items-center justify-between px-5">
          <span>📢 Publicar lámina</span>
          <span className="text-gray-500">→</span>
        </button>
        <button onClick={() => navigate('/terminos')} className="w-full glass-card text-white font-bold py-4 rounded-2xl flex items-center justify-between px-5">
          <span>📄 Términos y Privacidad</span>
          <span className="text-gray-500">→</span>
        </button>
        <button onClick={cerrarSesion} className="w-full bg-red-900/20 border border-red-800/50 text-red-400 font-bold py-4 rounded-2xl mt-2">
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
