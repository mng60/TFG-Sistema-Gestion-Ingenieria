import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { AuthProvider, useAuth } from './context/AuthContext';
import SplashScreen from './components/SplashScreen';
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

function StatusBarManager() {
  const location = useLocation();

  useEffect(() => {
    const applyStatusBar = async () => {
      if (!Capacitor.isNativePlatform()) return;

      const isLogin = location.pathname === '/login';

      try {
        if (isLogin) {
          await StatusBar.setOverlaysWebView({ overlay: true });
          await StatusBar.setStyle({ style: Style.Dark });
        } else {
          await StatusBar.setOverlaysWebView({ overlay: false });
          await StatusBar.setStyle({ style: Style.Light });
        }
      } catch (e) {
        console.error('Error configurando StatusBar:', e);
      }
    };

    applyStatusBar();
  }, [location.pathname]);

  return null;
}

function App() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <AuthProvider>
      {!splashDone ? (
        <SplashScreen onDone={() => setSplashDone(true)} />
      ) : (
        <Router>
          <StatusBarManager />

          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />

            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />

            <Route
              path="/proyectos"
              element={
                <ProtectedRoute>
                  <Proyectos />
                </ProtectedRoute>
              }
            />

            <Route
              path="/proyectos/:id"
              element={
                <ProtectedRoute>
                  <ProyectoCompleto />
                </ProtectedRoute>
              }
            />

            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              }
            />

            <Route
              path="/perfil"
              element={
                <ProtectedRoute>
                  <Perfil />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </Router>
      )}
    </AuthProvider>
  );
}

export default App;
