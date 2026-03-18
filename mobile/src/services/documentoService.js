import api from './api';

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
    const response = await api.get(`/documentos/${documento.id}/download`, {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', documento.nombre);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
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
