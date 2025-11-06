import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  username: string;
  country: string;
  role: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: Date;
    mentalHealthConditions?: string[];
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  updateUser: (user: User) => void;
  mockLogin: () => void;
}

// Usuario mock para desarrollo
const mockUser: User = {
  id: '1',
  email: 'usuario@ejemplo.com',
  username: 'usuario_demo',
  country: 'España',
  role: 'USER',
  profile: {
    firstName: 'María',
    lastName: 'González',
    dateOfBirth: new Date('1960-05-15'),
    mentalHealthConditions: ['Ansiedad', 'Depresión leve']
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (user: User, token: string) => {
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      clearAuth: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      updateUser: (user: User) => {
        set({ user });
      },

      // Función para simular login automático en desarrollo
      mockLogin: () => {
        set({
          user: mockUser,
          token: 'mock-jwt-token-for-development',
          isAuthenticated: true,
          isLoading: false,
        });
      },
    }),
    {
      name: 'sereno-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Auto-login para demo (funciona en desarrollo y producción)
setTimeout(() => {
  const store = useAuthStore.getState();
  if (!store.isAuthenticated) {
    store.mockLogin();
  }
}, 1000);