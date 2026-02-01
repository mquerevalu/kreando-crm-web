import axios from 'axios';
import { AuthResponse } from '../types/index';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Agregar token a cada request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Mock credentials
const MOCK_USER = {
  id: 'user-123',
  email: 'demo@vectia.com',
  password: 'demo123',
  name: 'Demo User',
  companyId: 'company-456',
  role: 'admin' as const,
};

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock authentication
    if (email === MOCK_USER.email && password === MOCK_USER.password) {
      return {
        token: 'mock-jwt-token-' + Date.now(),
        user: {
          id: MOCK_USER.id,
          email: MOCK_USER.email,
          name: MOCK_USER.name,
          companyId: MOCK_USER.companyId,
          role: MOCK_USER.role,
        },
      };
    }

    throw new Error('Credenciales inválidas. Usa demo@vectia.com / demo123');
  },

  logout: async (): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 200));
  },

  validateToken: async (): Promise<boolean> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      return true;
    } catch {
      return false;
    }
  },
};
