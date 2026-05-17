import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useSubscription } from '../hooks/useSubscription'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'

function getBoostTier(scarcityIndex) {
  if (scarcityIndex <= 33) return { tier: 'Bronce', price: 490, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' }
  if (scarcityIndex <= 66) return { tier: 'Plata',  price: 690, color: 'text-gray-300',   bg: 'bg-gray-500/10 border-gray-500/20' }
  return { tier: 'Oro', price: 990, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' }
}

export default function DetalleListing() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { isPremium, subscription } = useSubscription()
  const navigate = useNavigate()
  const [listing, setListing] = useState(null)
  const [demanda, setDemanda] = useState(null)
  const [loading, setLoading] = useState(true)
  const [comprando, setComprando] = useState(false)
  const [boosting, setBoosting] = useState(false)
  const [boostSuccess, setBoostSuccess] = useState(searchParams.get('boost') === 'success')

  useEffect(() => { cargarListing() }, [id])

  async function cargarListing() {
    const { data } = await supabase
      .from('listings')
      .select('*, laminas(id, number, name, code, section, team, confederation, is_rare, is_special, sticker_type), users(id, username, total_sales, whatsapp, ciudad)')
      .eq('id', id)
      .single()
    setListing(data)

    if (data?.lamina_id) {
      const { count: buscanCount } = await supabase
        .from('user_laminas').select('*', { count: 'exact', head: true })
        .eq('lamina_id', data.lamina_id).eq('quantity_needed', 1)
      const { count: ofrecenCount } = await supabase
        .from('user_laminas').select('*', { count: 'exact', head: true })
        .eq('lamina_id', data.lamina_id).gte('quantity_owned', 2)
      const indice = ofrecenCount > 0 ? (buscanCount / ofrecenCount).toFixed(1) : buscanCount > 0 ? '∞' : '0'
      setDemanda({ buscan: buscanCount || 0, ofrecen: ofrecenCount || 0, indice })
    }
    setLoading(false)
  }

  async function comprar() {
    if (listing.seller_id === user.id) return alert('No puedes comprar tu propia lámina')
    setComprando(true)
    const { error } = await supabase.from('transactions').insert({
      listing_id: listing.id, seller_id: listing.seller_id,
      buyer_id: user.id, lamina_id: listing.lamina_id,
      amount: listing.price, platform_fee: Math.round(listing.price * 0.07), status: 'pending',
    })
    if (error) alert('Error: ' + error.message)
    else {
      await supabase.from('listings').update({ status: 'reserved' }).eq('id', listing.id)
      alert('¡Compra iniciada! Ve a Mis Transacciones.')
      navigate('/mercado')
    }
    setComprando(false)
  }

  async function activarBoost(isFreeMonthly = false) {
    setBoosting(true)
    try {
      const scarcityIndex = parseFloat(demanda?.indice) || 0
      const response = await fetch('/.netlify/functions/flow-create-boost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          listingId: listing.id,
          scarcityIndex,
          isFreeMonthly,
        }),
      })
      const data = await response.json()

      if (isFreeMonthly || data.free) {
        // Boost gratuito Premium — activar directo
        const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000)
        await supabase.from('listings').update({ boosted_until: expiresAt.toISOString() }).eq('id', listing.id)
        await supabase.from('subscriptions').update({ monthly_boost_used: true }).eq('user_id', user.id)
        await supabase.from('boost_payments').insert({
          user_id: user.id, listing_id: listing.id,
          tier: 'premium', amount_clp: 0,
          status: 'paid', starts_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(), is_free_monthly: true,
        })
        setBoostSuccess(true)
        cargarListing()
      } else if (data.paymentUrl) {
        window.location.href = data.paymentUrl
      } else {
        alert(data.error || 'Error al activar boost')
      }
    } catch (err) {
      alert('Error de conexión')
    }
    setBoosting(false)
  }


  function compartirWhatsApp() {
    const url = `https://laminax-chile.netlify.app/listing/${listing.id}`
    const texto = `🔥 Mira esta lámina en LaminaX: *${lamina?.code || lamina?.number} - ${lamina?.name}*${listing.price ? ` por $${listing.price.toLocaleString('es-CL')} CLP` : ' (intercambio)'}\n\n${url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank')
  }

  function contactarVendedorWsp() {
    const url = `https://laminax-chile.netlify.app/listing/${listing.id}`
    const texto = `Hola! Vi tu lámina *${lamina?.code || lamina?.number} - ${lamina?.name}* en LaminaX. ¿Sigue disponible?\n${url}`
    const numero = listing.users?.whatsapp?.replace(/[^0-9]/g, '')
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(texto)}`, '_blank')
  }

  if (loading) return <div className="flex items-center justify-center h-screen bg-[#050508]"><div className="text-[#ccff00]">Cargando...</div></div>
  if (!listing) return <div className="flex items-center justify-center h-screen bg-[#050508]"><div className="text-gray-400">No encontrado</div></div>

  const esMio = listing.seller_id === user.id
  const isBoosted = listing.boosted_until && new Date(listing.boosted_until) > new Date()
  const indiceNum = parseFloat(demanda?.indice) || 0
  const escasezColor = indiceNum >= 5 ? 'text-red-400' : indiceNum >= 2 ? 'text-orange-400' : 'text-green-400'
  const escasezLabel = indiceNum >= 5 ? 'Muy alta 🔥' : indiceNum >= 2 ? 'Alta' : 'Normal'
  const lamina = listing.laminas
  const boostInfo = getBoostTier(indiceNum * 10)
  const canUseFreeBoost = isPremium && !subscription?.monthly_boost_used

  return (
    <div className="bg-[#050508] min-h-screen text-white">
      <div className="bg-[#0a0a0f]/80 border-b border-white/5 p-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center text-gray-400">←</button>
        <h1 className="text-lg font-bold">Detalle</h1>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={compartirWhatsApp}
            className="w-9 h-9 bg-green-600/20 border border-green-600/30 rounded-xl flex items-center justify-center"
            title="Compartir por WhatsApp"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.168 1.6 5.938L0 24l6.254-1.578A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.002-1.37l-.36-.214-3.714.937.975-3.605-.235-.372A9.818 9.818 0 012.182 12C2.182 6.58 6.58 2.182 12 2.182S21.818 6.58 21.818 12 17.42 21.818 12 21.818z"/></svg>
          </button>
          {isBoosted && (
            <span className="bg-[#ccff00]/10 text-[#ccff00] text-xs font-black px-3 py-1 rounded-full border border-[#ccff00]/20">
              ⚡ Destacado
            </span>
          )}
        </div>
      </div>

      {/* Toast boost success */}
      {boostSuccess && (
        <div className="mx-4 mt-3 bg-[#ccff00]/10 border border-[#ccff00]/30 rounded-2xl p-3 flex items-center gap-2">
          <span className="text-[#ccff00] text-lg">⚡</span>
          <div>
            <div className="text-[#ccff00] font-black text-sm">¡Boost activado!</div>
            <div className="text-gray-400 text-xs">Tu lámina aparecerá primero por 48 horas</div>
          </div>
        </div>
      )}

      <div className="p-8 flex flex-col items-center">
        <div className={`w-28 h-28 rounded-3xl flex flex-col items-center justify-center mb-4 ${
          isBoosted ? 'border-2 border-[#ccff00]' : lamina?.is_rare ? 'bg-[#ccff00]/10 border border-[#ccff00]/40' : 'bg-white/5 border border-white/10'
        }`} style={isBoosted ? { background: 'rgba(204,255,0,0.08)', boxShadow: '0 0 20px rgba(204,255,0,0.15)' } : {}}>
          <span className={`text-3xl font-black ${lamina?.is_rare || isBoosted ? 'text-[#ccff00]' : 'text-gray-300'}`}>
            {lamina?.code || lamina?.number}
          </span>
          {lamina?.section && <span className="text-xs text-gray-500 mt-1">{lamina.section}</span>}
        </div>
        <h2 className="text-2xl font-black text-center">{lamina?.name}</h2>
        {lamina?.team && <p className="text-gray-400 text-sm mt-1">{lamina.team}</p>}
        {lamina?.confederation && <p className="text-gray-600 text-xs mt-0.5">{lamina.confederation}</p>}
        {lamina?.sticker_type === 'escudo' && <span className="mt-2 bg-blue-500/20 text-blue-400 text-xs px-3 py-1 rounded-full border border-blue-500/30 font-bold">🛡️ Escudo oficial</span>}
        {lamina?.sticker_type === 'foto_grupal' && <span className="mt-2 bg-purple-500/20 text-purple-400 text-xs px-3 py-1 rounded-full border border-purple-500/30 font-bold">📸 Foto grupal</span>}
        {lamina?.sticker_type === 'special' && <span className="mt-2 bg-[#ccff00]/20 text-[#ccff00] text-xs px-3 py-1 rounded-full border border-[#ccff00]/30 font-bold">⭐ Lámina especial</span>}
      </div>

      <div className="px-4 flex flex-col gap-3 pb-64">
        {/* Tipo y precio */}
        <div className="glass-card p-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-gray-500 text-xs mb-1">Tipo</div>
              <div className={`text-sm font-black px-3 py-1 rounded-full inline-block ${
                listing.mode === 'subasta' ? 'bg-orange-500/20 text-orange-400' :
                listing.mode === 'venta' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
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

        {/* Índice de demanda */}
        {demanda && (
          <div className="glass-card p-4">
            <div className="text-gray-500 text-xs mb-3 font-bold uppercase tracking-wider">Índice de demanda</div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="text-center"><div className="text-white text-xl font-black">{demanda.buscan}</div><div className="text-gray-500 text-xs">La buscan</div></div>
              <div className="text-center"><div className="text-white text-xl font-black">{demanda.ofrecen}</div><div className="text-gray-500 text-xs">La ofrecen</div></div>
              <div className="text-center"><div className={`text-xl font-black ${escasezColor}`}>{demanda.indice}×</div><div className="text-gray-500 text-xs">Escasez</div></div>
            </div>
            <div className="flex justify-between items-center mb-2">
              <div className="text-xs text-gray-500">Nivel de escasez</div>
              <div className={`text-xs font-bold ${escasezColor}`}>{escasezLabel}</div>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${indiceNum >= 5 ? 'bg-red-400' : indiceNum >= 2 ? 'bg-orange-400' : 'bg-green-400'}`}
                style={{ width: `${Math.min((indiceNum / 10) * 100, 100)}%` }} />
            </div>
          </div>
        )}

        {/* Boost — solo si es mío y está activo */}
        {esMio && listing.status === 'active' && (
          <div className="glass-card p-4">
            <div className="text-gray-500 text-xs mb-3 font-bold uppercase tracking-wider">⚡ Destacar lámina</div>
            {isBoosted ? (
              <div className="bg-[#ccff00]/10 border border-[#ccff00]/20 rounded-xl p-3">
                <div className="text-[#ccff00] font-black text-sm">✓ Lámina destacada</div>
                <div className="text-gray-400 text-xs mt-1">
                  Expira: {new Date(listing.boosted_until).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-400 text-xs mb-3">Tu lámina aparecerá primero en el mercado por 48 horas.</p>
                <div className={`border rounded-xl p-3 mb-3 ${boostInfo.bg}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className={`font-black text-sm ${boostInfo.color}`}>Tier {boostInfo.tier}</span>
                      <div className="text-gray-500 text-xs mt-0.5">Según escasez de la lámina</div>
                    </div>
                    <span className={`font-black text-lg ${boostInfo.color}`}>${boostInfo.price.toLocaleString('es-CL')}</span>
                  </div>
                </div>
                {canUseFreeBoost && (
                  <button
                    onClick={() => activarBoost(true)}
                    disabled={boosting}
                    className="w-full bg-[#ccff00]/10 border border-[#ccff00]/30 text-[#ccff00] font-black py-2.5 rounded-xl text-sm mb-2 disabled:opacity-50"
                  >
                    {boosting ? 'Activando...' : '⚡ Usar boost mensual gratuito (Premium)'}
                  </button>
                )}
                <button
                  onClick={() => activarBoost(false)}
                  disabled={boosting}
                  className="w-full bg-white/5 border border-white/10 text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-50"
                >
                  {boosting ? 'Redirigiendo...' : `Comprar boost — $${boostInfo.price.toLocaleString('es-CL')}`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Vendedor */}
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-11 h-11 bg-[#ccff00] rounded-full flex items-center justify-center text-black font-black text-lg">
            {listing.users?.username?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="font-bold">@{listing.users?.username}</div>
            <div className="text-gray-500 text-xs">{listing.users?.total_sales} ventas · {listing.users?.ciudad || 'Chile'}</div>
          </div>
          {esMio && <span className="bg-blue-900/50 text-blue-300 text-xs px-2 py-1 rounded-full border border-blue-800">Tuya</span>}
          {!esMio && listing.users?.whatsapp && (
            <button
              onClick={contactarVendedorWsp}
              className="w-9 h-9 bg-green-600/20 border border-green-600/30 rounded-xl flex items-center justify-center flex-shrink-0"
              title="Contactar por WhatsApp"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.168 1.6 5.938L0 24l6.254-1.578A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.002-1.37l-.36-.214-3.714.937.975-3.605-.235-.372A9.818 9.818 0 012.182 12C2.182 6.58 6.58 2.182 12 2.182S21.818 6.58 21.818 12 17.42 21.818 12 21.818z"/></svg>
            </button>
          )}
        </div>

        {/* Desglose */}
        {listing.price && (listing.mode === 'venta' || listing.mode === 'subasta') && (
          <div className="glass-card p-4">
            <div className="text-gray-500 text-xs mb-3 font-bold uppercase tracking-wider">Desglose</div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Precio lámina</span>
              <span className="font-bold">${listing.price?.toLocaleString('es-CL')}</span>
            </div>
            {listing.mode === 'subasta' ? (
              <>
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-gray-400">Comisión plataforma (4%)</span>
                  <span className="text-red-400 font-bold">-${Math.round(listing.price * 0.04).toLocaleString('es-CL')}</span>
                </div>
                <div className="border-t border-white/5 pt-3 flex justify-between font-black">
                  <span>Vendedor recibe</span>
                  <span className="text-green-400">${Math.round(listing.price * 0.96).toLocaleString('es-CL')}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-gray-400">Comisión plataforma</span>
                  <span className="text-green-400 font-bold">¡Gratis!</span>
                </div>
                <div className="border-t border-white/5 pt-3 flex justify-between font-black">
                  <span>Vendedor recibe</span>
                  <span className="text-green-400">${listing.price?.toLocaleString('es-CL')}</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* CTAs comprador */}
      {!esMio && listing.status === 'active' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#050508]/95 backdrop-blur-xl border-t border-white/5 flex flex-col gap-2">
          <button onClick={comprar} disabled={comprando} className="w-full bg-[#ccff00] text-black font-black py-4 rounded-2xl text-lg disabled:opacity-50">
            {comprando ? 'Procesando...' : listing.mode === 'intercambio' ? '🔄 Proponer intercambio' : '🛒 Comprar ahora'}
          </button>
          <div className="flex gap-2">
            <button onClick={() => navigate(`/chat/${listing.seller_id}`)} className="flex-1 bg-white/5 text-white font-bold py-3 rounded-2xl border border-white/10 text-sm">
              💬 Chat
            </button>
            {listing.users?.whatsapp && (
              <button onClick={contactarVendedorWsp} className="flex-1 bg-green-600/20 border border-green-600/30 text-green-400 font-bold py-3 rounded-2xl text-sm">
                🟢 WhatsApp
              </button>
            )}
            <button onClick={compartirWhatsApp} className="w-12 bg-green-600/20 border border-green-600/30 font-bold py-3 rounded-2xl flex items-center justify-center">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.168 1.6 5.938L0 24l6.254-1.578A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.002-1.37l-.36-.214-3.714.937.975-3.605-.235-.372A9.818 9.818 0 012.182 12C2.182 6.58 6.58 2.182 12 2.182S21.818 6.58 21.818 12 17.42 21.818 12 21.818z"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* CTA vendedor */}
      {esMio && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#050508]/95 backdrop-blur-xl border-t border-white/5">
          <button
            onClick={async () => { await supabase.from('listings').update({ status: 'cancelled' }).eq('id', listing.id); navigate('/mercado') }}
            className="w-full bg-red-900/30 text-red-400 font-bold py-4 rounded-2xl border border-red-800"
          >
            Cancelar publicación
          </button>
        </div>
      )}
    </div>
  )
}
