import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export default function NuevoListing() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [repetidas, setRepetidas] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ lamina_id: '', mode: 'venta', price: '' })

  useEffect(() => { cargarRepetidas() }, [])

  async function cargarRepetidas() {
    const { data } = await supabase
      .from('user_laminas')
      .select('*, laminas(id, number, name)')
      .eq('user_id', user.id)
      .gte('quantity_owned', 2)
    setRepetidas(data || [])
    setLoading(false)
  }

  async function publicar() {
    if (!form.lamina_id) return alert('Selecciona una lámina')
    if (form.mode === 'venta' && !form.price) return alert('Ingresa un precio')
    if (form.mode === 'venta' && parseInt(form.price) < 1000) return alert('El precio mínimo es $1.000')
    if (form.mode === 'subasta' && !form.price) return alert('Ingresa un precio mínimo')
    if (form.mode === 'subasta' && parseInt(form.price) < 1000) return alert('El precio mínimo de subasta es $1.000')

    setSubmitting(true)
    const { error } = await supabase.from('listings').insert({
      seller_id: user.id,
      lamina_id: form.lamina_id,
      mode: form.mode,
      price: form.mode !== 'intercambio' ? parseInt(form.price) : null,
      status: 'active',
    })
    if (error) alert('Error: ' + error.message)
    else navigate('/explorar')
    setSubmitting(false)
  }

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#ccff00] text-base"

  if (loading) return <div className="flex items-center justify-center h-screen bg-[#050508]"><div className="text-[#ccff00]">Cargando...</div></div>

  return (
    <div className="bg-[#050508] min-h-screen text-white p-4 pb-24">
      <h1 className="text-2xl font-black mb-1">Publicar Lámina</h1>
      <p className="text-gray-500 text-sm mb-6">Solo puedes publicar láminas repetidas</p>

      {repetidas.length === 0 ? (
        <div className="text-center mt-20">
          <div className="text-4xl mb-4">😔</div>
          <div className="text-gray-400">No tienes láminas repetidas</div>
          <div className="text-gray-600 text-sm mt-2">Marca láminas como repetidas en Mi Álbum</div>
          <button onClick={() => navigate('/album')} className="mt-6 bg-[#ccff00] text-black font-black px-6 py-3 rounded-2xl">
            Ir a Mi Álbum
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-gray-400 mb-2 block font-bold">Lámina a publicar</label>
            <select
              value={form.lamina_id}
              onChange={e => setForm(f => ({ ...f, lamina_id: e.target.value }))}
              className={inputClass}
            >
              <option value="">Selecciona una lámina</option>
              {repetidas.map(ul => (
                <option key={ul.lamina_id} value={ul.lamina_id}>
                  #{ul.laminas.number} — {ul.laminas.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block font-bold">Tipo de publicación</label>
            <div className="grid grid-cols-3 gap-2">
              {['venta', 'intercambio', 'subasta'].map(modo => (
                <button
                  key={modo}
                  onClick={() => setForm(f => ({ ...f, mode: modo }))}
                  className={`py-3 rounded-2xl text-sm font-bold capitalize transition-all ${
                    form.mode === modo ? 'bg-[#ccff00] text-black' : 'bg-white/5 text-gray-400 border border-white/10'
                  }`}
                >
                  {modo === 'venta' ? '💰 Venta' : modo === 'intercambio' ? '🔄 Cambio' : '🔥 Remate'}
                </button>
              ))}
            </div>
          </div>

          {form.mode === 'venta' && (
            <div>
              <label className="text-sm text-gray-400 mb-2 block font-bold">Precio (CLP)</label>
              <input
                type="number"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder="Mínimo $1.000"
                className={inputClass}
              />
            </div>
          )}

          {form.mode === 'subasta' && (
            <div>
              <label className="text-sm text-gray-400 mb-2 block font-bold">Precio mínimo (CLP)</label>
              <input
                type="number"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder="Mínimo $1.000"
                className={inputClass}
              />
              <p className="text-gray-600 text-xs mt-1">El precio sube con cada puja</p>
            </div>
          )}

          {form.mode === 'intercambio' && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
              <p className="text-blue-400 text-sm">🔄 Publicarás esta lámina para intercambio. Otros usuarios te propondrán sus repetidas a cambio.</p>
            </div>
          )}

          <button
            onClick={publicar}
            disabled={submitting}
            className="w-full bg-[#ccff00] text-black font-black py-4 rounded-2xl text-lg mt-4 disabled:opacity-50"
          >
            {submitting ? 'Publicando...' : 'Publicar lámina'}
          </button>
        </div>
      )}
    </div>
  )
}
