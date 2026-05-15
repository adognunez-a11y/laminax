import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export default function Inicio() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [perfil, setPerfil] = useState(null)
  const [remates, setRemates] = useState([])
  const [recientes, setRecientes] = useState([])
  const [stats, setStats] = useState({ tengo: 0, faltan: 980, repetidas: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => { cargarDatos() }, [])

  async function cargarDatos() {
    const { data: p } = await supabase.from('users').select('*').eq('id', user.id).single()
    setPerfil(p)

    if (!p?.bio) {
      navigate('/bienvenida')
      return
    }

    const { data: ul } = await supabase.from('user_laminas').select('*').eq('user_id', user.id)
    const tengo = ul?.filter(u => u.quantity_owned >= 1).length || 0
    const repetidas = ul?.filter(u => u.quantity_owned >= 2).length || 0
    setStats({ tengo, faltan: 980 - tengo, repetidas })

    const { data: rem } = await supabase
      .from('listings')
      .select('*, laminas(number, name, is_rare), users(username)')
      .eq('mode', 'subasta')
      .eq('status', 'active')
      .limit(3)
    setRemates(rem || [])

    const { data: rec } = await supabase
      .from('listings')
      .select('*, laminas(number, name), users(username)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5)
    setRecientes(rec || [])

    setLoading(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#0a0a0f]">
      <div className="text-[#ccff00]">Cargando...</div>
    </div>
  )

  const progreso = Math.round((stats.tengo / 980) * 100)

  return (
    <div className="bg-[#0a0a0f] min-h-screen text-white pb-24">

      <div className="px-4 pt-6 pb-2 flex items-center justify-between">
        <div>
          <div className="text-[#6b6b80] text-xs uppercase tracking-widest">Hola 👋</div>
          <div className="text-xl font-black text-white">@{perfil?.username}</div>
        </div>
        <div onClick={() => navigate('/perfil')} className="w-10 h-10 bg-[#ccff00] rounded-full flex items-center justify-center text-black font-black cursor-pointer">
          {perfil?.username?.[0]?.toUpperCase()}
        </div>
      </div>

      <div className="mx-4 mt-3 bg-gradient-to-br from-[#1a1200] to-[#2d1f00] rounded-2xl p-4 border border-[#3d2e00] relative overflow-hidden cursor-pointer" onClick={() => navigate('/album')}>
        <div className="absolute right-2 bottom-0 text-5xl opacity-10">⚽</div>
        <div className="text-[#ccff00]/60 text-xs mb-1">FIFA World Cup 2026 · Panini</div>
        <div className="flex justify-between items-center mb-2">
          <div className="text-white font-black text-lg">Mi Álbum</div>
          <div className="text-[#ccff00] font-black">{progreso}%</div>
        </div>
        <div className="h-1.5 bg-black/30 rounded-full overflow-hidden mb-3">
          <div className="h-full bg-gradient-to-r from-[#ccff00] to-[#ff6b35] rounded-full" style={{ width: `${progreso}%` }} />
        </div>
        <div className="flex gap-4 text-xs">
          <span className="text-green-400 font-bold">✓ {stats.tengo} tengo</span>
          <span className="text-red-400 font-bold">✗ {stats.faltan} faltan</span>
          <span className="text-[#ccff00] font-bold">× {stats.repetidas} repetidas</span>
        </div>
      </div>

      {remates.length > 0 && (
        <div className="mt-5 px-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs font-black uppercase tracking-wider text-white">Remates en vivo</span>
            </div>
            <button onClick={() => navigate('/explorar')} className="text-[#ccff00] text-xs font-bold">Ver todos →</button>
          </div>
          <div className="flex flex-col gap-2">
            {remates.map(r => (
              <div key={r.id} onClick={() => navigate(`/listing/${r.id}`)} className="bg-gradient-to-r from-[#1a0f00] to-[#13131a] border border-[#3d2e00] rounded-2xl p-3 flex items-center gap-3 cursor-pointer">
                <div className="w-12 h-12 bg-[#2a1f00] rounded-xl flex items-center justify-center text-[#ccff00] font-black text-lg flex-shrink-0">{r.laminas?.number}</div>
                <div className="flex-1">
                  <div className="font-bold text-sm">{r.laminas?.name}</div>
                  <div className="text-[#6b6b80] text-xs">@{r.users?.username}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-green-400 font-black text-sm">${r.price?.toLocaleString('es-CL')}</div>
                  <div className="text-orange-400 text-xs font-bold">🔥 Remate</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 px-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-black uppercase tracking-wider text-white">Disponibles ahora</span>
          <button onClick={() => navigate('/explorar')} className="text-[#ccff00] text-xs font-bold">Ver todo →</button>
        </div>
        {recientes.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-3xl mb-2">📭</div>
            <div className="text-[#4a4a5a] text-sm">No hay láminas publicadas aún</div>
            <button onClick={() => navigate('/nuevo')} className="mt-4 bg-[#ccff00] text-black font-black px-5 py-2.5 rounded-xl text-sm">Publicar primera lámina</button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recientes.map(r => (
              <div key={r.id} onClick={() => navigate(`/listing/${r.id}`)} className="glass-card p-3 flex items-center gap-3 cursor-pointer">
                <div className="w-10 h-10 bg-[#1c1c26] rounded-xl flex items-center justify-center text-[#ccff00] font-black flex-shrink-0">{r.laminas?.number}</div>
                <div className="flex-1">
                  <div className="font-bold text-sm">{r.laminas?.name}</div>
                  <div className="text-[#6b6b80] text-xs">@{r.users?.username}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  {r.price ? <div className="text-green-400 font-black text-sm">${r.price?.toLocaleString('es-CL')}</div> : <div className="text-blue-400 text-xs font-bold">Intercambio</div>}
                  <div className={`text-xs font-bold mt-0.5 ${r.mode === 'subasta' ? 'text-orange-400' : r.mode === 'venta' ? 'text-green-400' : 'text-blue-400'}`}>
                    {r.mode === 'subasta' ? '🔥 Remate' : r.mode === 'venta' ? 'Venta' : '🔄 Cambio'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 px-4">
        <div className="text-xs font-black uppercase tracking-wider text-white mb-3">Acciones rápidas</div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => navigate('/album')} className="glass-card p-4 text-left">
            <div className="text-2xl mb-1">📋</div>
            <div className="font-bold text-sm">Mi Álbum</div>
            <div className="text-[#6b6b80] text-xs">Marcar láminas</div>
          </button>
          <button onClick={() => navigate('/nuevo')} className="glass-card p-4 text-left">
            <div className="text-2xl mb-1">📢</div>
            <div className="font-bold text-sm">Publicar</div>
            <div className="text-[#6b6b80] text-xs">Vender repetidas</div>
          </button>
          <button onClick={() => navigate('/explorar')} className="glass-card p-4 text-left">
            <div className="text-2xl mb-1">🔍</div>
            <div className="font-bold text-sm">Explorar</div>
            <div className="text-[#6b6b80] text-xs">Ver el mercado</div>
          </button>
          <button onClick={() => navigate('/transacciones')} className="glass-card p-4 text-left">
            <div className="text-2xl mb-1">🔄</div>
            <div className="font-bold text-sm">Intercambios</div>
            <div className="text-[#6b6b80] text-xs">Ver transacciones</div>
          </button>
        </div>
      </div>

    </div>
  )
}
