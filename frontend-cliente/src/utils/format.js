export const formatearFecha = (fecha) => {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleDateString('es-ES');
};

// Formato largo para archivos: "15 ene 2024"
export const formatearFechaArchivo = (fecha) => {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
};

export const formatearMoneda = (valor) =>
  valor
    ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(valor)
    : '0,00 €';

export const getAvatarInitial = (nombre, fallback = '?') =>
  nombre?.charAt(0).toUpperCase() || fallback;

export const getAvatarSrc = (fotoUrl) => {
  if (!fotoUrl) return null;
  if (fotoUrl.startsWith('http')) return fotoUrl;
  const BACKEND = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
  return `${BACKEND}${fotoUrl}`;
};
