"use client";

import { create } from 'zustand';
import { ReactNode } from 'react';

// Types
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number; // milliseconds, 0 = no auto-dismiss
}

interface Modal {
  id: string;
  title: string;
  content: ReactNode;
  onClose?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

interface UIState {
  // Modals
  modals: Modal[];
  isModalOpen: boolean;
  
  // Notifications/Toasts
  notifications: Notification[];
  
  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  
  // Loading overlay
  showLoadingOverlay: boolean;
  loadingOverlayMessage: string | null;
  
  // Actions - Modals
  openModal: (modal: Omit<Modal, 'id'>) => string;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  
  // Actions - Notifications
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Actions - Sidebar
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapse: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // Actions - Loading Overlay
  showLoading: (message?: string) => void;
  hideLoading: () => void;
}

// Auto-dismiss timeout tracking
const notificationTimeouts = new Map<string, NodeJS.Timeout>();

export const useUIStore = create<UIState>((set, get) => ({
  // Initial state
  modals: [],
  isModalOpen: false,
  notifications: [],
  sidebarOpen: true,
  sidebarCollapsed: false,
  showLoadingOverlay: false,
  loadingOverlayMessage: null,
  
  // Modal actions
  openModal: (modal) => {
    const id = `modal-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const newModal: Modal = { ...modal, id };
    
    set((state) => ({
      modals: [...state.modals, newModal],
      isModalOpen: true,
    }));
    
    return id;
  },
  
  closeModal: (id) => {
    set((state) => {
      const newModals = state.modals.filter((m) => m.id !== id);
      
      // Call onClose callback if exists
      const modal = state.modals.find((m) => m.id === id);
      if (modal?.onClose) {
        modal.onClose();
      }
      
      return {
        modals: newModals,
        isModalOpen: newModals.length > 0,
      };
    });
  },
  
  closeAllModals: () => {
    const { modals } = get();
    
    // Call all onClose callbacks
    modals.forEach((modal) => {
      if (modal.onClose) {
        modal.onClose();
      }
    });
    
    set({ modals: [], isModalOpen: false });
  },
  
  // Notification actions
  addNotification: (notification) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const duration = notification.duration ?? 5000; // Default 5 seconds
    
    const newNotification: Notification = { ...notification, id, duration };
    
    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));
    
    // Auto-dismiss if duration > 0
    if (duration > 0) {
      const timeout = setTimeout(() => {
        get().removeNotification(id);
        notificationTimeouts.delete(id);
      }, duration);
      
      notificationTimeouts.set(id, timeout);
    }
    
    return id;
  },
  
  removeNotification: (id) => {
    // Clear timeout if exists
    const timeout = notificationTimeouts.get(id);
    if (timeout) {
      clearTimeout(timeout);
      notificationTimeouts.delete(id);
    }
    
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },
  
  clearNotifications: () => {
    // Clear all timeouts
    notificationTimeouts.forEach((timeout) => clearTimeout(timeout));
    notificationTimeouts.clear();
    
    set({ notifications: [] });
  },
  
  // Sidebar actions
  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },
  
  setSidebarOpen: (open) => {
    set({ sidebarOpen: open });
  },
  
  toggleSidebarCollapse: () => {
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
  },
  
  setSidebarCollapsed: (collapsed) => {
    set({ sidebarCollapsed: collapsed });
  },
  
  // Loading overlay actions
  showLoading: (message) => {
    set({ 
      showLoadingOverlay: true, 
      loadingOverlayMessage: message || null 
    });
  },
  
  hideLoading: () => {
    set({ 
      showLoadingOverlay: false, 
      loadingOverlayMessage: null 
    });
  },
}));

// Helper hooks for common use cases
export function useModal() {
  const { openModal, closeModal, closeAllModals } = useUIStore();
  return { openModal, closeModal, closeAllModals };
}

export function useNotification() {
  const { addNotification, removeNotification, clearNotifications } = useUIStore();
  
  // Helper function for simple notifications
  const showNotification = (notification: { type: NotificationType; message: string; duration?: number }) => {
    return addNotification({
      type: notification.type,
      title: notification.message,
      duration: notification.duration,
    });
  };
  
  return {
    showNotification,
    success: (title: string, message?: string, duration?: number) =>
      addNotification({ type: 'success', title, message, duration }),
    error: (title: string, message?: string, duration?: number) =>
      addNotification({ type: 'error', title, message, duration }),
    warning: (title: string, message?: string, duration?: number) =>
      addNotification({ type: 'warning', title, message, duration }),
    info: (title: string, message?: string, duration?: number) =>
      addNotification({ type: 'info', title, message, duration }),
    remove: removeNotification,
    clear: clearNotifications,
  };
}

export function useSidebar() {
  const { 
    sidebarOpen, 
    sidebarCollapsed, 
    toggleSidebar, 
    setSidebarOpen, 
    toggleSidebarCollapse, 
    setSidebarCollapsed 
  } = useUIStore();
  
  return {
    isOpen: sidebarOpen,
    isCollapsed: sidebarCollapsed,
    toggle: toggleSidebar,
    setOpen: setSidebarOpen,
    toggleCollapse: toggleSidebarCollapse,
    setCollapsed: setSidebarCollapsed,
  };
}

export function useLoadingOverlay() {
  const { showLoadingOverlay, loadingOverlayMessage, showLoading, hideLoading } = useUIStore();
  
  return {
    isShowing: showLoadingOverlay,
    message: loadingOverlayMessage,
    show: showLoading,
    hide: hideLoading,
  };
}
