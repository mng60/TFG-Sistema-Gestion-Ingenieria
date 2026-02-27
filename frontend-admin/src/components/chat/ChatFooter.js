import React, { useState, useRef, useEffect } from 'react';
import AttachmentMenu from './AttachmentMenu';

function ChatFooter({ onSendMessage, onTyping, onSendFile, showToast }) {
  const [mensaje, setMensaje] = useState('');
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

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
      console.error('Error al subir archivo:', error);
      showToast ? showToast(error.message || 'Error al subir el archivo', 'error') : alert(error.message || 'Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  };

  const handleVoiceRecord = async () => {
    if (!isRecording) {
      // --- INICIAR GRABACIÓN ---
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // Elegir el formato más compatible
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4';

        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          // Detener todas las pistas del stream
          stream.getTracks().forEach((t) => t.stop());

          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
          const file = new File([audioBlob], `audio_${Date.now()}.${ext}`, { type: mimeType });

          if (file.size > 0) {
            setUploading(true);
            try {
              await onSendFile(file, 'audio');
            } catch (err) {
              console.error('Error al enviar audio:', err);
              showToast ? showToast(err.message || 'Error al enviar el audio', 'error') : alert(err.message || 'Error al enviar el audio');
            } finally {
              setUploading(false);
            }
          }

          // Reset timer
          clearInterval(recordingTimerRef.current);
          setRecordingTime(0);
          setIsRecording(false);
        };

        mediaRecorder.start(250); // Recoger datos cada 250ms
        setIsRecording(true);
        setRecordingTime(0);

        // Contador de segundos
        recordingTimerRef.current = setInterval(() => {
          setRecordingTime((t) => t + 1);
        }, 1000);

      } catch (err) {
        console.error('Error al acceder al micrófono:', err);
        showToast ? showToast('No se pudo acceder al micrófono. Comprueba los permisos.', 'error') : alert('No se pudo acceder al micrófono.');
      }
    } else {
      // --- DETENER GRABACIÓN ---
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      clearInterval(recordingTimerRef.current);
    }
  };

  const formatRecordingTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="chat-footer">
      <form onSubmit={handleSubmit} className="message-input-form">
        {/* Botón adjuntar */}
        <div className="footer-button-group">
          <button
            type="button"
            className="btn-footer btn-attachment"
            onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
            title="Adjuntar archivo"
            disabled={uploading || isRecording}
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

        {/* Input de texto o indicador de grabación */}
        <div className="message-input-container">
          {isRecording ? (
            <div className="recording-indicator">
              <span className="recording-dot" />
              <span>Grabando {formatRecordingTime(recordingTime)}</span>
            </div>
          ) : (
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
          )}
        </div>

        {/* Botón enviar o grabación */}
        {mensaje.trim() && !isRecording ? (
          <button
            type="submit"
            className="btn-footer btn-send"
            title="Enviar"
            disabled={uploading}
          >
            ➤
          </button>
        ) : (
          <button
            type="button"
            className={`btn-footer btn-voice ${isRecording ? 'recording' : ''}`}
            onClick={handleVoiceRecord}
            title={isRecording ? 'Enviar audio' : 'Grabar audio'}
            disabled={uploading}
          >
            {isRecording ? '⏹️' : '🎤'}
          </button>
        )}
      </form>
    </div>
  );
}

export default ChatFooter;
