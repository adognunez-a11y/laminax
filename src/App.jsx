import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import LoginPage from './components/auth/LoginPage'
import RegisterPage from './components/auth/RegisterPage'
import AppLayout from './layout/AppLayout'
import MisAlbumes from './pages/MisAlbumes'
import MiAlbum from './pages/MiAlbum'
import Explorar from './pages/Explorar'
import NuevoListing from './pages/NuevoListing'
import DetalleListing from './pages/DetalleListing'
import MisTransacciones from './pages/MisTransacciones'
import Chat from './pages/Chat'
import Perfil from './pages/Perfil'
import Bienvenida from './pages/Bienvenida'
import Terminos from './pages/Terminos'
import EditarPerfil from './pages/EditarPerfil'
import Calificar from './pages/Calificar'
import Upgrade from './pages/Upgrade'

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center">
      <div className="text-[#ccff00] text-xl">Cargando...</div>
    </div>
  )
  return (
    <Routes>
      <Route path="/login"    element={!user ? <LoginPage />    : <Navigate to="/" />} />
      <Route path="/registro" element={!user ? <RegisterPage /> : <Navigate to="/" />} />
      <Route path="/bienvenida"               element={user ? <Bienvenida />      : <Navigate to="/login" />} />
      <Route path="/terminos"                 element={<Terminos />} />
      <Route path="/editar-perfil"            element={user ? <EditarPerfil />    : <Navigate to="/login" />} />
      <Route path="/chat/:userId"             element={user ? <Chat />            : <Navigate to="/login" />} />
      <Route path="/listing/:id"              element={user ? <DetalleListing />  : <Navigate to="/login" />} />
      <Route path="/calificar/:transactionId" element={user ? <Calificar />       : <Navigate to="/login" />} />
      <Route path="/upgrade"                  element={user ? <Upgrade />         : <Navigate to="/login" />} />
      <Route path="/nuevo"                    element={user ? <NuevoListing />    : <Navigate to="/login" />} />
      <Route path="/transacciones"            element={user ? <MisTransacciones />: <Navigate to="/login" />} />
      <Route path="/" element={user ? <AppLayout /> : <Navigate to="/login" />}>
        <Route index element={<Navigate to="/album" replace />} />
        <Route path="album"          element={<MisAlbumes />} />
        <Route path="album/:albumId" element={<MiAlbum />} />
        <Route path="mercado"        element={<Explorar />} />
        <Route path="perfil"         element={<Perfil />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
