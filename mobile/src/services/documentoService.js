import api from './api';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000/api`;

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
    const token = localStorage.getItem('empleado_token');
    const response = await axios.get(`${API_URL}/documentos/${documento.id}/download`, {
      headers: { Authorization: `Bearer ${token}` },
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
  }
};

export default documentoService;
