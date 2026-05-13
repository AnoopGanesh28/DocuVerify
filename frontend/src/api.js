import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000',
});

// Add a request interceptor to inject the JWT token if available
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Auth endpoints
export const login = (data) => API.post('/auth/login', data);
export const register = (data) => API.post('/auth/register', data);
export const getMe = () => API.get('/auth/me');

// Document endpoints
export const upload = (file) => {
  const form = new FormData();
  form.append('file', file);
  return API.post('/upload', form);
};

export const query = (question) => API.post('/query', { question });

export default API;
