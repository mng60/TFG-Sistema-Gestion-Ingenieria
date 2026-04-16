import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { EmpleadoAuthProvider, useEmpleadoAuth } from './context/EmpleadoAuthContext';
import AdminLayout from './components/Layout/AdminLayout';
import EmpleadoLogin from './pages/EmpleadoLogin';
import AdminDashboard from './pages/AdminDashboard';
import Proyectos from './pages/Proyectos';
import Clientes from './pages/Clientes';
import Usuarios from './pages/Usuarios';
import Chat from './pages/Chat';
import ProyectoCompleto from './pages/ProyectoCompleto';
import Perfil from './pages/Perfil';
import Tickets from './pages/Tickets';
import './styles/App.css';

// Rutas públicas de empleados
function EmpleadoPublicRoute({ children }) {
  const { isAuthenticated } = useEmpleadoAuth();
  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
}

// Layout persistente — AdminLayout se monta una sola vez para todas las rutas protegidas
function AdminLayoutRoute() {
  const { isAuthenticated } = useEmpleadoAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  return <AdminLayout><Outlet /></AdminLayout>;
}

function App() {
  return (
    <Router>
      <EmpleadoAuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />

          <Route path="/login" element={
            <EmpleadoPublicRoute>
              <EmpleadoLogin />
            </EmpleadoPublicRoute>
          } />

          {/* Layout persistente — sidebar y topbar no se remontan al navegar */}
          <Route element={<AdminLayoutRoute />}>
            <Route path="/dashboard" element={<AdminDashboard />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/proyectos" element={<Proyectos />} />
            <Route path="/proyectos/:id" element={<ProyectoCompleto />} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/tickets" element={<Tickets />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </EmpleadoAuthProvider>
    </Router>
  );
}

export default App;
