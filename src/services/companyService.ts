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

export interface Company {
  configId: string;
  nombreEmpresa: string;
  phoneNumberId: string;
  wspNumberId: string;
  accessToken: string;
  accountId: string;
  agentActive: boolean;
  estado: 'active' | 'inactive';
  prompt: string;
  urlWebHook: string;
  pineconeNamespaces?: string | string[];
  fechaCreacion: number;
  fechaActualizacion: number;
  flujoBot?: any[];
}

const logApiCall = (method: string, endpoint: string, data?: any) => {
  console.log(`%c[API] ${method} ${endpoint}`, 'color: #0066cc; font-weight: bold;');
  if (data) {
    console.log('%cPayload:', 'color: #666; font-weight: bold;', JSON.stringify(data, null, 2));
  }
};

const logApiResponse = (method: string, endpoint: string, response: any) => {
  console.log(`%c[API RESPONSE] ${method} ${endpoint}`, 'color: #00aa00; font-weight: bold;');
  console.log('%cResponse:', 'color: #666; font-weight: bold;', JSON.stringify(response, null, 2));
};

export const companyService = {
  getCompanies: async (): Promise<Company[]> => {
    logApiCall('GET', '/companies');
    try {
      const response = await apiClient.get('/companies');
      logApiResponse('GET', '/companies', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching companies:', error);
      throw error;
    }
  },

  getCompany: async (configId: string): Promise<Company> => {
    logApiCall('GET', `/companies/${configId}`);
    try {
      const response = await apiClient.get(`/companies/${configId}`);
      logApiResponse('GET', `/companies/${configId}`, response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching company:', error);
      throw error;
    }
  },

  updateCompany: async (configId: string, data: Partial<Company>): Promise<Company> => {
    logApiCall('PUT', `/companies/${configId}`, data);
    try {
      const response = await apiClient.put(`/companies/${configId}`, data);
      logApiResponse('PUT', `/companies/${configId}`, response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating company:', error);
      throw error;
    }
  },
};
