// Parsea fechas del chat normalizando a UTC las que no traen zona horaria
export const parseChatDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const str = String(value);
  if (/[zZ]|[+\-]\d{2}:\d{2}$/.test(str)) return new Date(str);
  return new Date(`${str}Z`);
};

// Formatea hora HH:mm para la burbuja de mensaje
export const formatearHora = (fecha) => {
  const d = parseChatDate(fecha);
  if (!d || Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
};

// Formatea fecha para la lista de conversaciones: hoy → hora, otro día → DD/MM
export const formatearFechaLista = (fecha) => {
  if (!fecha) return '';
  const date = parseChatDate(fecha);
  if (!date || Number.isNaN(date.getTime())) return '';
  const hoy = new Date();
  if (date.toDateString() === hoy.toDateString()) {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
};

// Devuelve la fecha más reciente de una conversación para ordenarla
export const getConversationSortDate = (conv) =>
  conv?.ultimo_mensaje?.created_at || conv?.updated_at || conv?.created_at || 0;

// Comprueba si todos los otros participantes han leído el mensaje
export const allParticipantsRead = (otrosParticipantes, mensaje) =>
  otrosParticipantes.every((p) => {
    const readDate = parseChatDate(p.last_read);
    const messageDate = parseChatDate(mensaje.created_at);
    if (!readDate || !messageDate) return false;
    if (Number.isNaN(readDate.getTime()) || Number.isNaN(messageDate.getTime())) return false;
    return readDate.getTime() >= messageDate.getTime();
  });
