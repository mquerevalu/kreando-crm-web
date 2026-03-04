import { create } from 'zustand';
import { cognitoService, CognitoUser } from '../services/cognitoService';
import { useUserStore } from './userStore';

interface AuthStore {
  user: CognitoUser | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isCheckingAuth: boolean;
  error: string | null;
  
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  isCheckingAuth: true,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await cognitoService.login(email, password);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }
      
      set({
        user: response.user,
        token: response.token,
        refreshToken: response.refreshToken || null,
        isAuthenticated: true,
        isLoading: false,
      });
      
      // Cargar el perfil del usuario inmediatamente después del login
      try {
        await useUserStore.getState().loadUserProfile();
      } catch (profileError) {
        console.error('Error loading user profile after login:', profileError);
        // No bloqueamos el login si falla la carga del perfil
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Error al iniciar sesión';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  logout: () => {
    cognitoService.logout();
    
    // Limpiar también el userStore
    useUserStore.getState().clearUser();
    
    // Limpiar TODAS las claves relacionadas con la aplicación
    const keysToRemove = [
      'token',
      'user',
      'refreshToken',
      'user-storage',
      // Claves de Cognito
      'CognitoIdentityServiceProvider',
      'amplify-auto-track-session',
      'amplify-signin-with-hostedUI',
    ];
    
    // Remover claves específicas
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Remover todas las claves que empiecen con "CognitoIdentityServiceProvider"
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('CognitoIdentityServiceProvider')) {
        localStorage.removeItem(key);
      }
    });
    
    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      error: null,
    });
  },

  checkAuth: () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({
          user,
          token,
          refreshToken,
          isAuthenticated: true,
          isCheckingAuth: false,
        });
        
        // Cargar el perfil del usuario al verificar la autenticación
        useUserStore.getState().loadUserProfile().catch(error => {
          console.error('Error loading user profile on checkAuth:', error);
        });
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
        set({ isCheckingAuth: false });
      }
    } else {
      set({ isCheckingAuth: false });
    }
  },

  clearError: () => set({ error: null }),
}));
