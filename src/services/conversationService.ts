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

interface Conversation {
  id: string;
  pageId: string;
  senderId: string;
  phoneNumber: string;
  participantName?: string;
  lastMessage: string;
  lastMessageTime: string;
  status: 'active' | 'archived' | 'completed';
}

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  direction: 'inbound' | 'outbound';
}

// Mock data para desarrollo
const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    pageId: 'whatsapp-1026217640567682',
    senderId: '51940281263',
    phoneNumber: '+34 612 345 678',
    participantName: 'Juan García',
    lastMessage: 'Hola, ¿cuál es el precio de la lavadora?',
    lastMessageTime: 'Hace 5 minutos',
    status: 'active',
  },
  {
    id: 'conv-2',
    pageId: 'whatsapp-1026217640567682',
    senderId: '51940281264',
    phoneNumber: '+34 623 456 789',
    participantName: 'María López',
    lastMessage: 'Gracias por la información',
    lastMessageTime: 'Hace 1 hora',
    status: 'active',
  },
  {
    id: 'conv-3',
    pageId: 'whatsapp-1026217640567682',
    senderId: '51940281265',
    phoneNumber: '+34 634 567 890',
    participantName: 'Carlos Rodríguez',
    lastMessage: 'Necesito una cotización urgente',
    lastMessageTime: 'Hace 2 horas',
    status: 'active',
  },
];

const MOCK_MESSAGES: { [key: string]: Message[] } = {
  'conv-1': [
    {
      id: 'msg-1',
      sender: 'Juan García',
      content: 'Hola, ¿cuál es el precio de la lavadora?',
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
      direction: 'inbound',
    },
    {
      id: 'msg-2',
      sender: 'Bot',
      content: 'Hola Juan, nuestras lavadoras tienen precios desde $500 hasta $2000 según el modelo.',
      timestamp: new Date(Date.now() - 4 * 60000).toISOString(),
      direction: 'outbound',
    },
    {
      id: 'msg-3',
      sender: 'Juan García',
      content: '¿Cuál es la diferencia entre los modelos?',
      timestamp: new Date(Date.now() - 3 * 60000).toISOString(),
      direction: 'inbound',
    },
    {
      id: 'msg-4',
      sender: 'Bot',
      content: 'El modelo básico tiene 8kg de capacidad, el intermedio 12kg y el premium 15kg con ciclos especiales.',
      timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
      direction: 'outbound',
    },
  ],
  'conv-2': [
    {
      id: 'msg-5',
      sender: 'María López',
      content: '¿Tienen servicio técnico?',
      timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
      direction: 'inbound',
    },
    {
      id: 'msg-6',
      sender: 'Bot',
      content: 'Sí, ofrecemos servicio técnico gratuito durante el primer año.',
      timestamp: new Date(Date.now() - 59 * 60000).toISOString(),
      direction: 'outbound',
    },
    {
      id: 'msg-7',
      sender: 'María López',
      content: 'Gracias por la información',
      timestamp: new Date(Date.now() - 58 * 60000).toISOString(),
      direction: 'inbound',
    },
  ],
  'conv-3': [
    {
      id: 'msg-8',
      sender: 'Carlos Rodríguez',
      content: 'Necesito una cotización urgente para 5 máquinas',
      timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
      direction: 'inbound',
    },
    {
      id: 'msg-9',
      sender: 'Bot',
      content: 'Claro Carlos, ¿para qué tipo de negocio necesitas las máquinas?',
      timestamp: new Date(Date.now() - 119 * 60000).toISOString(),
      direction: 'outbound',
    },
  ],
};

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

export const conversationService = {
  getConversations: async (pageId: string): Promise<Conversation[]> => {
    logApiCall('GET', `/conversations?pageId=${pageId}`);
    try {
      const response = await apiClient.get('/conversations', {
        params: { pageId },
      });
      logApiResponse('GET', `/conversations?pageId=${pageId}`, response.data);
      return response.data;
    } catch (error) {
      console.warn('API error, using mock data:', error);
      await new Promise(resolve => setTimeout(resolve, 500));
      logApiResponse('GET', `/conversations?pageId=${pageId}`, MOCK_CONVERSATIONS);
      return MOCK_CONVERSATIONS;
    }
  },

  getMessages: async (pageId: string, senderId: string, limit: number = 200): Promise<Message[]> => {
    logApiCall('GET', `/conversations/messages?pageId=${pageId}&senderId=${senderId}&limit=${limit}`);
    try {
      const response = await apiClient.get('/conversations/messages', {
        params: { pageId, senderId, limit },
      });
      logApiResponse('GET', `/conversations/messages`, response.data);
      // Si la respuesta tiene un objeto con 'messages', extraer solo los mensajes
      const messages = Array.isArray(response.data) ? response.data : response.data.messages || [];
      return messages;
    } catch (error) {
      console.warn('API error, using mock data:', error);
      await new Promise(resolve => setTimeout(resolve, 300));
      const conversationId = `${pageId}#${senderId}`;
      const messages = MOCK_MESSAGES[conversationId] || [];
      logApiResponse('GET', `/conversations/messages`, messages);
      return messages;
    }
  },

  sendMessage: async (pageId: string, senderId: string, content: string): Promise<Message> => {
    logApiCall('POST', `/conversations/messages?pageId=${pageId}&senderId=${senderId}`, { content });
    try {
      const response = await apiClient.post('/conversations/messages', { content }, {
        params: { pageId, senderId },
      });
      logApiResponse('POST', `/conversations/messages`, response.data);
      return response.data;
    } catch (error) {
      console.warn('API error, using mock data:', error);
      await new Promise(resolve => setTimeout(resolve, 500));
      const newMessage: Message = {
        id: 'msg-' + Date.now(),
        sender: 'Agente',
        content,
        timestamp: new Date().toISOString(),
        direction: 'outbound',
      };
      logApiResponse('POST', `/conversations/messages`, newMessage);
      return newMessage;
    }
  },

  sendFile: async (pageId: string, senderId: string, fileUrl: string, fileType: string, fileName?: string, caption?: string): Promise<Message> => {
    logApiCall('POST', `/conversations/messages?pageId=${pageId}&senderId=${senderId}`, { fileUrl, fileType, fileName, caption });
    try {
      const response = await apiClient.post('/conversations/messages', { fileUrl, fileType, fileName, caption }, {
        params: { pageId, senderId },
      });
      logApiResponse('POST', `/conversations/messages`, response.data);
      return response.data;
    } catch (error) {
      console.warn('API error:', error);
      throw error;
    }
  },

  sendFileBlob: async (pageId: string, senderId: string, file: File, fileType: string, caption?: string): Promise<Message> => {
    logApiCall('POST', `/conversations/messages?pageId=${pageId}&senderId=${senderId}`, { fileName: file.name, fileType, caption });
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', fileType);
      if (caption) {
        formData.append('caption', caption);
      }

      const response = await apiClient.post('/conversations/messages', formData, {
        params: { pageId, senderId },
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      logApiResponse('POST', `/conversations/messages`, response.data);
      return response.data;
    } catch (error) {
      console.warn('API error:', error);
      throw error;
    }
  },

  archiveConversation: async (pageId: string, senderId: string): Promise<void> => {
    logApiCall('PUT', `/conversations/archive?pageId=${pageId}&senderId=${senderId}`);
    try {
      const response = await apiClient.put('/conversations/archive', {}, {
        params: { pageId, senderId },
      });
      logApiResponse('PUT', `/conversations/archive`, response.data);
    } catch (error) {
      console.warn('API error:', error);
      throw error;
    }
  },

  markAsRead: async (pageId: string, senderId: string): Promise<void> => {
    logApiCall('PUT', `/conversations/read?pageId=${pageId}&senderId=${senderId}`);
    try {
      const response = await apiClient.put('/conversations/read', {}, {
        params: { pageId, senderId },
      });
      logApiResponse('PUT', `/conversations/read`, response.data);
    } catch (error) {
      console.warn('API error:', error);
    }
  },

  sendToWebhook: async (webhookUrl: string, conversationData: any): Promise<any> => {
    logApiCall('POST', webhookUrl, conversationData);
    try {
      const response = await axios.post(webhookUrl, conversationData);
      logApiResponse('POST', webhookUrl, response.data);
      return response.data;
    } catch (error) {
      console.error('Webhook error:', error);
      throw error;
    }
  },
};
