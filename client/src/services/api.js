import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Tunnel APIs
export const tunnelAPI = {
  getAll: () => api.get('/tunnels'),
  getSaved: () => api.get('/tunnels/saved'),
  create: (data) => api.post('/tunnels', data),
  get: (id) => api.get(`/tunnels/${id}`),
  close: (id) => api.post(`/tunnels/${id}/close`),
  start: (id) => api.post(`/tunnels/${id}/start`),
  update: (id, data) => api.put(`/tunnels/${id}`, data),
  checkStatus: (id) => api.post(`/tunnels/${id}/check`),
  delete: (id) => api.delete(`/tunnels/${id}`),
  deleteSaved: (id) => api.delete(`/tunnels/saved/${id}`)
};

// SSL APIs
export const sslAPI = {
  generate: (data) => api.post('/ssl/generate', data),
  getAll: () => api.get('/ssl'),
  get: (fileName) => api.get(`/ssl/${fileName}`),
  download: (fileName) => api.get(`/ssl/${fileName}/download`, { responseType: 'blob' }),
  downloadKey: (fileName) => api.get(`/ssl/${fileName}/download-key`, { responseType: 'blob' }),
  delete: (fileName) => api.delete(`/ssl/${fileName}`)
};

// SSL Server APIs
export const sslServerAPI = {
  getAll: () => api.get('/ssl-servers'),
  get: (id) => api.get(`/ssl-servers/${id}`),
  create: (data) => api.post('/ssl-servers', data),
  update: (id, data) => api.put(`/ssl-servers/${id}`, data),
  delete: (id) => api.delete(`/ssl-servers/${id}`),
  test: (id) => api.post(`/ssl-servers/${id}/test`)
};

export default api;
