import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import Chatbot from './Chatbot';
import api from '../services/api';
import '../styles/AsistenteIA.css';

const MSG_BIENVENIDA = 'Hola. Soy el asistente de BlueArc Ingenieria. Puedo ayudarte con dudas sobre servicios, precios orientativos o normativa electrica. En que puedo ayudarte?';

function AsistenteIA() {
  const [isOpen, setIsOpen] = useState(false);
  const [disponible, setDisponible] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [cargando, setCargando] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    api.get('/asistente/estado')
      .then((res) => setDisponible(res.data.disponible))
      .catch(() => setDisponible(false));
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      if (messages.length === 0) {
        setTimeout(() => agregarMensaje('bot', MSG_BIENVENIDA), 300);
      }
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, cargando]);

  const agregarMensaje = (from, text) => {
    setMessages((prev) => [...prev, { from, text }]);
  };

  const handleEnviar = async () => {
    const texto = input.trim();
    if (!texto || cargando) return;

    const historial = messages.slice(-12).map((msg) => ({
      from: msg.from,
      text: msg.text
    }));

    setInput('');
    agregarMensaje('user', texto);
    setCargando(true);

    try {
      const res = await api.post('/asistente/preguntar', {
        pregunta: texto,
        historial
      });
      agregarMensaje('bot', res.data.respuesta);
    } catch {
      agregarMensaje('bot', 'Lo siento, ahora mismo no puedo responder. Puedes contactar con nosotros directamente a traves del formulario de contacto.');
    } finally {
      setCargando(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  };

  if (disponible === false) {
    return <Chatbot />;
  }

  return (
    <>
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">BE</div>
              <div>
                <strong>BlueArc Asistente</strong>
                <span>Preguntame lo que quieras</span>
              </div>
            </div>
            <button className="asistente-header-close" onClick={() => setIsOpen(false)} title="Cerrar">
              <X size={18} />
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chatbot-bubble chatbot-bubble--${msg.from}`}>
                {msg.text}
              </div>
            ))}
            {cargando && (
              <div className="chatbot-bubble chatbot-bubble--bot asistente-typing">
                <span /><span /><span />
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="asistente-input-area">
            <input
              ref={inputRef}
              type="text"
              className="asistente-input"
              placeholder="Escribe tu pregunta..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={cargando}
              autoFocus
            />
            <button
              className="asistente-send-btn"
              onClick={handleEnviar}
              disabled={!input.trim() || cargando}
              title="Enviar"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      <button
        className={`chatbot-fab ${isOpen ? 'chatbot-fab--open' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        title="Asistente virtual"
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </>
  );
}

export default AsistenteIA;
