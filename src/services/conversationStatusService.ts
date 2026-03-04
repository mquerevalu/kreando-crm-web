import axios from 'axios';
 
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export interface ConversationStatus {
  statusId: string;
  configId: string; // empresa
  name: string;
  color: string; // hex color
  order: number;
  isDefault?: boolean; // estado por defecto para nuevas conversaciones
  createdAt?: string;
  updatedAt?: string;
}

export interface ConversationWithStatus {
  conversationId: string;
  pageId: string;
  senderId: string;
  statusId: string;
  statusName?: string;
  statusColor?: string;
  updatedAt: string;
}

class ConversationStatusService {
  // Obtener todos los estados de una empresa
  async getStatuses(configId: string): Promise<ConversationStatus[]> {
    const response = await axios.get(`${API_URL}/conversation-statuses/by-company/${configId}`);
    return response.data;
  }

  // Crear un nuevo estado
  async createStatus(status: Omit<ConversationStatus, 'statusId' | 'createdAt' | 'updatedAt'>): Promise<ConversationStatus> {
    const response = await axios.post(`${API_URL}/conversation-statuses`, status);
    return response.data;
  }

  // Actualizar un estado
  async updateStatus(statusId: string, updates: Partial<ConversationStatus>): Promise<ConversationStatus> {
    const response = await axios.put(`${API_URL}/conversation-statuses/update/${statusId}`, updates);
    return response.data;
  }

  // Eliminar un estado
  async deleteStatus(statusId: string): Promise<void> {
    await axios.delete(`${API_URL}/conversation-statuses/delete/${statusId}`);
  }

  // Actualizar el orden de los estados
  async reorderStatuses(configId: string, statusIds: string[]): Promise<void> {
    await axios.put(`${API_URL}/conversation-statuses/reorder/${configId}`, { statusIds });
  }

  // Asignar estado a una conversación
  async setConversationStatus(pageId: string, senderId: string, statusId: string, userId?: string, userName?: string, userEmail?: string): Promise<void> {
    await axios.put(`${API_URL}/conversations/${pageId}/${senderId}/status`, { 
      statusId,
      userId,
      userName,
      userEmail,
    });
  }

  // Obtener historial de cambios de estado de una conversación
  async getConversationHistory(pageId: string, senderId: string): Promise<any[]> {
    const response = await axios.get(`${API_URL}/conversations/${pageId}/${senderId}/history`);
    return response.data;
  }

  // Obtener conversaciones agrupadas por estado
  async getConversationsByStatus(configId: string): Promise<Record<string, ConversationWithStatus[]>> {
    const response = await axios.get(`${API_URL}/conversations-by-status/${configId}`);
    return response.data;
  }
}

export const conversationStatusService = new ConversationStatusService();
