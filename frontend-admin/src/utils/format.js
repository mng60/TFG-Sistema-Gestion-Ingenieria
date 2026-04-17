export const formatearFecha = (fecha) => {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleDateString('es-ES');
};

export const formatearFechaHora = (fecha) => {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

export const formatearMoneda = (cantidad) => {
  if (!cantidad) return '-';
  return new Intl.NumberFormat('es-ES', {
    style: 'currency', currency: 'EUR'
  }).format(cantidad);
};

export const getAvatarInitial = (nombre, fallback = '?') =>
  nombre?.charAt(0).toUpperCase() || fallback;

export const getAvatarSrc = (fotoUrl) => {
  if (!fotoUrl) return null;
  if (fotoUrl.startsWith('http')) return fotoUrl;
  const BACKEND = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
  return `${BACKEND}${fotoUrl}`;
};
