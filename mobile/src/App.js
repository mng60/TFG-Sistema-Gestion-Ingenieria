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

function KeyboardManager() {
  useEffect(() => {
    // Con adjustResize, window.innerHeight se encoge cuando aparece el teclado.
    // Guardamos la altura inicial y comparamos contra ella.
    const initialHeight = window.innerHeight;

    const handleResize = () => {
      const keyboardOpen = window.innerHeight < initialHeight - 100;
      document.body.classList.toggle('keyboard-open', keyboardOpen);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return null;
}

function StatusBarManager() {
  const location = useLocation();

  useEffect(() => {
    const isLogin = location.pathname === '/login';
    const isChat = location.pathname === '/chat';

    document.body.classList.toggle('screen-login', isLogin);
    document.body.classList.toggle('screen-app', !isLogin);
    document.body.classList.toggle('screen-chat', isChat);

    const applyStatusBar = async () => {
      if (!Capacitor.isNativePlatform()) return;

      try {
        await StatusBar.show();

        // Chat tiene fondo claro → iconos oscuros (Style.Light)
        // Login y resto de app tienen fondo oscuro → iconos blancos (Style.Dark)
        await StatusBar.setStyle({
          style: isChat ? Style.Light : Style.Dark
        });
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
          <KeyboardManager />

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
