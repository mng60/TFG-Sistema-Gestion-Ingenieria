export const formatearFecha = (fecha) => {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleDateString('es-ES');
};

// Formato largo: "15 ene 2024"
export const formatearFechaCorta = (fecha) => {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
};

// Formato con hora: "15/01/2024, 14:30"
export const formatearFechaHora = (fecha) => {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

export const getAvatarInitial = (nombre, fallback = '?') =>
  nombre?.charAt(0).toUpperCase() || fallback;
