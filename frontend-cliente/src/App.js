import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import SobreNosotros from './pages/SobreNosotros';
import Contacto from './pages/Contacto';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProyectoCompleto from './pages/ProyectoCompleto';
import Chat from './pages/Chat';
import ClienteLayout from './components/Layout/ClienteLayout';
import './styles/App.css';

// Ruta protegida: requiere autenticación y envuelve con el layout del portal
function ClienteProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" />;
  return <ClienteLayout>{children}</ClienteLayout>;
}

// Ruta pública: redirige al dashboard si ya está autenticado
function ClientePublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/sobre-nosotros" element={<SobreNosotros />} />
          <Route path="/contacto" element={<Contacto />} />

          <Route path="/login" element={
            <ClientePublicRoute>
              <Login />
            </ClientePublicRoute>
          } />

          <Route path="/dashboard" element={
            <ClienteProtectedRoute>
              <Dashboard />
            </ClienteProtectedRoute>
          } />

          <Route path="/proyectos/:id" element={
            <ClienteProtectedRoute>
              <ProyectoCompleto />
            </ClienteProtectedRoute>
          } />

          <Route path="/chat" element={
            <ClienteProtectedRoute>
              <Chat />
            </ClienteProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
