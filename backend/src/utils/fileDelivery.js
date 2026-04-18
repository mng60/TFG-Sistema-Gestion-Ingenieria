const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const { pipeline } = require('stream');

const isRemoteFile = (filePath = '') => /^https?:\/\//i.test(filePath);
const MAX_REDIRECTS = 5;

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

// Inserts fl_attachment directly into the stored URL — no SDK signing needed since
// files are uploaded as type:upload (public). sign_url+expires_at+flags together
// generate a broken signature in the Cloudinary Node SDK.
const getCloudinaryDownloadUrl = (url, filename) => {
  const safeFilename = (filename || 'archivo').replace(/[^a-zA-Z0-9._-]/g, '_');
  return url.replace('/upload/', `/upload/fl_attachment:${safeFilename}/`);
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

const streamRemoteFile = (res, fileUrl, downloadName, redirectCount = 0) =>
  new Promise((resolve, reject) => {
    if (redirectCount > MAX_REDIRECTS) {
      const error = new Error('Demasiadas redirecciones al descargar el archivo remoto');
      error.status = 502;
      reject(error);
      return;
    }

    const client = fileUrl.startsWith('https://') ? https : http;

    const request = client.get(fileUrl, (remoteResponse) => {
      if (
        remoteResponse.statusCode >= 300 &&
        remoteResponse.statusCode < 400 &&
        remoteResponse.headers.location
      ) {
        remoteResponse.resume();
        const redirectUrl = new URL(remoteResponse.headers.location, fileUrl).toString();
        resolve(streamRemoteFile(res, redirectUrl, downloadName, redirectCount + 1));
        return;
      }

      if (remoteResponse.statusCode !== 200) {
        remoteResponse.resume();
        const error = new Error(`El archivo remoto devolvió ${remoteResponse.statusCode}`);
        error.status = remoteResponse.statusCode === 404 ? 404 : 502;
        reject(error);
        return;
      }

      const safeName = (downloadName || 'archivo').replace(/["\r\n]/g, '_');
      res.setHeader('Content-Disposition', `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`);
      res.setHeader('Content-Type', remoteResponse.headers['content-type'] || 'application/octet-stream');

      if (remoteResponse.headers['content-length']) {
        res.setHeader('Content-Length', remoteResponse.headers['content-length']);
      }

      pipeline(remoteResponse, res, (error) => (error ? reject(error) : resolve()));
    });

    request.on('error', reject);
  });

const sendStoredFile = async (res, filePath, downloadName) => {
  if (!isRemoteFile(filePath)) {
    return sendLocalFile(res, filePath, downloadName);
  }

  return streamRemoteFile(res, filePath, downloadName);
};

module.exports = {
  isRemoteFile,
  parseCloudinaryUrl,
  getCloudinaryDownloadUrl,
  deleteCloudinaryFile,
  getLocalDownloadToken,
  verifyLocalDownloadToken,
  sendLocalFile,
  sendStoredFile,
};
