import { useAuth } from '../hooks/useAuth'
import { Button }  from '../components/ui/Button'

// ─── Inicio ───────────────────────────────────────────────────────────────────
export function HomePage() {
  const { user } = useAuth()
  const name = user?.user_metadata?.full_name?.split(' ')[0] ?? 'usuario'

  return (
    <div className="px-5 pt-10 animate-slide-up">
      <h2 className="font-display text-3xl font-bold text-white mb-1">
        Hola, {name} 👋
      </h2>
      <p className="text-surface-muted font-sans text-sm mb-8">
        {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
      </p>

      <div className="grid grid-cols-2 gap-3">
        {[
          { emoji: '📊', title: 'Resumen',    desc: 'Ver estadísticas'   },
          { emoji: '📁', title: 'Documentos', desc: 'Tus archivos'       },
          { emoji: '🔔', title: 'Alertas',    desc: '3 pendientes'       },
          { emoji: '⚙️', title: 'Config',     desc: 'Ajustes rápidos'    },
        ].map(card => (
          <button
            key={card.title}
            className="bg-surface-card border border-surface-border rounded-2xl p-4 text-left hover:border-brand-700 active:scale-95 transition-all duration-150"
          >
            <span className="text-2xl">{card.emoji}</span>
            <p className="font-sans font-semibold text-white mt-2 text-sm">{card.title}</p>
            <p className="font-sans text-xs text-surface-muted">{card.desc}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Explorar ─────────────────────────────────────────────────────────────────
export function ExplorePage() {
  return (
    <div className="px-5 pt-10 animate-slide-up">
      <h2 className="font-display text-3xl font-bold text-white mb-6">Explorar</h2>
      <div className="bg-surface-card border border-surface-border rounded-2xl px-4 py-3 flex items-center gap-3 mb-6">
        <span className="text-surface-muted">🔍</span>
        <input
          className="bg-transparent flex-1 text-white placeholder:text-surface-muted font-sans text-sm outline-none"
          placeholder="Buscar..."
        />
      </div>
      <p className="text-surface-muted font-sans text-sm">Contenido de exploración aquí.</p>
    </div>
  )
}

// ─── Nuevo ────────────────────────────────────────────────────────────────────
export function NewItemPage() {
  return (
    <div className="px-5 pt-10 animate-slide-up">
      <h2 className="font-display text-3xl font-bold text-white mb-6">Nuevo</h2>
      <div className="flex flex-col gap-3">
        {['Documento', 'Tarea', 'Nota rápida'].map(item => (
          <button
            key={item}
            className="bg-surface-card border border-surface-border rounded-2xl px-5 py-4 text-left text-white font-sans font-medium hover:border-brand-700 active:scale-95 transition-all"
          >
            + {item}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Alertas ──────────────────────────────────────────────────────────────────
export function AlertsPage() {
  const alerts = [
    { id: 1, title: 'Documento aprobado',     time: 'Hace 5 min',  read: false },
    { id: 2, title: 'Nuevo mensaje recibido', time: 'Hace 1 hora', read: false },
    { id: 3, title: 'Actualización sistema',  time: 'Ayer',        read: true  },
  ]

  return (
    <div className="px-5 pt-10 animate-slide-up">
      <h2 className="font-display text-3xl font-bold text-white mb-6">Alertas</h2>
      <ul className="flex flex-col gap-2">
        {alerts.map(alert => (
          <li
            key={alert.id}
            className={`bg-surface-card border rounded-2xl px-4 py-3 flex items-start gap-3 ${
              alert.read ? 'border-surface-border' : 'border-brand-700 bg-brand-950/20'
            }`}
          >
            {!alert.read && (
              <span className="mt-1 w-2 h-2 rounded-full bg-brand-500 shrink-0" />
            )}
            <div className={alert.read ? 'ml-5' : ''}>
              <p className="font-sans text-sm font-medium text-white">{alert.title}</p>
              <p className="font-sans text-xs text-surface-muted">{alert.time}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Perfil ───────────────────────────────────────────────────────────────────
export function ProfilePage() {
  const { user, signOut } = useAuth()
  const meta = user?.user_metadata ?? {}

  return (
    <div className="px-5 pt-10 animate-slide-up">
      {/* Avatar */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-600 to-brand-900 flex items-center justify-center mb-3 text-3xl">
          {meta.avatar_url
            ? <img src={meta.avatar_url} className="w-full h-full rounded-full object-cover" />
            : '👤'
          }
        </div>
        <h2 className="font-display text-xl font-bold text-white">
          {meta.full_name ?? 'Mi Perfil'}
        </h2>
        <p className="text-surface-muted text-sm font-sans">{user?.email}</p>
        {meta.rut && (
          <p className="text-surface-muted text-xs font-sans mt-0.5">RUT: {meta.rut}</p>
        )}
      </div>

      {/* Menu items */}
      <ul className="flex flex-col gap-2 mb-8">
        {[
          { emoji: '👤', label: 'Editar perfil' },
          { emoji: '🔒', label: 'Seguridad'     },
          { emoji: '🔔', label: 'Notificaciones' },
          { emoji: '❓', label: 'Ayuda'          },
        ].map(item => (
          <li key={item.label}>
            <button className="w-full bg-surface-card border border-surface-border rounded-2xl px-4 py-3.5 flex items-center gap-3 text-white hover:border-slate-500 active:scale-[0.98] transition-all">
              <span>{item.emoji}</span>
              <span className="font-sans text-sm font-medium">{item.label}</span>
              <span className="ml-auto text-surface-muted text-sm">›</span>
            </button>
          </li>
        ))}
      </ul>

      <Button variant="danger" fullWidth onClick={signOut}>
        Cerrar sesión
      </Button>
    </div>
  )
}
