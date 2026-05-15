import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useParams, useNavigate } from 'react-router-dom'

export default function Chat() {
  const { userId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [otherUser, setOtherUser] = useState(null)
  const [texto, setTexto] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => { cargarDatos() }, [userId])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function cargarDatos() {
    const { data: other } = await supabase
      .from('users').select('id, username').eq('id', userId).single()
    setOtherUser(other)
    await cargarMensajes()
    setLoading(false)
  }

  async function cargarMensajes() {
    const { data: enviados } = await supabase
      .from('messages').select('*')
      .eq('sender_id', user.id).eq('receiver_id', userId)
      .order('created_at', { ascending: true })

    const { data: recibidos } = await supabase
      .from('messages').select('*')
      .eq('sender_id', userId).eq('receiver_id', user.id)
      .order('created_at', { ascending: true })

    const todos = [...(enviados || []), ...(recibidos || [])]
    todos.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    setMessages(todos)
  }

  async function enviar() {
    const t = texto.trim()
    if (!t) return
    const BLOQUEADAS = ['transferencia', 'cuentarut', 'banco', 'deposito', 'cuenta corriente']
    if (BLOQUEADAS.some(p => t.toLowerCase().includes(p))) {
      alert('Por seguridad, los pagos deben hacerse dentro de LaminaX.')
      return
    }
    setTexto('')
    const { data, error } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: userId,
      body: t,
    }).select().single()
    console.log('insert result:', data, error)
    if (data) setMessages(prev => [...prev, data])
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#0a0a0f]">
      <div className="text-yellow-400">Cargando...</div>
    </div>
  )

  return (
    <div className="bg-[#0a0a0f] min-h-screen flex flex-col">
      <div className="bg-gray-900 border-b border-gray-800 p-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 text-xl">←</button>
        <div className="w-9 h-9 bg-yellow-400 rounded-full flex items-center justify-center text-black font-black text-sm">
          {otherUser?.username?.[0]?.toUpperCase()}
        </div>
        <div>
          <div className="font-bold text-white">@{otherUser?.username}</div>
          <div className="text-xs text-gray-500">Chat privado</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 pb-24">
        {messages.length === 0 && (
          <div className="text-center text-gray-600 mt-20">
            <div className="text-4xl mb-2">💬</div>
            <div>Inicia la conversación</div>
          </div>
        )}
        {messages.map(msg => {
          const esMio = msg.sender_id === user.id
          return (
            <div key={msg.id} className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${
                esMio ? 'bg-yellow-400 text-black rounded-br-sm' : 'bg-gray-800 text-white rounded-bl-sm'
              }`}>
                {msg.body}
                <div className={`text-xs mt-1 ${esMio ? 'text-black/50' : 'text-gray-500'}`}>
                  {new Date(msg.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4 flex gap-3 items-center">
        <input
          value={texto}
          onChange={e => setTexto(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && enviar()}
          placeholder="Escribe un mensaje..."
          className="flex-1 bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 text-sm"
        />
        <button onClick={enviar} disabled={!texto.trim()} className="bg-yellow-400 text-black font-black w-12 h-12 rounded-2xl flex items-center justify-center disabled:opacity-40 flex-shrink-0">
          ➤
        </button>
      </div>
    </div>
  )
}
