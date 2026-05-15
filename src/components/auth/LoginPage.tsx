import { useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Correo o contraseña incorrectos')
    setLoading(false)
  }

  const inputClass = "w-full bg-gray-800/50 border border-gray-700 rounded-2xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 transition-colors text-base"

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="mb-10 text-center">
        <div className="text-5xl mb-3">🏆</div>
        <h1 className="text-4xl font-black text-white tracking-tight">
          Lamina<span className="text-yellow-400">X</span>
        </h1>
        <p className="text-gray-500 text-sm mt-2">El mercado de láminas del Mundial 2026</p>
      </div>

      <div className="w-full max-w-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            className={inputClass}
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            className={inputClass}
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {error && (
            <div className="bg-red-900/50 border border-red-700 rounded-xl px-4 py-3 text-red-300 text-sm text-center">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 text-black font-black py-4 rounded-2xl text-lg mt-2 disabled:opacity-50 hover:bg-yellow-300 transition-colors"
          >
            {loading ? 'Entrando...' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-800" />
          <span className="text-xs text-gray-600">¿Primera vez?</span>
          <div className="flex-1 h-px bg-gray-800" />
        </div>

        <Link
          to="/registro"
          className="block w-full text-center bg-transparent border border-gray-700 text-white font-bold py-4 rounded-2xl hover:border-yellow-400 hover:text-yellow-400 transition-colors"
        >
          Crear cuenta gratis
        </Link>
      </div>
    </div>
  )
}

export default LoginPage
