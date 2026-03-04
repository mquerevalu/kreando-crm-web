import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, userService } from '../services/userService';

interface UserState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  loadUserProfile: () => Promise<void>;
  clearUser: () => void;
  
  // Helper methods
  isAdmin: () => boolean;
  isOperator: () => boolean;
  isAdvisor: () => boolean;
  canAccessCompany: (configId: string) => boolean;
  canAccessConversation: (pageId: string, senderId: string) => boolean;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user, error: null }),

      loadUserProfile: async () => {
        set({ isLoading: true, error: null });
        try {
          const user = await userService.getProfile();
          set({ user, isLoading: false });
        } catch (error: any) {
          console.error('Error loading user profile:', error);
          set({ 
            error: error.response?.data?.error || 'Error loading profile',
            isLoading: false,
            user: null,
          });
        }
      },

      clearUser: () => set({ user: null, error: null }),

      // Helper methods
      isAdmin: () => {
        const { user } = get();
        return user?.role === 'administrador';
      },

      isOperator: () => {
        const { user } = get();
        return user?.role === 'operador';
      },

      isAdvisor: () => {
        const { user } = get();
        return user?.role === 'asesor';
      },

      canAccessCompany: (configId: string) => {
        const { user } = get();
        if (!user) return false;
        
        // Administradores tienen acceso a todo
        if (user.role === 'administrador') return true;
        
        // Operadores y asesores solo a empresas asignadas
        return user.assignedCompanies?.includes(configId) || false;
      },

      canAccessConversation: (pageId: string, senderId: string) => {
        const { user } = get();
        if (!user) return false;
        
        // Administradores y operadores tienen acceso a todo
        if (user.role === 'administrador' || user.role === 'operador') return true;
        
        // Asesores solo a conversaciones asignadas
        const conversationId = `${pageId}#${senderId}`;
        return user.assignedConversations?.includes(conversationId) || false;
      },
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);
