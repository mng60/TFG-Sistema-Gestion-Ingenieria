import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { EmpleadoAuthProvider, useEmpleadoAuth } from './context/EmpleadoAuthContext';
import EmpleadoLogin from './pages/EmpleadoLogin';
import AdminDashboard from './pages/AdminDashboard';
import Proyectos from './pages/Proyectos';
import Clientes from './pages/Clientes';
import Usuarios from './pages/Usuarios';
import Chat from './pages/Chat';
import ProyectoCompleto from './pages/ProyectoCompleto';
import './styles/App.css';

// Rutas protegidas para empleados
function EmpleadoProtectedRoute({ children }) {
  const { isAuthenticated } = useEmpleadoAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
}

// Rutas públicas de empleados
function EmpleadoPublicRoute({ children }) {
  const { isAuthenticated } = useEmpleadoAuth();
  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
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
          
          <Route path="/dashboard" element={
            <EmpleadoProtectedRoute>
              <AdminDashboard />
            </EmpleadoProtectedRoute>
          } />

          <Route path="/clientes" element={
            <EmpleadoProtectedRoute>
              <Clientes />
            </EmpleadoProtectedRoute>
          } />

          <Route path="/proyectos" element={
            <EmpleadoProtectedRoute>
              <Proyectos />
            </EmpleadoProtectedRoute>
          } />

          <Route path="/proyectos/:id" element={
            <EmpleadoProtectedRoute>
              <ProyectoCompleto />
            </EmpleadoProtectedRoute>
          } />

          <Route path="/usuarios" element={
            <EmpleadoProtectedRoute>
              <Usuarios />
            </EmpleadoProtectedRoute>
          } />

          <Route path="/chat" element={
            <EmpleadoProtectedRoute>
              <Chat />
            </EmpleadoProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </EmpleadoAuthProvider>
    </Router>
  );
}

export default App;