import { NavLink, Outlet } from 'react-router-dom'
import { useNotifications } from '../hooks/useNotifications'

const NAV_ITEMS = [
  { to: '/',              label: 'Inicio',       emoji: '🏠', end: true,  badge: false },
  { to: '/explorar',      label: 'Explorar',     emoji: '🔍', end: false, badge: false },
  { to: '/transacciones', label: 'Intercambios', emoji: '🛒', end: false, badge: true  },
  { to: '/perfil',        label: 'Perfil',       emoji: '👤', end: false, badge: false },
]

export function AppLayout() {
  const { total } = useNotifications()

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0f]">
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-[#13131a] border-t border-[#2a2a38]">
        <ul className="flex items-stretch h-16">
          {NAV_ITEMS.slice(0, 2).map(({ to, label, emoji, end }) => (
            <li key={to} className="flex-1">
              <NavLink to={to} end={end}>
                {({ isActive }) => (
                  <div className={`flex flex-col items-center justify-center h-16 gap-1 ${isActive ? 'text-[#ccff00]' : 'text-white'}`}>
                    <span className="text-2xl">{emoji}</span>
                    <span className="text-[11px] font-bold">{label}</span>
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#ccff00]" />}
                  </div>
                )}
              </NavLink>
            </li>
          ))}

          {/* Botón Nuevo especial */}
          <li className="flex-1 flex items-center justify-center">
            <NavLink to="/nuevo">
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 bg-[#ccff00] rounded-2xl flex items-center justify-center shadow-lg shadow-[#ccff00]/30">
                  <span className="text-black text-xl font-black">+</span>
                </div>
                <span className="text-[11px] font-bold text-[#ccff00]">Nuevo</span>
              </div>
            </NavLink>
          </li>

          {NAV_ITEMS.slice(2).map(({ to, label, emoji, end, badge }) => (
            <li key={to} className="flex-1">
              <NavLink to={to} end={end}>
                {({ isActive }) => (
                  <div className={`flex flex-col items-center justify-center h-16 gap-1 ${isActive ? 'text-[#ccff00]' : 'text-white'}`}>
                    <div className="relative">
                      <span className="text-2xl">{emoji}</span>
                      {badge && total > 0 && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-[9px] font-black">{total > 9 ? '9+' : total}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] font-bold">{label}</span>
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#ccff00]" />}
                  </div>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

export default AppLayout