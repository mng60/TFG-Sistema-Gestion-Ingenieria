import api from './api';
import { downloadUrlToDevice } from '../utils/nativeDownloads';

const documentoService = {
  getByProyecto: async (proyectoId) => {
    const response = await api.get(`/documentos?proyecto_id=${proyectoId}`);
    return response.data;
  },

  togglePublico: async (id, esPublico) => {
    const response = await api.put(`/documentos/${id}`, { es_publico: esPublico });
    return response.data;
  },

  descargar: async (documento) => {
    const { data } = await api.get(`/documentos/${documento.id}/download`);
    return downloadUrlToDevice({
      url: data.downloadUrl,
      fileName: documento.nombre,
      category: 'document'
    });
  },

  setAccesoEmpleados: async (id, userIds) => {
    const response = await api.put(`/documentos/${id}/acceso-empleados`, { user_ids: userIds });
    return response.data;
  },

  upload: async (formDataPayload) => {
    const response = await api.post('/documentos/upload', formDataPayload, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};

export default documentoService;
