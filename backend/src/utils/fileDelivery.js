const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;

const isRemoteFile = (filePath = '') => /^https?:\/\//i.test(filePath);

// Extracts { publicId, resourceType } from a Cloudinary delivery URL.
// For image/video types the public_id has no extension; raw types keep it.
const parseCloudinaryUrl = (url) => {
  const match = url.match(/cloudinary\.com\/[^/]+\/(image|video|raw)\/upload\/(?:v\d+\/)?(.+)/);
  if (!match) return null;
  const resourceType = match[1];
  const fullPath = match[2];
  const publicId = resourceType === 'raw' ? fullPath : fullPath.replace(/\.[^./]+$/, '');
  return { publicId, resourceType };
};

const getCloudinaryDownloadUrl = (url, filename) => {
  const parsed = parseCloudinaryUrl(url);
  if (!parsed) return url;
  const { publicId, resourceType } = parsed;
  const safeFilename = (filename || 'archivo').replace(/[^a-zA-Z0-9._-]/g, '_');
  return cloudinary.url(publicId, {
    resource_type: resourceType,
    type: 'upload',
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + 300,
    flags: `attachment:${safeFilename}`,
    secure: true,
  });
};

const deleteCloudinaryFile = async (url) => {
  const parsed = parseCloudinaryUrl(url);
  if (!parsed) return;
  const { publicId, resourceType } = parsed;
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

// Short-lived token authorising a one-shot local file stream (dev fallback).
const getLocalDownloadToken = (docId) =>
  jwt.sign({ docId: String(docId), purpose: 'download' }, process.env.JWT_SECRET, { expiresIn: '5m' });

const verifyLocalDownloadToken = (token, docId) => {
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  if (payload.purpose !== 'download' || payload.docId !== String(docId)) {
    const err = new Error('Token de descarga inválido');
    err.status = 403;
    throw err;
  }
};

const sendLocalFile = (res, filePath, downloadName) =>
  new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      const error = new Error('Archivo no encontrado en el servidor');
      error.status = 404;
      return reject(error);
    }
    const safeName = (downloadName || path.basename(filePath)).replace(/["\r\n]/g, '_');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`);
    res.download(filePath, safeName, (err) => (err ? reject(err) : resolve()));
  });

module.exports = {
  isRemoteFile,
  parseCloudinaryUrl,
  getCloudinaryDownloadUrl,
  deleteCloudinaryFile,
  getLocalDownloadToken,
  verifyLocalDownloadToken,
  sendLocalFile,
};
