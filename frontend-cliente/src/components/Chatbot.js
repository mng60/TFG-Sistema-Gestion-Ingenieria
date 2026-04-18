import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, X } from 'lucide-react';
import '../styles/Chatbot.css';

const FAQ = [
  {
    id: 'servicios',
    pregunta: '¿Qué servicios ofrecéis?',
    respuesta: 'Realizamos instalaciones eléctricas industriales y residenciales, proyectos fotovoltaicos, legalización de instalaciones, domótica y contratos de mantenimiento preventivo.',
  },
  {
    id: 'presupuesto',
    pregunta: '¿Cómo solicito un presupuesto?',
    respuesta: 'Puedes solicitar un presupuesto gratuito a través de nuestro formulario de contacto. Un técnico se pondrá en contacto contigo en menos de 24 horas.',
  },
  {
    id: 'plazo',
    pregunta: '¿Cuánto tarda un proyecto?',
    respuesta: 'Depende del alcance. Una instalación residencial suele completarse en 1-2 semanas. Los proyectos industriales requieren entre 1 y 3 meses, incluyendo la legalización.',
  },
  {
    id: 'zona',
    pregunta: '¿En qué zonas trabajáis?',
    respuesta: 'Trabajamos principalmente en Murcía. Para proyectos fuera de nuestra zona habitual, consúltanos y lo valoramos sin compromiso.',
  },
  {
    id: 'solar',
    pregunta: '¿Instaláis placas solares?',
    respuesta: 'Sí. Diseñamos, instalamos y legalizamos sistemas fotovoltaicos para hogares y empresas, con o sin acumulación en baterías.',
  },
  {
    id: 'portal',
    pregunta: 'Soy cliente, ¿cómo accedo?',
    respuesta: 'Puedes acceder al área privada desde el botón "Área Cliente" en el pie de página o en la cabecera. Si no tienes credenciales aún, contáctanos y te las facilitamos.',
  },
];

const MSG_BIENVENIDA =
  '¡Hola! Soy el asistente virtual de BlueArc Energy 👋 Selecciona una pregunta frecuente o indica que no encuentras lo que buscas.';

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [step, setStep] = useState('faq');
  const [usedFaqs, setUsedFaqs] = useState(new Set());
  const [processing, setProcessing] = useState(false);
  const bottomRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    }

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [isOpen]);

  const resetConversacion = () => {
    setMessages([]);
    setStep('faq');
    setUsedFaqs(new Set());
    setProcessing(false);
  };

  const addMessage = (from, text) => {
    setMessages((prev) => [...prev, { from, text }]);
  };

  const handleOpen = () => {
    setIsOpen(true);
    setTimeout(() => addMessage('bot', MSG_BIENVENIDA), 300);
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(resetConversacion, 250);
  };

  const handleFaq = (faq) => {
    if (processing) return;
    setProcessing(true);
    addMessage('user', faq.pregunta);
    setUsedFaqs((prev) => new Set([...prev, faq.id]));
    setTimeout(() => {
      addMessage('bot', faq.respuesta);
      setStep('answered');
      setProcessing(false);
    }, 400);
  };

  const handleMasPreguntas = () => {
    if (processing) return;
    setProcessing(true);
    addMessage('user', 'Tengo más preguntas');
    setTimeout(() => {
      addMessage('bot', '¿En qué más puedo ayudarte?');
      setStep('faq');
      setProcessing(false);
    }, 300);
  };

  const handleNoEncontrado = () => {
    if (processing) return;
    setProcessing(true);
    addMessage('user', 'No está ahí mi pregunta');
    setTimeout(() => {
      addMessage('bot', 'Lamentamos no poder resolver tu duda aquí. Puedes usar nuestro formulario de contacto y te responderemos en menos de 24 horas.');
      setStep('contact');
      setProcessing(false);
    }, 400);
  };

  const handleContacto = () => {
    navigate('/contacto');
    window.scrollTo({ top: 0, behavior: 'instant' });
    handleClose();
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const faqsRestantes = FAQ.filter((f) => !usedFaqs.has(f.id));
  const todasRespondidas = faqsRestantes.length === 0;

  return (
    <>
      {isOpen && (
        <div className="chatbot-window">
          {/* Header sin botón X */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">Blue</div>
              <div>
                <strong>Blue</strong>
                <span>Asistente de BlueArc Ingenieria</span>
              </div>
            </div>
          </div>

          {/* Área de mensajes — solo burbujas, sin quick replies */}
          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chatbot-bubble chatbot-bubble--${msg.from}`}>
                {msg.text}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies FUERA del scroll — fijos en la parte inferior */}
          {messages.length > 0 && !processing && (
            <div className="chatbot-quick-replies">
              {step === 'faq' && (
                <>
                  {todasRespondidas ? (
                    <p className="chatbot-no-more">Has visto todas las preguntas frecuentes.</p>
                  ) : (
                    faqsRestantes.map((faq) => (
                      <button key={faq.id} className="chatbot-qr" onClick={() => handleFaq(faq)}>
                        {faq.pregunta}
                      </button>
                    ))
                  )}
                  <button className="chatbot-qr chatbot-qr--secondary" onClick={handleNoEncontrado}>
                    No está ahí mi pregunta
                  </button>
                </>
              )}

              {step === 'answered' && (
                <>
                  {!todasRespondidas && (
                    <button className="chatbot-qr chatbot-qr--more" onClick={handleMasPreguntas}>
                      Tengo más preguntas
                    </button>
                  )}
                  <button className="chatbot-qr chatbot-qr--secondary" onClick={handleNoEncontrado}>
                    No está ahí mi pregunta
                  </button>
                </>
              )}

              {step === 'contact' && (
                <button className="chatbot-qr chatbot-qr--contact" onClick={handleContacto}>
                  Ir al formulario de contacto →
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <button
        className={`chatbot-fab ${isOpen ? 'chatbot-fab--open' : ''}`}
        onClick={isOpen ? handleClose : handleOpen}
        title="Asistente virtual"
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </>
  );
}

export default Chatbot;
