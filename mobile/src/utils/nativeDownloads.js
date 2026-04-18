import { Capacitor, registerPlugin } from '@capacitor/core';

const MediaDownloads = registerPlugin('MediaDownloads');

const getApiBaseUrl = () =>
  process.env.REACT_APP_API_URL?.replace('/api', '') || `http://${window.location.hostname}:5000`;

const isNativeAndroid = () =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

const toAbsoluteUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${getApiBaseUrl()}${url}`;
};

const isBackendUrl = (url) => {
  try {
    const absoluteUrl = new URL(toAbsoluteUrl(url));
    return absoluteUrl.origin === new URL(getApiBaseUrl()).origin;
  } catch {
    return false;
  }
};

const blobToBase64 = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onloadend = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(blob);
});

const triggerBrowserDownload = (blob, fileName) => {
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.setAttribute('download', fileName || 'archivo');
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1500);
};

const normalizeFileName = (fileName, mimeType, category) => {
  if (fileName && fileName.includes('.')) {
    return fileName;
  }

  const extensionMap = {
    'application/pdf': '.pdf',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'audio/mpeg': '.mp3',
    'audio/wav': '.wav',
    'audio/ogg': '.ogg',
    'audio/mp4': '.m4a'
  };

  const extension = extensionMap[mimeType] || (category === 'image' ? '.jpg' : category === 'audio' ? '.mp3' : '');
  return `${fileName || 'archivo'}${extension}`;
};

const inferCategory = (mimeType = '', fileName = '') => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('audio/')) return 'audio';

  const lowerName = fileName.toLowerCase();
  if (/\.(jpg|jpeg|png|gif|webp)$/i.test(lowerName)) return 'image';
  if (/\.(mp3|wav|ogg|m4a|aac|webm)$/i.test(lowerName)) return 'audio';

  return 'document';
};

const saveBlobToDevice = async (blob, fileName, mimeType, category) => {
  const normalizedType = mimeType || blob.type || 'application/octet-stream';
  const normalizedCategory = category || inferCategory(normalizedType, fileName);
  const normalizedName = normalizeFileName(fileName, normalizedType, normalizedCategory);

  if (!isNativeAndroid()) {
    triggerBrowserDownload(blob, normalizedName);
    return {
      fileName: normalizedName,
      location: 'descarga del navegador',
      category: normalizedCategory
    };
  }

  const dataUrl = await blobToBase64(blob);
  return MediaDownloads.saveFile({
    fileName: normalizedName,
    mimeType: normalizedType,
    category: normalizedCategory,
    data: dataUrl
  });
};

export const downloadAxiosBlobToDevice = async (response, fallbackName, category) => {
  const contentType = response.headers?.['content-type'] || response.data?.type || 'application/octet-stream';
  const blob = response.data instanceof Blob
    ? response.data
    : new Blob([response.data], { type: contentType });

  return saveBlobToDevice(blob, fallbackName, contentType, category);
};

export const downloadUrlToDevice = async ({ url, fileName, category }) => {
  const absoluteUrl = toAbsoluteUrl(url);
  const headers = {};
  const token = localStorage.getItem('empleado_token');

  if (token && isBackendUrl(absoluteUrl)) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(absoluteUrl, {
    headers
  });

  if (!response.ok) {
    throw new Error(`La descarga falló con estado ${response.status}`);
  }

  const blob = await response.blob();
  const contentType = response.headers.get('content-type') || blob.type || 'application/octet-stream';
  return saveBlobToDevice(blob, fileName, contentType, category);
};

export const getDownloadLocationLabel = (category) => {
  if (category === 'image') return 'Imágenes/BlueArc';
  if (category === 'audio') return 'Música/BlueArc';
  return 'Descargas/BlueArc';
};
