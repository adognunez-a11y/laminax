import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useNavigate, useParams } from 'react-router-dom'

export default function Calificar() {
  const { user } = useAuth()
  const { transactionId } = useParams()
  const navigate = useNavigate()
  const [transaction, setTransaction] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')

  useEffect(() => { cargarTransaccion() }, [transactionId])

  async function cargarTransaccion() {
    const { data } = await supabase
      .from('transactions')
      .select('*, laminas(number, name)')
      .eq('id', transactionId)
      .single()
    setTransaction(data)
    setLoading(false)
  }

  async function enviarCalificacion() {
    if (rating === 0) return alert('Selecciona una calificación')
    setSubmitting(true)

    const esComprador = transaction.buyer_id === user.id
    const calificadoId = esComprador ? transaction.seller_id : transaction.buyer_id

    const { error } = await supabase.from('ratings').insert({
      transaction_id: transactionId,
      rater_id: user.id,
      rated_id: calificadoId,
      rating,
      comment: comment.trim() || null,
    })

    if (error) {
      alert('Error al calificar: ' + error.message)
    } else {
      // Marcar transacción como calificada
      await supabase
        .from('transactions')
        .update({ rated: true })
        .eq('id', transactionId)
      navigate('/transacciones')
    }
    setSubmitting(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#050508]">
      <div className="text-[#ccff00]">Cargando...</div>
    </div>
  )

  if (!transaction) return (
    <div className="flex items-center justify-center h-screen bg-[#050508]">
      <div className="text-gray-400">Transacción no encontrada</div>
    </div>
  )

  const esComprador = transaction.buyer_id === user.id
  const labels = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente']

  return (
    <div className="bg-[#050508] min-h-screen text-white p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate(-1)} className="text-gray-400 text-xl w-8 h-8 flex items-center justify-center">←</button>
        <h1 className="text-xl font-black">Calificar {esComprador ? 'vendedor' : 'comprador'}</h1>
      </div>

      {/* Lámina */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 flex items-center gap-3">
        <div className="w-12 h-12 bg-[#ccff00]/10 border border-[#ccff00]/20 rounded-xl flex items-center justify-center font-black text-[#ccff00]">
          #{transaction.laminas?.number}
        </div>
        <div>
          <div className="font-bold">{transaction.laminas?.name}</div>
          <div className="text-gray-400 text-sm">${transaction.amount?.toLocaleString('es-CL')} CLP</div>
        </div>
      </div>

      {/* Estrellas */}
      <div className="mb-6">
        <p className="text-gray-400 text-sm font-bold mb-4 text-center">
          ¿Cómo fue tu experiencia con el {esComprador ? 'vendedor' : 'comprador'}?
        </p>
        <div className="flex justify-center gap-3 mb-2">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className="text-4xl transition-transform hover:scale-110"
            >
              {star <= (hover || rating) ? '⭐' : '☆'}
            </button>
          ))}
        </div>
        {(hover || rating) > 0 && (
          <p className="text-center text-[#ccff00] font-bold text-sm">
            {labels[hover || rating]}
          </p>
        )}
      </div>

      {/* Comentario */}
      <div className="mb-6">
        <label className="text-sm text-gray-400 mb-2 block font-bold">
          Comentario <span className="text-gray-600 font-normal">(opcional)</span>
        </label>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Cuéntanos cómo fue la experiencia..."
          maxLength={300}
          rows={4}
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#ccff00] text-base resize-none"
        />
        <p className="text-gray-600 text-xs text-right mt-1">{comment.length}/300</p>
      </div>

      <button
        onClick={enviarCalificacion}
        disabled={submitting || rating === 0}
        className="w-full bg-[#ccff00] text-black font-black py-4 rounded-2xl text-lg disabled:opacity-40"
      >
        {submitting ? 'Enviando...' : 'Enviar calificación'}
      </button>
    </div>
  )
}
