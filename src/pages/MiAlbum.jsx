import { useState, useEffect, useMemo, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useNavigate, useParams } from 'react-router-dom'

const TOTAL_LAMINAS = 994

const FLAGS = {
  MEX:'🇲🇽',RSA:'🇿🇦',KOR:'🇰🇷',CZE:'🇨🇿',CAN:'🇨🇦',BIH:'🇧🇦',QAT:'🇶🇦',SUI:'🇨🇭',
  BRA:'🇧🇷',MAR:'🇲🇦',HAI:'🇭🇹',SCO:'🏴󠁧󠁢󠁳󠁣󠁴󠁿',USA:'🇺🇸',PAR:'🇵🇾',AUS:'🇦🇺',TUR:'🇹🇷',
  GER:'🇩🇪',CUW:'🇨🇼',CIV:'🇨🇮',ECU:'🇪🇨',NED:'🇳🇱',JPN:'🇯🇵',SWE:'🇸🇪',TUN:'🇹🇳',
  BEL:'🇧🇪',EGY:'🇪🇬',IRN:'🇮🇷',NZL:'🇳🇿',ESP:'🇪🇸',CPV:'🇨🇻',KSA:'🇸🇦',URU:'🇺🇾',
  FRA:'🇫🇷',SEN:'🇸🇳',IRQ:'🇮🇶',NOR:'🇳🇴',ARG:'🇦🇷',ALG:'🇩🇿',AUT:'🇦🇹',JOR:'🇯🇴',
  POR:'🇵🇹',COD:'🇨🇩',UZB:'🇺🇿',COL:'🇨🇴',ENG:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',CRO:'🇭🇷',GHA:'🇬🇭',PAN:'🇵🇦',
  FWC:'⚽',CC:'🥤'
}

const SECTION_ORDER = [
  'FWC','MEX','RSA','KOR','CZE','CAN','BIH','QAT','SUI','BRA','MAR','HAI',
  'SCO','USA','PAR','AUS','TUR','GER','CUW','CIV','ECU','NED','JPN','SWE','TUN','BEL',
  'EGY','IRN','NZL','ESP','CPV','KSA','URU','FRA','SEN','IRQ','NOR','ARG','ALG','AUT',
  'JOR','POR','COD','UZB','COL','ENG','CRO','GHA','PAN','CC'
]

function Toast({ message, visible }) {
  return (
    <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#ccff00] text-black text-xs font-black px-4 py-2 rounded-full z-50 transition-all duration-300 whitespace-nowrap ${
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
    }`}>
      {message}
    </div>
  )
}

function LaminaCell({ lamina, estado, onToggle }) {
  // Fix 1: todas las láminas sin tocar son grises — sin importar si son especiales
  const colorClass = estado === 'tengo'
    ? 'bg-green-900/40 border-green-700/40 text-green-400'
    : estado === 'repetida'
    ? 'bg-yellow-900/40 border-yellow-600/40 text-yellow-400'
    : 'bg-[#1c1c26] border-[#2a2a38] text-[#4a4a5a]'

  // Fix 2: mostrar código completo (FWC1, MEX3, CC14, etc.)
  const label = lamina.code || lamina.number

  return (
    <button
      onClick={onToggle}
      title={`${lamina.code || lamina.number} — ${lamina.name}`}
      className={`rounded-lg text-[8px] font-black aspect-square flex items-center justify-center transition-all active:scale-75 cursor-pointer select-none border ${colorClass}`}
    >
      {label}
    </button>
  )
}

function SectionBlock({ section, laminas, userLaminas, onToggle }) {
  const flag = FLAGS[section] || '🏳'
  const team = laminas[0]?.team || section
  const total = laminas.length
  const have = laminas.filter(l => {
    const ul = userLaminas[l.id]
    return ul && ul.quantity_owned >= 1
  }).length
  const pct = Math.round((have / total) * 100)

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{flag}</span>
        <span className="text-sm font-black">{team}</span>
        <div className="flex-1 h-1 bg-[#2a2a38] rounded-full overflow-hidden mx-2">
          <div
            className="h-full bg-[#ccff00] rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[10px] text-[#6b6b80] font-bold">{have}/{total}</span>
      </div>
      <div className="grid grid-cols-10 gap-[3px]">
        {laminas.map(lamina => {
          const ul = userLaminas[lamina.id]
          const estado = !ul || ul.quantity_owned === 0 ? 'falta' : ul.quantity_owned >= 2 ? 'repetida' : 'tengo'
          return (
            <LaminaCell
              key={lamina.id}
              lamina={lamina}
              estado={estado}
              onToggle={() => onToggle(lamina)}
            />
          )
        })}
      </div>
    </div>
  )
}

export default function MiAlbum() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { albumId } = useParams()
  const [laminas, setLaminas] = useState([])
  const [userLaminas, setUserLaminas] = useState({})
  const [albumInfo, setAlbumInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [viewMode, setViewMode] = useState('section')
  const [toast, setToast] = useState({ visible: false, message: '' })
  const toastTimer = useRef(null)

  useEffect(() => { cargarDatos() }, [albumId])

  async function cargarDatos() {
    const [{ data: lams }, { data: album }, { data: userLams }] = await Promise.all([
      supabase.from('laminas').select('*').eq('album_id', albumId).order('number', { ascending: true }),
      supabase.from('albums').select('*').eq('id', albumId).single(),
      supabase.from('user_laminas').select('*').eq('user_id', user.id),
    ])
    const mapa = {}
    userLams?.forEach(ul => { mapa[ul.lamina_id] = ul })
    setLaminas(lams || [])
    setAlbumInfo(album)
    setUserLaminas(mapa)
    setLoading(false)
  }

  function showToast(msg) {
    setToast({ visible: true, message: msg })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 1500)
  }

  async function toggleEstado(lamina) {
    const ul = userLaminas[lamina.id]
    const actual = !ul || ul.quantity_owned === 0 ? 'falta' : ul.quantity_owned >= 2 ? 'repetida' : 'tengo'
    const siguiente = actual === 'falta' ? 'tengo' : actual === 'tengo' ? 'repetida' : 'falta'
    const qty = siguiente === 'falta' ? 0 : siguiente === 'tengo' ? 1 : 2
    const { data } = await supabase.from('user_laminas').upsert({
      user_id: user.id, lamina_id: lamina.id,
      quantity_owned: qty,
      quantity_needed: siguiente === 'falta' ? 1 : 0,
    }, { onConflict: 'user_id,lamina_id' }).select().single()
    if (data) setUserLaminas(prev => ({ ...prev, [lamina.id]: data }))
    const msgs = { tengo: '✓ Tengo', repetida: '⟳ Repetida', falta: '✗ Falta' }
    showToast(msgs[siguiente])
  }

  function getEstado(lamina) {
    const ul = userLaminas[lamina.id]
    if (!ul || ul.quantity_owned === 0) return 'falta'
    if (ul.quantity_owned >= 2) return 'repetida'
    return 'tengo'
  }

  const totalAlbum = laminas.length || TOTAL_LAMINAS

  const laminasFiltradas = useMemo(() => {
    return laminas.filter(l => {
      const b = busqueda.toLowerCase()
      const matchBusqueda = !busqueda ||
        l.number.toString().includes(busqueda) ||
        (l.code && l.code.toLowerCase().includes(b)) ||
        (l.name && l.name.toLowerCase().includes(b)) ||
        (l.team && l.team.toLowerCase().includes(b)) ||
        (l.section && l.section.toLowerCase().includes(b))
      const estado = getEstado(l)
      const matchEstado = filtroEstado === 'todos' || estado === filtroEstado
      return matchBusqueda && matchEstado
    })
  }, [laminas, userLaminas, busqueda, filtroEstado])

  const laminasPorSeccion = useMemo(() => {
    const mapa = {}
    laminasFiltradas.forEach(l => {
      if (!mapa[l.section]) mapa[l.section] = []
      mapa[l.section].push(l)
    })
    return mapa
  }, [laminasFiltradas])

  const seccionesVisibles = SECTION_ORDER.filter(s => laminasPorSeccion[s]?.length > 0)
  const tengo = Object.values(userLaminas).filter(ul => ul.quantity_owned >= 1).length
  const repetidas = Object.values(userLaminas).filter(ul => ul.quantity_owned >= 2).length
  const progreso = Math.round((tengo / totalAlbum) * 100)

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#0a0a0f]">
      <div className="text-[#ccff00] text-xl animate-pulse">Cargando álbum...</div>
    </div>
  )

  return (
    <div className="bg-[#0a0a0f] min-h-screen text-white pb-24">

      {/* Header */}
      <div className="mx-4 mt-4 mb-3 rounded-2xl p-4 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1a1200 0%, #2d1f00 100%)', border: '1px solid #3d2e00' }}>
        <div className="absolute right-2 bottom-0 text-6xl opacity-10 pointer-events-none">⚽</div>
        <button onClick={() => navigate('/album')} className="text-[#8a7a50] text-xs mb-2 flex items-center gap-1">← Mis Álbumes</button>
        <div className="text-[#ccff00] text-[10px] font-black uppercase tracking-widest mb-1">Álbum activo</div>
        <div className="text-white text-lg font-black leading-tight">{albumInfo?.name || 'FIFA World Cup 2026'}</div>
        <div className="text-[#ccff00]/50 text-xs mb-3">{albumInfo?.publisher} · {totalAlbum} láminas</div>
        <div className="flex justify-between text-xs text-white/40 mb-1.5">
          <span>Progreso</span>
          <span className="text-[#ccff00] font-bold">{tengo} / {totalAlbum} · {progreso}%</span>
        </div>
        <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-[#ccff00] transition-all duration-700" style={{ width: `${progreso}%` }} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 px-4 mb-3">
        {[
          { num: tengo,             color: 'text-green-400',  label: 'Tengo' },
          { num: totalAlbum - tengo, color: 'text-red-400',   label: 'Faltan' },
          { num: repetidas,          color: 'text-[#ccff00]', label: 'Repetidas' },
        ].map(s => (
          <div key={s.label} className="bg-[#13131a] rounded-2xl p-3 text-center border border-[#2a2a38]">
            <div className={`text-2xl font-black ${s.color}`}>{s.num}</div>
            <div className="text-[#6b6b80] text-[10px] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Búsqueda + toggle */}
      <div className="flex gap-2 px-4 mb-3">
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="🔍 ARG5, FWC1, CC14, Argentina..."
          className="flex-1 bg-[#13131a] border border-[#2a2a38] rounded-2xl px-4 py-2.5 text-white placeholder-[#4a4a5a] focus:outline-none focus:border-[#ccff00] text-sm"
        />
        <button
          onClick={() => setViewMode(v => v === 'section' ? 'grid' : 'section')}
          className={`px-3 rounded-2xl border text-sm font-black transition-all ${
            viewMode === 'grid' ? 'bg-[#ccff00] text-black border-[#ccff00]' : 'bg-[#13131a] text-[#ccff00] border-[#2a2a38]'
          }`}
        >
          {viewMode === 'section' ? '⊞' : '▦'}
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 px-4 mb-3 overflow-x-auto pb-1">
        {[
          { key: 'todos',    label: 'Todas',     count: laminasFiltradas.length },
          { key: 'falta',    label: 'Faltan',    count: laminasFiltradas.filter(l => getEstado(l) === 'falta').length },
          { key: 'tengo',    label: 'Tengo',     count: laminasFiltradas.filter(l => getEstado(l) === 'tengo').length },
          { key: 'repetida', label: 'Repetidas', count: laminasFiltradas.filter(l => getEstado(l) === 'repetida').length },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFiltroEstado(f.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              filtroEstado === f.key ? 'bg-[#ccff00] text-black' : 'bg-[#13131a] text-[#6b6b80] border border-[#2a2a38]'
            }`}
          >
            {f.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filtroEstado === f.key ? 'bg-black/20' : 'bg-[#2a2a38]'}`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Leyenda */}
      <div className="flex gap-3 px-4 mb-3 flex-wrap">
        {[
          { color: 'bg-[#1c1c26] border border-[#2a2a38]', label: 'Falta' },
          { color: 'bg-green-900/40 border border-green-700/40', label: 'Tengo' },
          { color: 'bg-yellow-900/40 border border-yellow-600/40', label: 'Repetida' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-[3px] ${item.color}`} />
            <span className="text-[10px] text-[#6b6b80]">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Botón publicar repetidas */}
      {repetidas > 0 && filtroEstado === 'repetida' && (
        <div className="px-4 mb-3">
          <button onClick={() => navigate('/nuevo')} className="w-full bg-[#ccff00] text-black font-black py-3 rounded-2xl text-sm">
            📢 Publicar mis {repetidas} repetidas
          </button>
        </div>
      )}

      {/* Contenido */}
      <div className="px-4">
        {laminasFiltradas.length === 0 ? (
          <div className="text-center mt-20 text-[#4a4a5a]">
            <div className="text-4xl mb-2">🔍</div>
            <div>No se encontraron láminas</div>
          </div>
        ) : viewMode === 'section' ? (
          seccionesVisibles.map(sec => (
            <SectionBlock
              key={sec}
              section={sec}
              laminas={laminasPorSeccion[sec]}
              userLaminas={userLaminas}
              onToggle={toggleEstado}
            />
          ))
        ) : (
          <div className="grid grid-cols-10 gap-[3px]">
            {laminasFiltradas.map(lamina => (
              <LaminaCell
                key={lamina.id}
                lamina={lamina}
                estado={getEstado(lamina)}
                onToggle={() => toggleEstado(lamina)}
              />
            ))}
          </div>
        )}
      </div>

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  )
}
