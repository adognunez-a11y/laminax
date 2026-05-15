import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

const STATUS_INFO = {
  pending:   { label: 'Pendiente',     color: 'bg-gray-800 text-gray-300',         dot: 'bg-gray-400' },
  escrow:    { label: 'Pago retenido', color: 'bg-blue-500/20 text-blue-300',      dot: 'bg-blue-400' },
  shipped:   { label: 'Despachado',    color: 'bg-yellow-500/20 text-yellow-300',  dot: 'bg-yellow-400' },
  delivered: { label: 'Entregado',     color: 'bg-green-500/20 text-green-300',    dot: 'bg-green-400' },
  completed: { label: 'Completado',    color: 'bg-[#ccff00]/20 text-[#ccff00]',    dot: 'bg-[#ccff00]' },
  disputed:  { label: 'En disputa',    color: 'bg-red-500/20 text-red-300',        dot: 'bg-red-400' },
  cancelled: { label: 'Cancelado',     color: 'bg-gray-800 text-gray-500',         dot: 'bg-gray-600' },
}

export default function MisTransacciones() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('compras')
  const [transacciones, setTransacciones] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { cargarTransacciones() }, [tab])

  async function cargarTransacciones() {
    setLoading(true)
    const campo = tab === 'compras' ? 'buyer_id' : 'seller_id'
    const { data } = await supabase
      .from('transactions')
      .select('*, laminas(number, name)')
      .eq(campo, user.id)
      .order('created_at', { ascending: false })
    setTransacciones(data || [])
    setLoading(false)
  }

  async function confirmarRecepcion(tx) {
    await supabase.from('transactions').update({ status: 'completed' }).eq('id', tx.id)
    cargarTransacciones()
  }

  async function confirmarDespacho(tx) {
    const tracking = prompt('Ingresa el código de tracking:')
    if (!tracking) return
    await supabase.from('transactions').update({ status: 'shipped', tracking_number: tracking }).eq('id', tx.id)
    cargarTransacciones()
  }

  return (
    <div className="bg-[#050508] min-h-screen text-white">
      {/* Header */}
      <div className="p-4 pt-6 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 text-xl w-8 h-8 flex items-center justify-center">←</button>
        <h1 className="text-xl font-black">Mis Transacciones</h1>
      </div>

      {/* Tabs */}
      <div className="flex mx-4 mb-4 bg-white/5 rounded-2xl p-1">
        <button
          onClick={() => setTab('compras')}
          className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
            tab === 'compras' ? 'bg-[#ccff00] text-black' : 'text-gray-400'
          }`}
        >
          🛒 Mis Compras
        </button>
        <button
          onClick={() => setTab('ventas')}
          className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
            tab === 'ventas' ? 'bg-[#ccff00] text-black' : 'text-gray-400'
          }`}
        >
          📦 Mis Ventas
        </button>
      </div>

      <div className="p-4 pb-24">
        {loading ? (
          <div className="text-center text-[#ccff00] mt-20">Cargando...</div>
        ) : transacciones.length === 0 ? (
          <div className="text-center mt-20">
            <div className="text-5xl mb-4">{tab === 'compras' ? '🛒' : '📦'}</div>
            <div className="text-gray-400 font-bold">No tienes {tab} aún</div>
            <p className="text-gray-600 text-sm mt-2">
              {tab === 'compras' ? 'Explora el mercado y compra tu primera lámina' : 'Publica láminas repetidas para empezar a vender'}
            </p>
            <button
              onClick={() => navigate(tab === 'compras' ? '/explorar' : '/nuevo')}
              className="mt-6 bg-[#ccff00] text-black font-black px-6 py-3 rounded-2xl"
            >
              {tab === 'compras' ? 'Explorar mercado' : 'Publicar lámina'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {transacciones.map(tx => {
              const statusInfo = STATUS_INFO[tx.status] || STATUS_INFO.pending
              const esCompletada = tx.status === 'completed'

              return (
                <div
                  key={tx.id}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm"
                >
                  {/* Info lámina + status */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-[#ccff00]/10 border border-[#ccff00]/20 rounded-xl flex items-center justify-center font-black text-[#ccff00] text-sm">
                        #{tx.laminas?.number}
                      </div>
                      <div>
                        <div className="font-bold text-sm">{tx.laminas?.name}</div>
                        <div className="text-gray-400 text-xs mt-0.5">
                          ${tx.amount?.toLocaleString('es-CL')} CLP
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${statusInfo.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Acciones según estado */}
                  {tab === 'ventas' && tx.status === 'pending' && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-sm text-blue-300">
                      ⏳ Esperando pago del comprador...
                    </div>
                  )}

                  {tab === 'ventas' && tx.status === 'escrow' && (
                    <button
                      onClick={() => confirmarDespacho(tx)}
                      className="w-full bg-yellow-400/20 border border-yellow-400/30 text-yellow-300 font-bold py-2.5 rounded-xl text-sm"
                    >
                      📦 Confirmar despacho + tracking
                    </button>
                  )}

                  {tab === 'compras' && tx.status === 'shipped' && (
                    <div className="flex flex-col gap-2">
                      {tx.tracking_number && (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-gray-300">
                          📬 Tracking: <span className="font-mono text-white">{tx.tracking_number}</span>
                        </div>
                      )}
                      <button
                        onClick={() => confirmarRecepcion(tx)}
                        className="w-full bg-green-500/20 border border-green-500/30 text-green-300 font-bold py-2.5 rounded-xl text-sm"
                      >
                        ✅ Confirmar recepción
                      </button>
                    </div>
                  )}

                  {/* Completada: mostrar botón Calificar */}
                  {esCompletada && (
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[#ccff00] text-xs font-bold">✓ Transacción completada</span>
                      {!tx.rated && (
                        <button
                          onClick={() => navigate(`/calificar/${tx.id}`)}
                          className="bg-[#ccff00]/10 border border-[#ccff00]/30 text-[#ccff00] text-xs font-bold px-3 py-1.5 rounded-xl"
                        >
                          ⭐ Calificar
                        </button>
                      )}
                      {tx.rated && (
                        <span className="text-gray-600 text-xs">Ya calificaste</span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
