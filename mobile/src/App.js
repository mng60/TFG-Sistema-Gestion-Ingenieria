import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Proyectos from './pages/Proyectos';
import ProyectoCompleto from './pages/ProyectoCompleto';
import Chat from './pages/Chat';
import Perfil from './pages/Perfil';
import './styles/App.css';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? children : <Navigate to="/proyectos" />;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />

          <Route path="/login" element={
            <PublicRoute><Login /></PublicRoute>
          } />

          <Route path="/proyectos" element={
            <ProtectedRoute><Proyectos /></ProtectedRoute>
          } />

          <Route path="/proyectos/:id" element={
            <ProtectedRoute><ProyectoCompleto /></ProtectedRoute>
          } />

          <Route path="/chat" element={
            <ProtectedRoute><Chat /></ProtectedRoute>
          } />

          <Route path="/perfil" element={
            <ProtectedRoute><Perfil /></ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
