import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

const MODOS = [
  { key: 'todos',       label: 'Todo' },
  { key: 'subasta',     label: '🔥 Remates' },
  { key: 'venta',       label: '💰 Venta' },
  { key: 'intercambio', label: '🔄 Intercambio' },
]

const CIUDADES_CHILE = [
  'Arica', 'Iquique', 'Antofagasta', 'Calama', 'Copiapó', 'La Serena', 'Coquimbo',
  'Valparaíso', 'Viña del Mar', 'Quilpué', 'San Antonio',
  'Santiago', 'Puente Alto', 'Maipú', 'La Florida', 'Las Condes', 'Ñuñoa',
  'Providencia', 'Quilicura', 'San Bernardo', 'Pudahuel',
  'Rancagua', 'Curicó', 'Talca', 'Linares', 'Chillán',
  'Concepción', 'Talcahuano', 'Los Ángeles', 'Coronel',
  'Temuco', 'Padre Las Casas', 'Valdivia', 'Osorno', 'Puerto Montt',
  'Castro', 'Coyhaique', 'Punta Arenas',
]

export default function Explorar() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [filtroCiudad, setFiltroCiudad] = useState('')
  const [miCiudad, setMiCiudad] = useState('')
  const [showCiudadFilter, setShowCiudadFilter] = useState(false)

  useEffect(() => {
    cargarMiCiudad()
    cargarListings()
  }, [filtro])

  async function cargarMiCiudad() {
    const { data } = await supabase.from('users').select('ciudad').eq('id', user.id).single()
    if (data?.ciudad) setMiCiudad(data.ciudad)
  }

  async function cargarListings() {
    setLoading(true)
    let query = supabase
      .from('listings')
      .select('*, laminas(id, number, name, code, section, team, is_rare, is_special), users(id, username, total_sales, ciudad)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    if (filtro !== 'todos') query = query.eq('mode', filtro)
    const { data } = await query
    setListings(data || [])
    setLoading(false)
  }

  // Ordenar: boosteados primero, luego el resto
  const listingsOrdenados = [...(listings || [])].sort((a, b) => {
    const aBoost = a.boosted_until && new Date(a.boosted_until) > new Date()
    const bBoost = b.boosted_until && new Date(b.boosted_until) > new Date()
    if (aBoost && !bBoost) return -1
    if (!aBoost && bBoost) return 1
    return 0
  })

  const listingsFiltrados = listingsOrdenados.filter(l => {
    const b = busqueda.toLowerCase()
    const matchBusqueda = !busqueda ||
      l.laminas?.number?.toString().includes(busqueda) ||
      l.laminas?.code?.toLowerCase().includes(b) ||
      l.laminas?.name?.toLowerCase().includes(b) ||
      l.laminas?.team?.toLowerCase().includes(b) ||
      l.laminas?.section?.toLowerCase().includes(b)
    const matchCiudad = !filtroCiudad || l.users?.ciudad === filtroCiudad
    return matchBusqueda && matchCiudad
  })

  const boostedCount = listingsOrdenados.filter(l => l.boosted_until && new Date(l.boosted_until) > new Date()).length

  return (
    <div className="bg-[#050508] min-h-screen text-white pb-24">
      <div className="p-4 pb-2">
        <h1 className="text-2xl font-black">Mercado</h1>
        <p className="text-gray-500 text-sm">
          Mundial 2026 · {listingsFiltrados.length} publicaciones
          {boostedCount > 0 && <span className="text-[#ccff00] ml-2">· ⚡ {boostedCount} destacadas</span>}
        </p>
      </div>

      {/* Búsqueda */}
      <div className="px-4 mb-3">
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="🔍 Buscar por código (ARG5), selección, nombre..."
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#ccff00] text-sm"
        />
      </div>

      {/* Filtros modo + ciudad */}
      <div className="px-4 mb-3 flex gap-2 overflow-x-auto pb-1">
        {MODOS.map(m => (
          <button
            key={m.key}
            onClick={() => setFiltro(m.key)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              filtro === m.key ? 'bg-[#ccff00] text-black' : 'bg-white/5 text-gray-400 border border-white/10'
            }`}
          >
            {m.label}
          </button>
        ))}
        <button
          onClick={() => setShowCiudadFilter(v => !v)}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
            filtroCiudad ? 'bg-[#ccff00] text-black' : 'bg-white/5 text-gray-400 border border-white/10'
          }`}
        >
          📍 {filtroCiudad || 'Ciudad'}
        </button>
      </div>

      {/* Selector de ciudad */}
      {showCiudadFilter && (
        <div className="px-4 mb-3">
          <div className="bg-[#13131a] border border-[#2a2a38] rounded-2xl p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-gray-400">Filtrar por ciudad</span>
              {filtroCiudad && (
                <button onClick={() => { setFiltroCiudad(''); setShowCiudadFilter(false) }} className="text-[#ccff00] text-xs font-bold">
                  Limpiar
                </button>
              )}
            </div>
            {/* Mi ciudad primero si la tengo */}
            {miCiudad && (
              <button
                onClick={() => { setFiltroCiudad(miCiudad); setShowCiudadFilter(false) }}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                  filtroCiudad === miCiudad ? 'bg-[#ccff00] text-black' : 'bg-white/5 text-white'
                }`}
              >
                📍 Mi ciudad ({miCiudad})
              </button>
            )}
            <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">
              {CIUDADES_CHILE.filter(c => c !== miCiudad).map(ciudad => (
                <button
                  key={ciudad}
                  onClick={() => { setFiltroCiudad(ciudad); setShowCiudadFilter(false) }}
                  className={`text-left px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    filtroCiudad === ciudad ? 'bg-[#ccff00] text-black' : 'bg-white/5 text-gray-400'
                  }`}
                >
                  {ciudad}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Banner ciudad activa */}
      {filtroCiudad && (
        <div className="mx-4 mb-3 bg-[#ccff00]/5 border border-[#ccff00]/20 rounded-2xl px-4 py-2 flex items-center justify-between">
          <span className="text-[#ccff00] text-xs font-bold">📍 Mostrando en {filtroCiudad}</span>
          <button onClick={() => setFiltroCiudad('')} className="text-gray-500 text-xs">✕ Quitar</button>
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-600 mt-20"><div className="text-3xl mb-2">⏳</div><div>Cargando...</div></div>
      ) : listingsFiltrados.length === 0 ? (
        <div className="text-center mt-20">
          <div className="text-4xl mb-3">📭</div>
          <div className="text-gray-400 font-bold">
            {filtroCiudad ? `No hay láminas en ${filtroCiudad}` : 'No hay láminas disponibles'}
          </div>
          <div className="text-gray-600 text-sm mt-1">
            {filtroCiudad ? 'Prueba sin filtro de ciudad' : 'Sé el primero en publicar'}
          </div>
          {filtroCiudad ? (
            <button onClick={() => setFiltroCiudad('')} className="mt-6 bg-white/5 text-white font-bold px-6 py-3 rounded-2xl text-sm border border-white/10">
              Ver todas las ciudades
            </button>
          ) : (
            <button onClick={() => navigate('/nuevo')} className="mt-6 bg-[#ccff00] text-black font-black px-6 py-3 rounded-2xl text-sm">
              Publicar lámina
            </button>
          )}
        </div>
      ) : (
        <div className="px-4 flex flex-col gap-3">
          {listingsFiltrados.map(listing => {
            const isBoosted = listing.boosted_until && new Date(listing.boosted_until) > new Date()
            return (
              <div
                key={listing.id}
                onClick={() => navigate(`/listing/${listing.id}`)}
                className="cursor-pointer relative"
                style={isBoosted ? {
                  background: 'rgba(204,255,0,0.04)',
                  border: '1px solid rgba(204,255,0,0.2)',
                  borderRadius: '16px', padding: '16px',
                } : {
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px', padding: '16px',
                }}
              >
                {isBoosted && (
                  <div className="absolute top-2 right-2 bg-[#ccff00]/20 text-[#ccff00] text-[9px] font-black px-2 py-0.5 rounded-full border border-[#ccff00]/30">
                    ⚡ DESTACADO
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 ${
                    isBoosted ? 'border border-[#ccff00]/30' :
                    listing.laminas?.is_rare ? 'bg-[#ccff00]/10 border border-[#ccff00]/30' : 'bg-white/5 border border-white/10'
                  }`} style={isBoosted ? { background: 'rgba(204,255,0,0.08)' } : {}}>
                    <span className={`text-xs font-black ${isBoosted || listing.laminas?.is_rare ? 'text-[#ccff00]' : 'text-gray-300'}`}>
                      {listing.laminas?.code || listing.laminas?.number}
                    </span>
                    {listing.laminas?.section && (
                      <span className="text-[9px] text-gray-600 mt-0.5">{listing.laminas.section}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-sm truncate">{listing.laminas?.name}</span>
                      {listing.laminas?.is_rare && <span className="text-[#ccff00] text-xs flex-shrink-0">⭐</span>}
                    </div>
                    {listing.laminas?.team && <div className="text-gray-500 text-xs mb-1">{listing.laminas.team}</div>}
                    <div className="flex items-center gap-2 flex-wrap">
                      {listing.mode === 'subasta' && <span className="bg-orange-500/20 text-orange-400 text-xs px-2 py-0.5 rounded-full border border-orange-500/30 font-bold">🔥 Remate</span>}
                      {listing.mode === 'venta' && <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full border border-green-500/30 font-bold">Venta</span>}
                      {listing.mode === 'intercambio' && <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded-full border border-blue-500/30 font-bold">Intercambio</span>}
                      {listing.price
                        ? <span className="text-green-400 font-black text-sm">${listing.price?.toLocaleString('es-CL')}</span>
                        : listing.mode === 'subasta' ? <span className="text-orange-400 text-xs font-bold">Sin mínimo</span> : null
                      }
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-gray-600 text-xs">@{listing.users?.username}</span>
                      {listing.users?.ciudad && (
                        <span className="text-gray-600 text-xs">· 📍 {listing.users.ciudad}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-gray-600 flex-shrink-0">→</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
