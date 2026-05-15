import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

const MODOS = [
  { key: 'todos', label: 'Todo' },
  { key: 'subasta', label: '🔥 Remates' },
  { key: 'venta', label: '💰 Venta' },
  { key: 'intercambio', label: '🔄 Intercambio' },
]

export default function Explorar() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('todos')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => { cargarListings() }, [filtro])

  async function cargarListings() {
    setLoading(true)
    let query = supabase
      .from('listings')
      .select('*, laminas(id, number, name, is_rare, is_special), users(id, username, total_sales)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    if (filtro !== 'todos') query = query.eq('mode', filtro)
    const { data } = await query
    setListings(data || [])
    setLoading(false)
  }

  const listingsFiltrados = listings.filter(l => {
    if (!busqueda) return true
    return l.laminas?.number?.toString().includes(busqueda) ||
           l.laminas?.name?.toLowerCase().includes(busqueda.toLowerCase())
  })

  return (
    <div className="bg-[#050508] min-h-screen text-white pb-24">
      <div className="p-4 pb-2">
        <h1 className="text-2xl font-black">Mercado</h1>
        <p className="text-gray-500 text-sm">Mundial 2026 · {listings.length} publicaciones</p>
      </div>

      <div className="px-4 mb-3">
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="🔍 Buscar lámina..."
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#ccff00] text-sm"
        />
      </div>

      <div className="flex gap-2 px-4 mb-4 overflow-x-auto pb-1">
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
      </div>

      {loading ? (
        <div className="text-center text-gray-600 mt-20">
          <div className="text-3xl mb-2">⏳</div>
          <div>Cargando...</div>
        </div>
      ) : listingsFiltrados.length === 0 ? (
        <div className="text-center mt-20">
          <div className="text-4xl mb-3">📭</div>
          <div className="text-gray-400 font-bold">No hay láminas disponibles</div>
          <div className="text-gray-600 text-sm mt-1">Sé el primero en publicar</div>
          <button onClick={() => navigate('/nuevo')} className="mt-6 bg-[#ccff00] text-black font-black px-6 py-3 rounded-2xl text-sm">
            Publicar lámina
          </button>
        </div>
      ) : (
        <div className="px-4 flex flex-col gap-3">
          {listingsFiltrados.map(listing => (
            <div
              key={listing.id}
              onClick={() => navigate(`/listing/${listing.id}`)}
              className="glass-card p-4 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black flex-shrink-0 ${
                  listing.laminas?.is_rare ? 'bg-[#ccff00]/10 text-[#ccff00] border border-[#ccff00]/30' : 'bg-white/5 text-gray-300'
                }`}>
                  {listing.laminas?.number}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm truncate">{listing.laminas?.name}</span>
                    {listing.laminas?.is_rare && <span className="text-[#ccff00] text-xs flex-shrink-0">⭐</span>}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {listing.mode === 'subasta' && <span className="bg-orange-500/20 text-orange-400 text-xs px-2 py-0.5 rounded-full border border-orange-500/30 font-bold">🔥 Remate</span>}
                    {listing.mode === 'venta' && <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full border border-green-500/30 font-bold">Venta</span>}
                    {listing.mode === 'intercambio' && <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded-full border border-blue-500/30 font-bold">Intercambio</span>}
                    {listing.price
                      ? <span className="text-green-400 font-black text-sm">${listing.price?.toLocaleString('es-CL')}</span>
                      : listing.mode === 'subasta'
                        ? <span className="text-orange-400 text-xs font-bold">Sin mínimo</span>
                        : null
                    }
                  </div>
                  <div className="text-gray-600 text-xs mt-1">@{listing.users?.username}</div>
                </div>
                <div className="text-gray-600 flex-shrink-0">→</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
