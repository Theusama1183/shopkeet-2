import { create } from 'zustand';

// Types
interface EditorHistory {
  past: any[];
  present: any;
  future: any[];
}

interface EditorState {
  // Current editing state
  currentPageId: string | null;
  currentTemplateId: string | null;
  currentPopupId: string | null;
  
  // Dirty state (unsaved changes)
  isDirty: boolean;
  
  // Saving state
  isSaving: boolean;
  lastSaved: Date | null;
  saveError: string | null;
  
  // Auto-save
  autoSaveEnabled: boolean;
  autoSaveInterval: number; // milliseconds
  
  // History (undo/redo)
  history: EditorHistory;
  canUndo: boolean;
  canRedo: boolean;
  
  // Preview mode
  isPreviewMode: boolean;
  
  // Actions - Current editing
  setCurrentPage: (pageId: string | null) => void;
  setCurrentTemplate: (templateId: string | null) => void;
  setCurrentPopup: (popupId: string | null) => void;
  clearCurrent: () => void;
  
  // Actions - Dirty state
  setDirty: (dirty: boolean) => void;
  markDirty: () => void;
  markClean: () => void;
  
  // Actions - Saving
  startSaving: () => void;
  finishSaving: (error?: string) => void;
  clearSaveError: () => void;
  
  // Actions - Auto-save
  setAutoSaveEnabled: (enabled: boolean) => void;
  setAutoSaveInterval: (interval: number) => void;
  
  // Actions - History
  pushHistory: (state: any) => void;
  undo: () => any | null;
  redo: () => any | null;
  clearHistory: () => void;
  
  // Actions - Preview
  togglePreview: () => void;
  setPreviewMode: (enabled: boolean) => void;
  
  // Actions - Reset
  reset: () => void;
}

const MAX_HISTORY_SIZE = 50;

export const useEditorStore = create<EditorState>((set, get) => ({
  // Initial state
  currentPageId: null,
  currentTemplateId: null,
  currentPopupId: null,
  isDirty: false,
  isSaving: false,
  lastSaved: null,
  saveError: null,
  autoSaveEnabled: true,
  autoSaveInterval: 30000, // 30 seconds
  history: {
    past: [],
    present: null,
    future: [],
  },
  canUndo: false,
  canRedo: false,
  isPreviewMode: false,
  
  // Current editing actions
  setCurrentPage: (pageId) => {
    set({ 
      currentPageId: pageId,
      currentTemplateId: null,
      currentPopupId: null,
      isDirty: false,
    });
  },
  
  setCurrentTemplate: (templateId) => {
    set({ 
      currentTemplateId: templateId,
      currentPageId: null,
      currentPopupId: null,
      isDirty: false,
    });
  },
  
  setCurrentPopup: (popupId) => {
    set({ 
      currentPopupId: popupId,
      currentPageId: null,
      currentTemplateId: null,
      isDirty: false,
    });
  },
  
  clearCurrent: () => {
    set({
      currentPageId: null,
      currentTemplateId: null,
      currentPopupId: null,
      isDirty: false,
    });
  },
  
  // Dirty state actions
  setDirty: (dirty) => {
    set({ isDirty: dirty });
  },
  
  markDirty: () => {
    set({ isDirty: true });
  },
  
  markClean: () => {
    set({ isDirty: false });
  },
  
  // Saving actions
  startSaving: () => {
    set({ isSaving: true, saveError: null });
  },
  
  finishSaving: (error) => {
    set({ 
      isSaving: false, 
      lastSaved: error ? null : new Date(),
      saveError: error || null,
      isDirty: error ? true : false, // Keep dirty if error
    });
  },
  
  clearSaveError: () => {
    set({ saveError: null });
  },
  
  // Auto-save actions
  setAutoSaveEnabled: (enabled) => {
    set({ autoSaveEnabled: enabled });
  },
  
  setAutoSaveInterval: (interval) => {
    set({ autoSaveInterval: interval });
  },
  
  // History actions
  pushHistory: (state) => {
    set((current) => {
      const { history } = current;
      
      // Add current present to past
      const newPast = history.present 
        ? [...history.past, history.present].slice(-MAX_HISTORY_SIZE)
        : history.past;
      
      return {
        history: {
          past: newPast,
          present: state,
          future: [], // Clear future on new action
        },
        canUndo: newPast.length > 0,
        canRedo: false,
      };
    });
  },
  
  undo: () => {
    const { history } = get();
    
    if (history.past.length === 0) {
      return null;
    }
    
    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, -1);
    
    set({
      history: {
        past: newPast,
        present: previous,
        future: history.present 
          ? [history.present, ...history.future]
          : history.future,
      },
      canUndo: newPast.length > 0,
      canRedo: true,
      isDirty: true,
    });
    
    return previous;
  },
  
  redo: () => {
    const { history } = get();
    
    if (history.future.length === 0) {
      return null;
    }
    
    const next = history.future[0];
    const newFuture = history.future.slice(1);
    
    set({
      history: {
        past: history.present 
          ? [...history.past, history.present]
          : history.past,
        present: next,
        future: newFuture,
      },
      canUndo: true,
      canRedo: newFuture.length > 0,
      isDirty: true,
    });
    
    return next;
  },
  
  clearHistory: () => {
    set({
      history: {
        past: [],
        present: null,
        future: [],
      },
      canUndo: false,
      canRedo: false,
    });
  },
  
  // Preview actions
  togglePreview: () => {
    set((state) => ({ isPreviewMode: !state.isPreviewMode }));
  },
  
  setPreviewMode: (enabled) => {
    set({ isPreviewMode: enabled });
  },
  
  // Reset action
  reset: () => {
    set({
      currentPageId: null,
      currentTemplateId: null,
      currentPopupId: null,
      isDirty: false,
      isSaving: false,
      lastSaved: null,
      saveError: null,
      history: {
        past: [],
        present: null,
        future: [],
      },
      canUndo: false,
      canRedo: false,
      isPreviewMode: false,
    });
  },
}));

// Helper hooks
export function useEditorDirty() {
  const { isDirty, markDirty, markClean } = useEditorStore();
  return { isDirty, markDirty, markClean };
}

export function useEditorSaving() {
  const { isSaving, lastSaved, saveError, startSaving, finishSaving, clearSaveError } = useEditorStore();
  return { isSaving, lastSaved, saveError, startSaving, finishSaving, clearSaveError };
}

export function useEditorHistory() {
  const { canUndo, canRedo, undo, redo, pushHistory, clearHistory } = useEditorStore();
  return { canUndo, canRedo, undo, redo, pushHistory, clearHistory };
}

export function useEditorAutoSave() {
  const { autoSaveEnabled, autoSaveInterval, setAutoSaveEnabled, setAutoSaveInterval } = useEditorStore();
  return { enabled: autoSaveEnabled, interval: autoSaveInterval, setEnabled: setAutoSaveEnabled, setInterval: setAutoSaveInterval };
}
