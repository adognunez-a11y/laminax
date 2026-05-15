import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ full_name: '', rut: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) return setError('Las contraseñas no coinciden')
    if (form.password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres')
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name, rut: form.rut } }
    })
    if (error) setError(error.message)
    else setDone(true)
    setLoading(false)
  }

  const inputClass = "w-full bg-gray-800/50 border border-gray-700 rounded-2xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 transition-colors text-base"

  if (done) return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-6 text-center">
      <div className="text-5xl mb-4">📧</div>
      <h2 className="text-2xl font-black text-white mb-2">Revisa tu correo</h2>
      <p className="text-gray-400 mb-8">Te enviamos un enlace de confirmación a <span className="text-yellow-400">{form.email}</span></p>
      <Link to="/login" className="text-yellow-400 font-bold">← Volver al inicio de sesión</Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-6 py-10">
      <div className="mb-8 text-center">
        <div className="text-4xl mb-2">🏆</div>
        <h1 className="text-3xl font-black text-white">Únete a LaminaX</h1>
        <p className="text-gray-500 text-sm mt-1">El mercado del Mundial 2026</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-3">
        <input className={inputClass} type="text" placeholder="Nombre completo" value={form.full_name} onChange={e => setForm(f => ({...f, full_name: e.target.value}))} required />
        <input className={inputClass} type="text" placeholder="RUT (ej: 12345678-9)" value={form.rut} onChange={e => setForm(f => ({...f, rut: e.target.value}))} required />
        <input className={inputClass} type="email" placeholder="Correo electrónico" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} required />
        <input className={inputClass} type="password" placeholder="Contraseña (mín. 8 caracteres)" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} required />
        <input className={inputClass} type="password" placeholder="Confirmar contraseña" value={form.confirm} onChange={e => setForm(f => ({...f, confirm: e.target.value}))} required />

        {error && <div className="bg-red-900/50 border border-red-700 rounded-xl px-4 py-3 text-red-300 text-sm text-center">{error}</div>}

        <button type="submit" disabled={loading} className="w-full bg-yellow-400 text-black font-black py-4 rounded-2xl text-lg mt-2 disabled:opacity-50 hover:bg-yellow-300 transition-colors">
          {loading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
        </button>
      </form>

      <p className="text-gray-500 text-sm mt-6">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="text-yellow-400 font-bold">Inicia sesión</Link>
      </p>
    </div>
  )
}

export default RegisterPage
