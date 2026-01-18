import { create } from 'zustand';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

interface UIState {
  settingsDialogOpen: boolean;
  deleteConfirmOpen: boolean;
  deleteTargetId: string | null;
  renameDialogOpen: boolean;
  renameTargetId: string | null;
  toasts: Toast[];

  openSettingsDialog: () => void;
  closeSettingsDialog: () => void;
  openDeleteConfirm: (id: string) => void;
  closeDeleteConfirm: () => void;
  openRenameDialog: (id: string) => void;
  closeRenameDialog: () => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  settingsDialogOpen: false,
  deleteConfirmOpen: false,
  deleteTargetId: null,
  renameDialogOpen: false,
  renameTargetId: null,
  toasts: [],

  openSettingsDialog: () => set({ settingsDialogOpen: true }),
  closeSettingsDialog: () => set({ settingsDialogOpen: false }),
  openDeleteConfirm: (id) => set({ deleteConfirmOpen: true, deleteTargetId: id }),
  closeDeleteConfirm: () => set({ deleteConfirmOpen: false, deleteTargetId: null }),
  openRenameDialog: (id) => set({ renameDialogOpen: true, renameTargetId: id }),
  closeRenameDialog: () => set({ renameDialogOpen: false, renameTargetId: null }),
  addToast: (toast) => set((state) => ({
    toasts: [...state.toasts, { ...toast, id: crypto.randomUUID() }],
  })),
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id),
  })),
}));
