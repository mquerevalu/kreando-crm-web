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

export interface WhatsAppTemplate {
  id: string;
  name: string;
  language: string;
  status: string;
  category: string;
  components: TemplateComponent[];
}

export interface TemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  format?: string;
  text?: string;
  buttons?: TemplateButton[];
  example?: {
    header_text?: string[];
    body_text?: string[][];
  };
}

export interface TemplateButton {
  type: string;
  text: string;
}

export const whatsappTemplateService = {
  /**
   * Obtiene las plantillas aprobadas de WhatsApp
   */
  getTemplates: async (phoneNumberId: string): Promise<WhatsAppTemplate[]> => {
    const response = await apiClient.get('/whatsapp/templates', {
      params: { phoneNumberId },
    });
    return response.data.templates;
  },

  /**
   * Envía un mensaje usando una plantilla
   */
  sendTemplate: async (
    phoneNumberId: string,
    to: string,
    templateName: string,
    languageCode: string,
    components?: any[],
    senderName?: string
  ): Promise<{ success: boolean; messageId: string }> => {
    const response = await apiClient.post('/whatsapp/send-template', {
      phoneNumberId,
      to,
      templateName,
      languageCode,
      components,
      senderName,
    });
    return response.data;
  },

  /**
   * Extrae las variables de una plantilla
   */
  extractVariables: (template: WhatsAppTemplate): { header: number; body: number } => {
    let headerVars = 0;
    let bodyVars = 0;

    template.components.forEach((component) => {
      if (component.type === 'HEADER' && component.text) {
        const matches = component.text.match(/\{\{(\d+)\}\}/g);
        headerVars = matches ? matches.length : 0;
      }
      if (component.type === 'BODY' && component.text) {
        const matches = component.text.match(/\{\{(\d+)\}\}/g);
        bodyVars = matches ? matches.length : 0;
      }
    });

    return { header: headerVars, body: bodyVars };
  },

  /**
   * Construye los componentes para enviar con variables
   */
  buildComponents: (
    template: WhatsAppTemplate,
    headerVars: string[],
    bodyVars: string[]
  ): any[] => {
    const components: any[] = [];

    template.components.forEach((component) => {
      if (component.type === 'HEADER' && headerVars.length > 0) {
        components.push({
          type: 'header',
          parameters: headerVars.map((value) => ({
            type: 'text',
            text: value,
          })),
        });
      }

      if (component.type === 'BODY' && bodyVars.length > 0) {
        components.push({
          type: 'body',
          parameters: bodyVars.map((value) => ({
            type: 'text',
            text: value,
          })),
        });
      }
    });

    return components;
  },
};
