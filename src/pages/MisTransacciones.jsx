import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

const STATUS_INFO = {
  pending:   { label: 'Pendiente',     color: 'bg-gray-700 text-gray-300' },
  escrow:    { label: 'Pago retenido', color: 'bg-blue-800 text-blue-200' },
  shipped:   { label: 'Despachado',    color: 'bg-yellow-800 text-yellow-200' },
  delivered: { label: 'Entregado',     color: 'bg-green-800 text-green-200' },
  completed: { label: 'Completado',    color: 'bg-green-700 text-green-100' },
  disputed:  { label: 'En disputa',    color: 'bg-red-800 text-red-200' },
  cancelled: { label: 'Cancelado',     color: 'bg-gray-800 text-gray-400' },
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
    const tracking = prompt('Ingresa el codigo de tracking:')
    if (!tracking) return
    await supabase.from('transactions').update({ status: 'shipped', tracking_number: tracking }).eq('id', tx.id)
    cargarTransacciones()
  }

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <div className="bg-gray-800 p-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 text-xl">←</button>
        <h1 className="text-lg font-bold">Mis Transacciones</h1>
      </div>
      <div className="flex border-b border-gray-700">
        <button onClick={() => setTab('compras')} className={`flex-1 py-3 text-sm font-bold ${tab === 'compras' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-400'}`}>Mis Compras</button>
        <button onClick={() => setTab('ventas')} className={`flex-1 py-3 text-sm font-bold ${tab === 'ventas' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-400'}`}>Mis Ventas</button>
      </div>
      <div className="p-4">
        {loading ? (
          <div className="text-center text-gray-400 mt-10">Cargando...</div>
        ) : transacciones.length === 0 ? (
          <div className="text-center mt-20">
            <div className="text-4xl mb-4">{tab === 'compras' ? '🛒' : '📦'}</div>
            <div className="text-gray-400">No tienes {tab} aun</div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {transacciones.map(tx => {
              const statusInfo = STATUS_INFO[tx.status] || STATUS_INFO.pending
              return (
                <div key={tx.id} className="bg-gray-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center font-bold text-yellow-400">{tx.laminas?.number}</div>
                      <div>
                        <div className="font-bold text-sm">{tx.laminas?.name}</div>
                        <div className="text-gray-400 text-xs">${tx.amount?.toLocaleString('es-CL')}</div>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusInfo.color}`}>{statusInfo.label}</span>
                  </div>
                  {tab === 'ventas' && tx.status === 'pending' && <div className="bg-blue-900 rounded-lg p-3 text-sm text-blue-200">Esperando pago del comprador...</div>}
                  {tab === 'ventas' && tx.status === 'escrow' && <button onClick={() => confirmarDespacho(tx)} className="w-full bg-yellow-400 text-black font-bold py-2 rounded-lg text-sm">Confirmar despacho + tracking</button>}
                  {tab === 'compras' && tx.status === 'shipped' && (
                    <div className="flex flex-col gap-2">
                      {tx.tracking_number && <div className="bg-gray-700 rounded-lg p-2 text-xs text-gray-300">Tracking: {tx.tracking_number}</div>}
                      <button onClick={() => confirmarRecepcion(tx)} className="w-full bg-green-600 text-white font-bold py-2 rounded-lg text-sm">Confirmar recepcion</button>
                    </div>
                  )}
                  {tx.status === 'completed' && <div className="text-green-400 text-xs text-center">Transaccion completada</div>}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
