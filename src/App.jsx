import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Pods from './pages/Pods'
import Clientes from './pages/Clientes'
import Equipo from './pages/Equipo'
import Rentabilidad from './pages/Rentabilidad'
import PodDesigner from './pages/PodDesigner'
import MaestroClientes from './pages/MaestroClientes'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="pods" element={<Pods />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="equipo" element={<Equipo />} />
            <Route path="rentabilidad" element={<Rentabilidad />} />
            <Route path="pod-designer" element={<PodDesigner />} />
            <Route path="maestro-clientes" element={<MaestroClientes />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
