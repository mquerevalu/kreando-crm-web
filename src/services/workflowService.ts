import axios from 'axios';
import { Workflow, FlowStep, WorkflowConnection } from '../types/index';

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

// Mock workflow con tu estructura real
const MOCK_WORKFLOWS: Workflow[] = [
  {
    id: 'workflow-1',
    companyId: 'company-456',
    name: 'Consulta de Lavandería',
    description: 'Flujo para consultar sobre servicios de lavandería',
    flujoBot: [
      {
        fieldName: 'nombre',
        question: '¿Cuál es tu nombre?',
        stepId: 'step-1',
        type: 'text',
        validation: { required: true, type: 'text' },
      },
      {
        errorMessage: 'Por favor ingresa un email válido',
        fieldName: 'email',
        question: '¿Cuál es tu email?',
        stepId: 'step-2',
        type: 'text',
        validation: { required: true, type: 'email' },
      },
      {
        errorMessage: 'Por favor ingresa un teléfono válido',
        fieldName: 'telefono',
        question: '¿Cuál es tu teléfono?',
        stepId: 'step-3',
        type: 'text',
        validation: { required: true, type: 'phone' },
      },
      {
        fieldName: 'tipoNegocio',
        options: [
          { id: 'opt-1', label: 'Doméstico', value: 'domestico' },
          { id: 'opt-2', label: 'Lav. Comercial', value: 'lavanderia' },
          { id: 'opt-3', label: 'Hotel/Hospedaje', value: 'hotel' },
          { id: 'opt-4', label: 'Hospital/Clínica', value: 'hospital' },
        ],
        question: '¿Qué tipo de negocio necesitas?',
        stepId: 'step-4',
        type: 'select',
        validation: { required: true, type: 'select' },
      },
      {
        dependsOn: 'tipoNegocio',
        fieldName: 'cantidadMaquinasDomestico',
        options: [
          { id: 'opt-1', label: '1 máquina', value: '1' },
          { id: 'opt-2', label: '2 máquinas', value: '2' },
          { id: 'opt-3', label: '3 o más máquinas', value: '3+' },
        ],
        question: '¿Cuántas máquinas para tu hogar?',
        showWhen: 'domestico',
        stepId: 'step-5-domestico',
        type: 'select',
        validation: { required: true, type: 'select' },
      },
      {
        dependsOn: 'tipoNegocio',
        fieldName: 'cantidadMaquinasLavanderia',
        options: [
          { id: 'opt-1', label: '5-10 máquinas', value: '5-10' },
          { id: 'opt-2', label: '10-20 máquinas', value: '10-20' },
          { id: 'opt-3', label: '20+ máquinas', value: '20+' },
        ],
        question: '¿Cuántas máquinas para tu lavandería?',
        showWhen: 'lavanderia',
        stepId: 'step-5-lavanderia',
        type: 'select',
        validation: { required: true, type: 'select' },
      },
      {
        dependsOn: 'tipoNegocio',
        fieldName: 'habitacionesHotel',
        options: [
          { id: 'opt-1', label: '10-50 habitaciones', value: '10-50' },
          { id: 'opt-2', label: '50-100 habitaciones', value: '50-100' },
          { id: 'opt-3', label: '100+ habitaciones', value: '100+' },
        ],
        question: '¿Cuántas habitaciones tiene tu hotel?',
        showWhen: 'hotel',
        stepId: 'step-5-hotel',
        type: 'select',
        validation: { required: true, type: 'select' },
      },
      {
        dependsOn: 'tipoNegocio',
        fieldName: 'camasHospital',
        options: [
          { id: 'opt-1', label: '10-50 camas', value: '10-50' },
          { id: 'opt-2', label: '50-100 camas', value: '50-100' },
          { id: 'opt-3', label: '100+ camas', value: '100+' },
        ],
        question: '¿Cuántas camas tiene tu institución?',
        showWhen: 'hospital',
        stepId: 'step-5-hospital',
        type: 'select',
        validation: { required: true, type: 'select' },
      },
      {
        fieldName: 'presupuesto',
        options: [
          { id: 'opt-1', label: '$1,000 - $5,000', value: '1000-5000' },
          { id: 'opt-2', label: '$5,000 - $10,000', value: '5000-10000' },
          { id: 'opt-3', label: '$10,000 - $20,000', value: '10000-20000' },
          { id: 'opt-4', label: '$20,000+', value: '20000+' },
        ],
        question: '¿Cuál es tu presupuesto?',
        stepId: 'step-6',
        type: 'select',
        validation: { required: true, type: 'select' },
      },
    ],
    connections: [
      { id: 'conn-1', sourceStepId: 'step-1', targetStepId: 'step-2', label: 'Siguiente' },
      { id: 'conn-2', sourceStepId: 'step-2', targetStepId: 'step-3', label: 'Siguiente' },
      { id: 'conn-3', sourceStepId: 'step-3', targetStepId: 'step-4', label: 'Siguiente' },
      { id: 'conn-4', sourceStepId: 'step-4', targetStepId: 'step-5-domestico', label: 'Doméstico' },
      { id: 'conn-5', sourceStepId: 'step-4', targetStepId: 'step-5-lavanderia', label: 'Lavandería' },
      { id: 'conn-6', sourceStepId: 'step-4', targetStepId: 'step-5-hotel', label: 'Hotel' },
      { id: 'conn-7', sourceStepId: 'step-4', targetStepId: 'step-5-hospital', label: 'Hospital' },
      { id: 'conn-8', sourceStepId: 'step-5-domestico', targetStepId: 'step-6', label: 'Siguiente' },
      { id: 'conn-9', sourceStepId: 'step-5-lavanderia', targetStepId: 'step-6', label: 'Siguiente' },
      { id: 'conn-10', sourceStepId: 'step-5-hotel', targetStepId: 'step-6', label: 'Siguiente' },
      { id: 'conn-11', sourceStepId: 'step-5-hospital', targetStepId: 'step-6', label: 'Siguiente' },
    ],
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Simular logs de API
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

export const workflowService = {
  getWorkflows: async (companyId: string): Promise<Workflow[]> => {
    logApiCall('GET', `/workflows?companyId=${companyId}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    const result = MOCK_WORKFLOWS.filter(w => w.companyId === companyId);
    logApiResponse('GET', `/workflows?companyId=${companyId}`, result);
    return result;
  },

  getWorkflow: async (id: string): Promise<Workflow> => {
    logApiCall('GET', `/workflows/${id}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    const workflow = MOCK_WORKFLOWS.find(w => w.id === id);
    if (!workflow) {
      throw new Error('Workflow no encontrado');
    }
    logApiResponse('GET', `/workflows/${id}`, workflow);
    return workflow;
  },

  createWorkflow: async (companyId: string, workflow: Partial<Workflow>): Promise<Workflow> => {
    logApiCall('POST', '/workflows', { companyId, ...workflow });
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newWorkflow: Workflow = {
      id: 'workflow-' + Date.now(),
      companyId,
      name: workflow.name || 'Nuevo Flujo',
      description: workflow.description || '',
      flujoBot: workflow.flujoBot || [],
      connections: workflow.connections || [],
      active: workflow.active || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    MOCK_WORKFLOWS.push(newWorkflow);
    logApiResponse('POST', '/workflows', newWorkflow);
    return newWorkflow;
  },

  updateWorkflow: async (id: string, updates: Partial<Workflow>): Promise<Workflow> => {
    logApiCall('PUT', `/workflows/${id}`, updates);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const index = MOCK_WORKFLOWS.findIndex(w => w.id === id);
    if (index === -1) {
      throw new Error('Workflow no encontrado');
    }

    MOCK_WORKFLOWS[index] = {
      ...MOCK_WORKFLOWS[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    logApiResponse('PUT', `/workflows/${id}`, MOCK_WORKFLOWS[index]);
    return MOCK_WORKFLOWS[index];
  },

  deleteWorkflow: async (id: string): Promise<void> => {
    logApiCall('DELETE', `/workflows/${id}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const index = MOCK_WORKFLOWS.findIndex(w => w.id === id);
    if (index === -1) {
      throw new Error('Workflow no encontrado');
    }

    MOCK_WORKFLOWS.splice(index, 1);
    logApiResponse('DELETE', `/workflows/${id}`, { success: true });
  },

  publishWorkflow: async (id: string): Promise<Workflow> => {
    logApiCall('POST', `/workflows/${id}/publish`);
    return workflowService.updateWorkflow(id, { active: true });
  },

  unpublishWorkflow: async (id: string): Promise<Workflow> => {
    logApiCall('POST', `/workflows/${id}/unpublish`);
    return workflowService.updateWorkflow(id, { active: false });
  },
};
