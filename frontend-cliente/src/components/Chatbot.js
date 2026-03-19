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
    respuesta: 'Trabajamos principalmente en Andalucía. Para proyectos fuera de nuestra zona habitual, consúltanos y lo valoramos sin compromiso.',
  },
  {
    id: 'solar',
    pregunta: '¿Instaláis placas solares?',
    respuesta: 'Sí. Diseñamos, instalamos y legalizamos sistemas fotovoltaicos para hogares y empresas, con o sin acumulación en baterías.',
  },
  {
    id: 'portal',
    pregunta: 'Soy cliente, ¿cómo accedo?',
    respuesta: 'Puedes acceder al área privada desde el botón "Área Cliente" en el pie de página. Si no tienes credenciales aún, contáctanos y te las facilitamos.',
  },
];

const MSG_BIENVENIDA =
  '¡Hola! Soy el asistente virtual de BlueArc Energy 👋 Selecciona una pregunta frecuente o, si no encuentras lo que buscas, te redirijo al formulario de contacto.';

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [step, setStep] = useState('faq'); // 'faq' | 'answered'
  const [hasOpened, setHasOpened] = useState(false);
  const bottomRef = useRef(null);
  const navigate = useNavigate();

  const addMessage = (from, text) => {
    setMessages((prev) => [...prev, { from, text }]);
  };

  const open = () => {
    setIsOpen(true);
    if (!hasOpened) {
      setHasOpened(true);
      setTimeout(() => addMessage('bot', MSG_BIENVENIDA), 300);
    }
  };

  const handleFaq = (faq) => {
    addMessage('user', faq.pregunta);
    setTimeout(() => {
      addMessage('bot', faq.respuesta);
      setStep('answered');
    }, 400);
  };

  const handleMasPreguntas = () => {
    addMessage('user', 'Tengo más preguntas');
    setTimeout(() => {
      addMessage('bot', 'Por supuesto, ¿en qué más puedo ayudarte?');
      setStep('faq');
    }, 300);
  };

  const handleContacto = () => {
    navigate('/contacto');
    setIsOpen(false);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, step]);

  return (
    <>
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">BE</div>
              <div>
                <strong>BlueArc Asistente</strong>
                <span>Respuesta inmediata</span>
              </div>
            </div>
            <button className="chatbot-close" onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chatbot-bubble chatbot-bubble--${msg.from}`}>
                {msg.text}
              </div>
            ))}

            {messages.length > 0 && (
              <div className="chatbot-quick-replies">
                {step === 'faq' &&
                  FAQ.map((faq) => (
                    <button key={faq.id} className="chatbot-qr" onClick={() => handleFaq(faq)}>
                      {faq.pregunta}
                    </button>
                  ))}
                {step === 'answered' && (
                  <>
                    <button className="chatbot-qr" onClick={handleMasPreguntas}>
                      Tengo más preguntas
                    </button>
                    <button className="chatbot-qr chatbot-qr--contact" onClick={handleContacto}>
                      Contactar con vosotros →
                    </button>
                  </>
                )}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="chatbot-footer">
            <button className="chatbot-contact-btn" onClick={handleContacto}>
              Ir al formulario de contacto
            </button>
          </div>
        </div>
      )}

      <button
        className={`chatbot-fab ${isOpen ? 'chatbot-fab--open' : ''}`}
        onClick={isOpen ? () => setIsOpen(false) : open}
        title="Asistente virtual"
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </>
  );
}

export default Chatbot;
