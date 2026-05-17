import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

const CIUDADES_CHILE = [
  'Arica', 'Iquique', 'Antofagasta', 'Calama', 'Copiapó', 'La Serena', 'Coquimbo',
  'Valparaíso', 'Viña del Mar', 'Quilpué', 'San Antonio',
  'Santiago', 'Puente Alto', 'Maipú', 'La Florida', 'Las Condes', 'Ñuñoa',
  'Providencia', 'Quilicura', 'San Bernardo', 'Pudahuel',
  'Rancagua', 'Curicó', 'Talca', 'Linares', 'Chillán',
  'Concepción', 'Talcahuano', 'Los Ángeles', 'Coronel',
  'Temuco', 'Padre Las Casas', 'Villarrica', 'Pucón',
  'Valdivia', 'Osorno', 'Puerto Montt', 'Castro', 'Coyhaique', 'Punta Arenas',
]

export default function EditarPerfil() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', full_name: '', whatsapp: '', ciudad: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { cargarPerfil() }, [])

  async function cargarPerfil() {
    const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
    if (data) setForm({
      username: data.username || '',
      full_name: data.full_name || '',
      whatsapp: data.whatsapp || '',
      ciudad: data.ciudad || '',
    })
    setLoading(false)
  }

  async function guardar() {
    setError('')
    if (!form.username) return setError('El username es obligatorio')
    if (form.username.length < 3) return setError('El username debe tener al menos 3 caracteres')
    if (!/^[a-zA-Z0-9._]+$/.test(form.username)) return setError('Solo letras, números, puntos y guiones bajos')

    setSaving(true)
    const { error } = await supabase.from('users').update({
      username: form.username.toLowerCase(),
      full_name: form.full_name,
      whatsapp: form.whatsapp,
      ciudad: form.ciudad || null,
    }).eq('id', user.id)

    if (error) {
      if (error.code === '23505') setError('Ese username ya está en uso')
      else setError(error.message)
    } else {
      navigate('/perfil')
    }
    setSaving(false)
  }

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#ccff00] text-base"

  if (loading) return <div className="flex items-center justify-center h-screen bg-[#050508]"><div className="text-[#ccff00]">Cargando...</div></div>

  return (
    <div className="bg-[#050508] min-h-screen text-white">
      <div className="bg-[#0a0a0f]/80 border-b border-white/5 p-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center text-gray-400">←</button>
        <h1 className="text-lg font-bold">Editar Perfil</h1>
      </div>

      <div className="p-6 flex flex-col gap-4">
        <div>
          <label className="text-sm text-gray-400 mb-2 block font-bold">Username</label>
          <div className="relative">
            <span className="absolute left-4 top-3.5 text-gray-500">@</span>
            <input
              type="text"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              placeholder="tu_username"
              className={`${inputClass} pl-8`}
            />
          </div>
          <p className="text-gray-600 text-xs mt-1">Solo letras, números, puntos y guiones bajos</p>
        </div>

        <div>
          <label className="text-sm text-gray-400 mb-2 block font-bold">Nombre completo</label>
          <input
            type="text"
            value={form.full_name}
            onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
            placeholder="Juan Pérez"
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-sm text-gray-400 mb-2 block font-bold">Ciudad</label>
          <select
            value={form.ciudad}
            onChange={e => setForm(f => ({ ...f, ciudad: e.target.value }))}
            className={inputClass}
            style={{ appearance: 'none' }}
          >
            <option value="">📍 Selecciona tu ciudad</option>
            {CIUDADES_CHILE.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <p className="text-gray-600 text-xs mt-1">Para encontrar coleccionistas cerca de ti</p>
        </div>

        <div>
          <label className="text-sm text-gray-400 mb-2 block font-bold">WhatsApp (opcional)</label>
          <input
            type="tel"
            value={form.whatsapp}
            onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
            placeholder="+56 9 1234 5678"
            className={inputClass}
          />
          <p className="text-gray-600 text-xs mt-1">Para coordinar intercambios presenciales</p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-800/50 rounded-2xl px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={guardar}
          disabled={saving}
          className="w-full bg-[#ccff00] text-black font-black py-4 rounded-2xl text-lg mt-4 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}
