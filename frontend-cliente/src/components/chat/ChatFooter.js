import React, { useState, useRef } from 'react';
import AttachmentMenu from './AttachmentMenu';

function ChatFooter({ onSendMessage, onTyping, onSendFile }) {
  const [mensaje, setMensaje] = useState('');
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const handleInputChange = (e) => {
    setMensaje(e.target.value);

    if (e.target.value.length > 0 && !isTyping) {
      setIsTyping(true);
      onTyping(true);
    }

    if (e.target.value.length === 0 && isTyping) {
      setIsTyping(false);
      onTyping(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      return;
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTyping(false);
    }, 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mensaje.trim()) {
      onSendMessage(mensaje.trim(), 'texto');
      setMensaje('');
      setIsTyping(false);
      onTyping(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleAttachment = (opcion) => {
    setShowAttachmentMenu(false);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = opcion.accept;
    input.onchange = (e) => handleFileSelect(e, opcion.tipo_mensaje);
    input.click();
  };

  const handleFileSelect = async (e, tipoMensaje) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      await onSendFile(file, tipoMensaje);
    } catch (error) {
      alert('Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="chat-footer">
      <form onSubmit={handleSubmit} className="message-input-form">
        <div className="footer-button-group">
          <button
            type="button"
            className="btn-footer btn-attachment"
            onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
            title="Adjuntar archivo"
            disabled={uploading}
          >
            {uploading ? '⏳' : '📎'}
          </button>
          {showAttachmentMenu && (
            <AttachmentMenu
              onSelect={handleAttachment}
              onClose={() => setShowAttachmentMenu(false)}
            />
          )}
        </div>

        <div className="message-input-container">
          <textarea
            ref={inputRef}
            value={mensaje}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={uploading ? 'Subiendo archivo...' : 'Escribe un mensaje...'}
            rows="1"
            className="message-input"
            disabled={uploading}
          />
        </div>

        {mensaje.trim() ? (
          <button type="submit" className="btn-footer btn-send" title="Enviar" disabled={uploading}>
            ➤
          </button>
        ) : (
          <button type="button" className="btn-footer btn-voice" disabled={uploading}>
            🎤
          </button>
        )}
      </form>
    </div>
  );
}

export default ChatFooter;
