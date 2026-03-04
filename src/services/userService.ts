import axios from 'axios';

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

export type UserRole = 'administrador' | 'operador' | 'asesor';

export interface User {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  active: boolean;
  createdAt: number;
  updatedAt: number;
  assignedCompanies?: string[];
  assignedConversations?: string[];
}

export const userService = {
  /**
   * Obtiene el perfil del usuario autenticado
   */
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get('/users/profile');
    return response.data;
  },

  /**
   * Lista todos los usuarios (solo administradores)
   */
  listUsers: async (): Promise<User[]> => {
    const response = await apiClient.get('/users');
    return response.data.users;
  },

  /**
   * Lista solo asesores activos asignados a una empresa específica (administradores y operadores)
   */
  listAdvisors: async (configId: string): Promise<User[]> => {
    const response = await apiClient.get(`/users/advisors?configId=${configId}`);
    return response.data.advisors;
  },

  /**
   * Crea o actualiza un usuario (solo administradores)
   */
  createOrUpdateUser: async (userId: string, email: string, name: string, role: UserRole, password?: string): Promise<User> => {
    const payload: any = {
      userId,
      email,
      name,
      role,
    };
    
    if (password) {
      payload.password = password;
    }
    
    const response = await apiClient.post('/users', payload);
    return response.data;
  },

  /**
   * Actualiza un usuario (solo administradores)
   */
  updateUser: async (userId: string, updates: Partial<Pick<User, 'name' | 'email' | 'role' | 'active'>> & { password?: string }): Promise<void> => {
    await apiClient.put(`/users/${userId}`, updates);
  },

  /**
   * Asigna una empresa a un usuario (solo administradores)
   */
  assignCompany: async (userId: string, configId: string): Promise<void> => {
    await apiClient.post(`/users/${userId}/companies`, { configId });
  },

  /**
   * Remueve la asignación de una empresa (solo administradores)
   */
  unassignCompany: async (userId: string, configId: string): Promise<void> => {
    await apiClient.delete(`/users/${userId}/companies/${configId}`);
  },

  /**
   * Asigna una conversación a un asesor (administradores y operadores)
   */
  assignConversation: async (userId: string, pageId: string, senderId: string): Promise<void> => {
    await apiClient.post(`/users/${userId}/conversations`, { pageId, senderId });
  },

  /**
   * Remueve la asignación de una conversación (administradores y operadores)
   */
  unassignConversation: async (userId: string, pageId: string, senderId: string): Promise<void> => {
    await apiClient.delete(`/users/${userId}/conversations`, { data: { pageId, senderId } });
  },

  /**
   * Obtiene la asignación actual de una conversación
   */
  getConversationAssignment: async (pageId: string, senderId: string): Promise<any> => {
    const response = await apiClient.get(`/users/conversation-assignment?pageId=${pageId}&senderId=${senderId}`);
    return response.data;
  },
};
