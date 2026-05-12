import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user 
      }),
      
      clearUser: () => set({ 
        user: null, 
        isAuthenticated: false 
      }),
    }),
    {
      name: 'shopkeet-user',
      partialize: (state) => ({ user: state.user }),
    }
  )
);
