import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('teacher');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API functions
export const studentAPI = {
  getAll: () => api.get('/api/students'),
  create: (student) => api.post('/api/students', student),
  getById: (id) => api.get(`/api/students/${id}`),
};

export const policyAPI = {
  get: () => api.get('/api/policies'),
  update: (policy) => api.put('/api/policies', policy),
};

export const analyticsAPI = {
  getUsage: () => api.get('/api/dashboard/usage'),
  getStudentActivity: () => api.get('/api/dashboard/students/activity'),
};

export default api;
