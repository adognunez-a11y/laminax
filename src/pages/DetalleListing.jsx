import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useParams, useNavigate } from 'react-router-dom'

export default function DetalleListing() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [listing, setListing] = useState(null)
  const [demanda, setDemanda] = useState(null)
  const [loading, setLoading] = useState(true)
  const [comprando, setComprando] = useState(false)

  useEffect(() => { cargarListing() }, [id])

  async function cargarListing() {
    const { data } = await supabase
      .from('listings')
      .select('*, laminas(id, number, name, is_rare, is_special), users(id, username, total_sales)')
      .eq('id', id)
      .single()
    setListing(data)

    if (data?.lamina_id) {
      const { data: buscan } = await supabase.from('user_laminas').select('count', { count: 'exact' }).eq('lamina_id', data.lamina_id).eq('quantity_needed', 1)
      const { data: ofrecen } = await supabase.from('user_laminas').select('count', { count: 'exact' }).eq('lamina_id', data.lamina_id).gte('quantity_owned', 2)
      const buscanCount = buscan?.length || 0
      const ofrecenCount = ofrecen?.length || 0
      const indice = ofrecenCount > 0 ? (buscanCount / ofrecenCount).toFixed(1) : buscanCount > 0 ? '∞' : '0'
      setDemanda({ buscan: buscanCount, ofrecen: ofrecenCount, indice })
    }
    setLoading(false)
  }

  async function comprar() {
    if (listing.seller_id === user.id) return alert('No puedes comprar tu propia lámina')
    setComprando(true)
    const { error } = await supabase.from('transactions').insert({
      listing_id: listing.id,
      seller_id: listing.seller_id,
      buyer_id: user.id,
      lamina_id: listing.lamina_id,
      amount: listing.price,
      platform_fee: Math.round(listing.price * 0.07),
      status: 'pending',
    })
    if (error) alert('Error: ' + error.message)
    else {
      await supabase.from('listings').update({ status: 'reserved' }).eq('id', listing.id)
      alert('Compra iniciada! Ve a Intercambios.')
      navigate('/explorar')
    }
    setComprando(false)
  }

  if (loading) return <div className="flex items-center justify-center h-screen bg-[#050508]"><div className="text-[#ccff00]">Cargando...</div></div>
  if (!listing) return <div className="flex items-center justify-center h-screen bg-[#050508]"><div className="text-gray-400">No encontrado</div></div>

  const esMio = listing.seller_id === user.id
  const indiceNum = parseFloat(demanda?.indice) || 0
  const escasezColor = indiceNum >= 5 ? 'text-red-400' : indiceNum >= 2 ? 'text-orange-400' : 'text-green-400'
  const escasezLabel = indiceNum >= 5 ? 'Muy alta 🔥' : indiceNum >= 2 ? 'Alta' : 'Normal'

  return (
    <div className="bg-[#050508] min-h-screen text-white">
      <div className="bg-[#0a0a0f]/80 border-b border-white/5 p-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center text-gray-400">←</button>
        <h1 className="text-lg font-bold">Detalle</h1>
      </div>

      <div className="p-8 flex flex-col items-center">
        <div className={`w-28 h-28 rounded-3xl flex items-center justify-center text-5xl font-black mb-4 ${
          listing.laminas?.is_rare ? 'bg-[#ccff00]/10 border border-[#ccff00]/40 text-[#ccff00] rare-glow' : 'bg-white/5 border border-white/10 text-gray-300'
        }`}>
          {listing.laminas?.number}
        </div>
        <h2 className="text-2xl font-black text-center">{listing.laminas?.name}</h2>
        {listing.laminas?.is_rare && <span className="mt-2 bg-[#ccff00]/20 text-[#ccff00] text-xs px-3 py-1 rounded-full border border-[#ccff00]/30 font-bold">⭐ Lámina especial</span>}
      </div>

      <div className="px-4 flex flex-col gap-3 pb-64">
        <div className="glass-card p-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-gray-500 text-xs mb-1">Tipo</div>
              <div className={`text-sm font-black px-3 py-1 rounded-full inline-block ${
                listing.mode === 'subasta' ? 'bg-orange-500/20 text-orange-400' :
                listing.mode === 'venta' ? 'bg-green-500/20 text-green-400' :
                'bg-blue-500/20 text-blue-400'
              }`}>
                {listing.mode === 'subasta' ? '🔥 Remate' : listing.mode === 'venta' ? '💰 Venta' : '🔄 Intercambio'}
              </div>
            </div>
            {listing.price && (
              <div className="text-right">
                <div className="text-gray-500 text-xs mb-1">Precio</div>
                <div className="text-green-400 text-3xl font-black">${listing.price?.toLocaleString('es-CL')}</div>
              </div>
            )}
          </div>
        </div>

        {demanda && (
          <div className="glass-card p-4">
            <div className="text-gray-500 text-xs mb-3 font-bold uppercase tracking-wider">Índice de demanda</div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="text-center">
                <div className="text-white text-xl font-black">{demanda.buscan}</div>
                <div className="text-gray-500 text-xs">La buscan</div>
              </div>
              <div className="text-center">
                <div className="text-white text-xl font-black">{demanda.ofrecen}</div>
                <div className="text-gray-500 text-xs">La ofrecen</div>
              </div>
              <div className="text-center">
                <div className={`text-xl font-black ${escasezColor}`}>{demanda.indice}×</div>
                <div className="text-gray-500 text-xs">Escasez</div>
              </div>
            </div>
            <div className="flex justify-between items-center mb-2">
              <div className="text-xs text-gray-500">Nivel de escasez</div>
              <div className={`text-xs font-bold ${escasezColor}`}>{escasezLabel}</div>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${indiceNum >= 5 ? 'bg-red-400' : indiceNum >= 2 ? 'bg-orange-400' : 'bg-green-400'}`} style={{ width: `${Math.min((indiceNum / 10) * 100, 100)}%` }}/>
            </div>
          </div>
        )}

        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-11 h-11 bg-[#ccff00] rounded-full flex items-center justify-center text-black font-black text-lg">
            {listing.users?.username?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="font-bold">@{listing.users?.username}</div>
            <div className="text-gray-500 text-sm">{listing.users?.total_sales} ventas completadas</div>
          </div>
          {esMio && <span className="bg-blue-900/50 text-blue-300 text-xs px-2 py-1 rounded-full border border-blue-800">Tuya</span>}
        </div>

        {listing.mode === 'venta' && listing.price && (
          <div className="glass-card p-4">
            <div className="text-gray-500 text-xs mb-3 font-bold uppercase tracking-wider">Desglose</div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Precio lámina</span>
              <span className="font-bold">${listing.price?.toLocaleString('es-CL')}</span>
            </div>
            <div className="flex justify-between text-sm mb-3">
              <span className="text-gray-400">Comisión plataforma (7%)</span>
              <span className="text-red-400 font-bold">-${Math.round(listing.price * 0.07).toLocaleString('es-CL')}</span>
            </div>
            <div className="border-t border-white/5 pt-3 flex justify-between font-black">
              <span>Vendedor recibe</span>
              <span className="text-green-400">${Math.round(listing.price * 0.93).toLocaleString('es-CL')}</span>
            </div>
          </div>
        )}
      </div>

      {/* CTAs fijos abajo */}
      {!esMio && listing.status === 'active' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#050508]/95 backdrop-blur-xl border-t border-white/5 flex flex-col gap-2">
          <button onClick={comprar} disabled={comprando} className="w-full bg-[#ccff00] text-black font-black py-4 rounded-2xl text-lg disabled:opacity-50">
            {comprando ? 'Procesando...' : listing.mode === 'intercambio' ? '🔄 Proponer intercambio' : '🛒 Comprar ahora'}
          </button>
          <button onClick={() => navigate(`/chat/${listing.seller_id}`)} className="w-full bg-white/5 text-white font-bold py-3 rounded-2xl border border-white/10">
            💬 Chatear con vendedor
          </button>
        </div>
      )}

      {esMio && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#050508]/95 backdrop-blur-xl border-t border-white/5">
          <button onClick={async () => { await supabase.from('listings').update({ status: 'cancelled' }).eq('id', listing.id); navigate('/explorar') }} className="w-full bg-red-900/30 text-red-400 font-bold py-4 rounded-2xl border border-red-800">
            Cancelar publicación
          </button>
        </div>
      )}
    </div>
  )
}
