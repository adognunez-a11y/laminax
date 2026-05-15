import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

const ESTADOS = {
  falta:    { color: 'bg-[#1c1c26] border border-[#2a2a38] text-[#4a4a5a]' },
  tengo:    { color: 'bg-green-900/40 border border-green-700/40 text-green-400' },
  repetida: { color: 'bg-yellow-900/40 border border-yellow-600/40 text-yellow-400' },
}

export default function MiAlbum() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [laminas, setLaminas] = useState([])
  const [userLaminas, setUserLaminas] = useState({})
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')

  useEffect(() => { cargarDatos() }, [])

  async function cargarDatos() {
    const { data: lams } = await supabase.from('laminas').select('*').order('number', { ascending: true })
    const { data: userLams } = await supabase.from('user_laminas').select('*').eq('user_id', user.id)
    const mapa = {}
    userLams?.forEach(ul => { mapa[ul.lamina_id] = ul })
    setLaminas(lams || [])
    setUserLaminas(mapa)
    setLoading(false)
  }

  async function toggleEstado(lamina, e) {
    e.preventDefault()
    e.stopPropagation()
    const ul = userLaminas[lamina.id]
    const actual = !ul ? 'falta' : ul.quantity_owned >= 2 ? 'repetida' : ul.quantity_owned === 1 ? 'tengo' : 'falta'
    const siguiente = actual === 'falta' ? 'tengo' : actual === 'tengo' ? 'repetida' : 'falta'
    const { data } = await supabase.from('user_laminas').upsert({
      user_id: user.id, lamina_id: lamina.id,
      quantity_owned: siguiente === 'falta' ? 0 : siguiente === 'tengo' ? 1 : 2,
      quantity_needed: siguiente === 'falta' ? 1 : 0,
    }, { onConflict: 'user_id,lamina_id' }).select().single()
    if (data) setUserLaminas(prev => ({ ...prev, [lamina.id]: data }))
  }

  function getEstado(lamina) {
    const ul = userLaminas[lamina.id]
    if (!ul || ul.quantity_owned === 0) return 'falta'
    if (ul.quantity_owned >= 2) return 'repetida'
    return 'tengo'
  }

  const laminasFiltradas = useMemo(() => {
    return laminas.filter(l => {
      const matchBusqueda = busqueda === '' ||
        l.number.toString().includes(busqueda) ||
        l.name.toLowerCase().includes(busqueda.toLowerCase())
      const estado = getEstado(l)
      const matchEstado = filtroEstado === 'todos' || estado === filtroEstado
      return matchBusqueda && matchEstado
    })
  }, [laminas, userLaminas, busqueda, filtroEstado])

  const tengo = Object.values(userLaminas).filter(ul => ul.quantity_owned >= 1).length
  const repetidas = Object.values(userLaminas).filter(ul => ul.quantity_owned >= 2).length
  const progreso = Math.round((tengo / 980) * 100)

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#0a0a0f]">
      <div className="text-[#ccff00] text-xl">Cargando álbum...</div>
    </div>
  )

  return (
    <div className="bg-[#0a0a0f] min-h-screen text-white pb-24">

      {/* Album card header */}
      <div className="mx-4 mt-4 mb-3 bg-gradient-to-br from-[#1a1200] to-[#2d1f00] rounded-2xl p-4 border border-[#3d2e00] relative overflow-hidden">
        <div className="absolute right-2 bottom-0 text-6xl opacity-10">⚽</div>
        <div className="text-[#ccff00] text-xs font-bold uppercase tracking-widest mb-1">Álbum activo</div>
        <div className="text-white text-lg font-black leading-tight">FIFA World Cup 2026</div>
        <div className="text-[#ccff00]/60 text-xs mb-3">Panini · 980 láminas · EE.UU · México · Canadá</div>
        <div className="flex justify-between text-xs text-white/50 mb-1.5">
          <span>Progreso</span>
          <span className="text-[#ccff00] font-bold">{tengo} / 980 · {progreso}%</span>
        </div>
        <div className="h-2 bg-black/30 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#ccff00] to-[#ff6b35] transition-all duration-500"
            style={{ width: `${progreso}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 px-4 mb-3">
        <div className="bg-[#13131a] rounded-2xl p-3 text-center border border-[#2a2a38]">
          <div className="text-green-400 text-2xl font-black">{tengo}</div>
          <div className="text-[#6b6b80] text-xs mt-0.5">Tengo</div>
        </div>
        <div className="bg-[#13131a] rounded-2xl p-3 text-center border border-[#2a2a38]">
          <div className="text-red-400 text-2xl font-black">{980 - tengo}</div>
          <div className="text-[#6b6b80] text-xs mt-0.5">Me faltan</div>
        </div>
        <div className="bg-[#13131a] rounded-2xl p-3 text-center border border-[#2a2a38]">
          <div className="text-[#ccff00] text-2xl font-black">{repetidas}</div>
          <div className="text-[#6b6b80] text-xs mt-0.5">Repetidas</div>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="px-4 mb-3">
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="🔍 Buscar por número..."
          className="w-full glass-card px-4 py-3 text-white placeholder-[#4a4a5a] focus:outline-none focus:border-[#ccff00] text-sm transition-colors"
        />
      </div>

      {/* Filtros */}
      <div className="flex gap-2 px-4 mb-3 overflow-x-auto pb-1">
        {[
          { key: 'todos', label: 'Todas', count: laminas.length },
          { key: 'falta', label: 'Me faltan', count: 980 - tengo },
          { key: 'tengo', label: 'Tengo', count: tengo - repetidas },
          { key: 'repetida', label: 'Repetidas', count: repetidas },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFiltroEstado(f.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              filtroEstado === f.key
                ? 'bg-[#ccff00] text-black'
                : 'bg-[#13131a] text-[#6b6b80] border border-[#2a2a38]'
            }`}
          >
            {f.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${filtroEstado === f.key ? 'bg-black/20' : 'bg-[#2a2a38]'}`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Botón publicar repetidas */}
      {repetidas > 0 && filtroEstado === 'repetida' && (
        <div className="px-4 mb-3">
          <button
            onClick={() => navigate('/nuevo')}
            className="w-full bg-[#ccff00] text-black font-black py-3 rounded-2xl text-sm"
          >
            📢 Publicar mis {repetidas} repetidas
          </button>
        </div>
      )}

      {/* Resultado búsqueda */}
      {busqueda && (
        <div className="px-4 mb-2 text-xs text-[#4a4a5a]">
          {laminasFiltradas.length} resultado{laminasFiltradas.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-8 gap-1 px-4">
        {laminasFiltradas.map(lamina => {
          const estado = getEstado(lamina)
          const { color } = ESTADOS[estado]
          return (
            <button
              key={lamina.id}
              onClick={(e) => toggleEstado(lamina, e)}
              className={`${color} rounded-lg text-xs font-bold aspect-square flex items-center justify-center transition-all active:scale-90`}
            >
              {lamina.number}
            </button>
          )
        })}
      </div>

      {laminasFiltradas.length === 0 && (
        <div className="text-center mt-20 text-[#4a4a5a]">
          <div className="text-4xl mb-2">🔍</div>
          <div>No se encontraron láminas</div>
        </div>
      )}
    </div>
  )
}
