import { create } from 'zustand';
import { Workflow, FlowStep } from '../types/index';
import { workflowService } from '../services/workflowService';

interface WorkflowStore {
  workflows: Workflow[];
  currentWorkflow: Workflow | null;
  isLoading: boolean;
  error: string | null;
  
  fetchWorkflows: (companyId: string) => Promise<void>;
  fetchWorkflow: (id: string) => Promise<void>;
  createWorkflow: (companyId: string, name: string, description: string) => Promise<Workflow>;
  updateWorkflow: (id: string, workflow: Partial<Workflow>) => Promise<void>;
  deleteWorkflow: (id: string) => Promise<void>;
  
  addStep: (step: FlowStep) => void;
  updateStep: (stepId: string, step: Partial<FlowStep>) => void;
  deleteStep: (stepId: string) => void;
  reorderSteps: (steps: FlowStep[]) => void;
  
  saveWorkflow: () => Promise<void>;
  clearError: () => void;
}

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  workflows: [],
  currentWorkflow: null,
  isLoading: false,
  error: null,

  fetchWorkflows: async (companyId: string) => {
    set({ isLoading: true, error: null });
    try {
      const workflows = await workflowService.getWorkflows(companyId);
      set({ workflows, isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Error al cargar flujos',
        isLoading: false,
      });
    }
  },

  fetchWorkflow: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const workflow = await workflowService.getWorkflow(id);
      set({ currentWorkflow: workflow, isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Error al cargar flujo',
        isLoading: false,
      });
    }
  },

  createWorkflow: async (companyId: string, name: string, description: string) => {
    set({ isLoading: true, error: null });
    try {
      const workflow = await workflowService.createWorkflow(companyId, {
        name,
        description,
        flujoBot: [],
        active: false,
      });
      set((state) => ({
        workflows: [...state.workflows, workflow],
        currentWorkflow: workflow,
        isLoading: false,
      }));
      return workflow;
    } catch (error: any) {
      set({
        error: error.message || 'Error al crear flujo',
        isLoading: false,
      });
      throw error;
    }
  },

  updateWorkflow: async (id: string, updates: Partial<Workflow>) => {
    set({ isLoading: true, error: null });
    try {
      await workflowService.updateWorkflow(id, updates);
      set((state) => ({
        workflows: state.workflows.map((w) => (w.id === id ? { ...w, ...updates } : w)),
        currentWorkflow: state.currentWorkflow?.id === id
          ? { ...state.currentWorkflow, ...updates }
          : state.currentWorkflow,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.message || 'Error al actualizar flujo',
        isLoading: false,
      });
    }
  },

  deleteWorkflow: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await workflowService.deleteWorkflow(id);
      set((state) => ({
        workflows: state.workflows.filter((w) => w.id !== id),
        currentWorkflow: state.currentWorkflow?.id === id ? null : state.currentWorkflow,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.message || 'Error al eliminar flujo',
        isLoading: false,
      });
    }
  },

  addStep: (step: FlowStep) => {
    set((state) => {
      if (!state.currentWorkflow) return state;
      return {
        currentWorkflow: {
          ...state.currentWorkflow,
          flujoBot: [...state.currentWorkflow.flujoBot, step],
        },
      };
    });
  },

  updateStep: (stepId: string, updates: Partial<FlowStep>) => {
    set((state) => {
      if (!state.currentWorkflow) return state;
      return {
        currentWorkflow: {
          ...state.currentWorkflow,
          flujoBot: state.currentWorkflow.flujoBot.map((s) =>
            s.stepId === stepId ? { ...s, ...updates } : s
          ),
        },
      };
    });
  },

  deleteStep: (stepId: string) => {
    set((state) => {
      if (!state.currentWorkflow) return state;
      return {
        currentWorkflow: {
          ...state.currentWorkflow,
          flujoBot: state.currentWorkflow.flujoBot.filter((s) => s.stepId !== stepId),
        },
      };
    });
  },

  reorderSteps: (steps: FlowStep[]) => {
    set((state) => {
      if (!state.currentWorkflow) return state;
      return {
        currentWorkflow: {
          ...state.currentWorkflow,
          flujoBot: steps,
        },
      };
    });
  },

  saveWorkflow: async () => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;

    set({ isLoading: true, error: null });
    try {
      await workflowService.updateWorkflow(currentWorkflow.id, currentWorkflow);
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Error al guardar flujo',
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
