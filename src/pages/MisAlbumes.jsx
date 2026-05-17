import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export default function MisAlbumes() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [albumes, setAlbumes] = useState([])
  const [progresos, setProgresos] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => { cargarAlbumes() }, [])

  async function cargarAlbumes() {
    const { data: albs } = await supabase
      .from('albums')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    setAlbumes(albs || [])

    const { data: userLams } = await supabase
      .from('user_laminas')
      .select('lamina_id, quantity_owned, laminas(album_id)')
      .eq('user_id', user.id)

    const prog = {}
    userLams?.forEach(ul => {
      const aid = ul.laminas?.album_id
      if (!aid) return
      if (!prog[aid]) prog[aid] = { tengo: 0, repetidas: 0 }
      if (ul.quantity_owned >= 1) prog[aid].tengo++
      if (ul.quantity_owned >= 2) prog[aid].repetidas++
    })
    setProgresos(prog)
    setLoading(false)
  }

  const EMOJIS = {
    'Fútbol': '⚽', 'Comics': '🦸', 'Animé': '🎌',
    'Música': '🎵', 'Cine': '🎬', 'default': '📒'
  }

  function getEmoji(theme) { return EMOJIS[theme] || EMOJIS['default'] }

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#0a0a0f]">
      <div className="text-[#ccff00] text-xl animate-pulse">Cargando álbumes...</div>
    </div>
  )

  return (
    <div className="bg-[#0a0a0f] min-h-screen text-white pb-24">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-black">Mis Álbumes</h1>
        <p className="text-[#6b6b80] text-sm mt-1">{albumes.length} álbum{albumes.length !== 1 ? 'es' : ''} activo{albumes.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="px-4 flex flex-col gap-3">
        {albumes.map(album => {
          const prog = progresos[album.id] || { tengo: 0, repetidas: 0 }
          const total = album.total_laminas || 0
          const pct = total > 0 ? Math.round((prog.tengo / total) * 100) : 0
          const emoji = getEmoji(album.sport_or_theme)

          return (
            <button
              key={album.id}
              onClick={() => navigate(`/album/${album.id}`)}
              className="w-full text-left rounded-2xl p-5 relative overflow-hidden transition-all active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #1a1200 0%, #2d1f00 50%, #1a0f00 100%)',
                border: '1px solid #5a3e00',
                boxShadow: '0 0 30px rgba(204,255,0,0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
            >
              {/* Glow decorativo */}
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(204,255,0,0.12) 0%, transparent 70%)' }} />

              {/* Emoji grande de fondo */}
              <div className="absolute right-4 bottom-2 text-7xl opacity-15 pointer-events-none select-none">{emoji}</div>

              {/* Badge publisher */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-black px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(204,255,0,0.15)', color: '#ccff00', border: '1px solid rgba(204,255,0,0.3)' }}>
                  {album.publisher}
                </span>
                <span className="text-[#8a7a50] text-[10px] font-bold">{album.year}</span>
              </div>

              {/* Nombre */}
              <div className="text-white font-black text-xl leading-tight mb-1">{album.name}</div>
              <div className="text-[#8a7a50] text-xs mb-4">{total} láminas · {album.sport_or_theme}</div>

              {/* Barra de progreso */}
              <div className="flex justify-between text-xs mb-2">
                <span className="text-[#8a7a50]">Tu progreso</span>
                <span className="font-black" style={{ color: '#ccff00' }}>{prog.tengo}/{total} · {pct}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden mb-3" style={{ background: 'rgba(0,0,0,0.4)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #ccff00, #ff6b35)' }}
                />
              </div>

              {/* Stats */}
              <div className="flex gap-4 text-xs">
                <span className="font-bold text-green-400">✓ {prog.tengo} tengo</span>
                <span className="font-bold text-red-400">✗ {total - prog.tengo} faltan</span>
                {prog.repetidas > 0 && <span className="font-bold" style={{ color: '#ccff00' }}>× {prog.repetidas} rep.</span>}
              </div>

              {/* Flecha */}
              <div className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-xl" style={{ color: '#ccff00' }}>→</div>
            </button>
          )
        })}

        {/* Placeholder agregar álbum */}
        <button
          onClick={() => alert('Próximamente: agregar nuevos álbumes 🚀')}
          className="w-full text-left rounded-2xl p-5 flex flex-col justify-between transition-all active:scale-[0.98]"
          style={{
            minHeight: '160px',
            border: '2px dashed #2a2a38',
            background: 'transparent',
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-[#1c1c26] text-[#4a4a5a] border border-[#2a2a38]">
              Próximamente
            </span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center gap-2 py-4">
            <div className="w-14 h-14 bg-[#1c1c26] border border-[#2a2a38] rounded-2xl flex items-center justify-center">
              <span className="text-[#4a4a5a] text-3xl font-black leading-none">+</span>
            </div>
            <span className="text-[#4a4a5a] text-sm font-bold">Agregar álbum</span>
            <span className="text-[#3a3a48] text-xs text-center">Champions League, Marvel y más</span>
          </div>
        </button>
      </div>
    </div>
  )
}
