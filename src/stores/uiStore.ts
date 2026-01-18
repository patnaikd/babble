/**
 * UI Store - Application UI state management.
 *
 * This store manages ephemeral UI state including:
 * - Dialog visibility (settings, delete confirmation, rename)
 * - Toast notifications
 *
 * This store does NOT persist - all UI state is reset on page refresh.
 * For persistent UI preferences (like panel visibility), see settingsStore.
 *
 * @module stores/uiStore
 */

import { create } from 'zustand';
import { createLogger } from '@/utils/logger';

const logger = createLogger('UIStore');

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Represents a toast notification message.
 */
export interface Toast {
  /** Unique identifier for the toast */
  id: string;
  /** Main title/headline of the toast */
  title: string;
  /** Optional detailed description */
  description?: string;
  /** Visual variant affecting color/icon */
  variant?: 'default' | 'destructive';
}

/**
 * Complete UI state interface including all values and actions.
 */
interface UIState {
  // -------------------------------------------------------------------------
  // Dialog State
  // -------------------------------------------------------------------------

  /** Whether the settings dialog is currently open */
  settingsDialogOpen: boolean;
  /** Whether the delete confirmation dialog is open */
  deleteConfirmOpen: boolean;
  /** ID of the document pending deletion, null if none */
  deleteTargetId: string | null;
  /** Whether the rename dialog is open */
  renameDialogOpen: boolean;
  /** ID of the document being renamed, null if none */
  renameTargetId: string | null;

  // -------------------------------------------------------------------------
  // Toast Notifications
  // -------------------------------------------------------------------------

  /** Array of currently visible toast notifications */
  toasts: Toast[];

  // -------------------------------------------------------------------------
  // Actions - Settings Dialog
  // -------------------------------------------------------------------------

  /** Opens the settings dialog */
  openSettingsDialog: () => void;
  /** Closes the settings dialog */
  closeSettingsDialog: () => void;

  // -------------------------------------------------------------------------
  // Actions - Delete Confirmation
  // -------------------------------------------------------------------------

  /** Opens the delete confirmation dialog for a specific document */
  openDeleteConfirm: (id: string) => void;
  /** Closes the delete confirmation dialog and clears target */
  closeDeleteConfirm: () => void;

  // -------------------------------------------------------------------------
  // Actions - Rename Dialog
  // -------------------------------------------------------------------------

  /** Opens the rename dialog for a specific document */
  openRenameDialog: (id: string) => void;
  /** Closes the rename dialog and clears target */
  closeRenameDialog: () => void;

  // -------------------------------------------------------------------------
  // Actions - Toast Notifications
  // -------------------------------------------------------------------------

  /** Adds a new toast notification (ID is auto-generated) */
  addToast: (toast: Omit<Toast, 'id'>) => void;
  /** Removes a toast notification by ID */
  removeToast: (id: string) => void;
}

// ============================================================================
// Store Definition
// ============================================================================

/**
 * UI store hook for managing application UI state.
 *
 * @example
 * ```typescript
 * import { useUIStore } from '@/stores';
 *
 * function SettingsButton() {
 *   const { openSettingsDialog } = useUIStore();
 *
 *   return (
 *     <button onClick={openSettingsDialog}>
 *       Settings
 *     </button>
 *   );
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Showing toast notifications
 * function SaveButton() {
 *   const { addToast } = useUIStore();
 *
 *   const handleSave = async () => {
 *     try {
 *       await saveDocument();
 *       addToast({ title: 'Saved', description: 'Document saved successfully.' });
 *     } catch (error) {
 *       addToast({
 *         title: 'Error',
 *         description: 'Failed to save document.',
 *         variant: 'destructive'
 *       });
 *     }
 *   };
 *
 *   return <button onClick={handleSave}>Save</button>;
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Delete confirmation flow
 * function DocumentItem({ id, name }: { id: string; name: string }) {
 *   const { openDeleteConfirm } = useUIStore();
 *
 *   return (
 *     <div>
 *       <span>{name}</span>
 *       <button onClick={() => openDeleteConfirm(id)}>Delete</button>
 *     </div>
 *   );
 * }
 * ```
 */
export const useUIStore = create<UIState>((set) => ({
  // Initial values - Dialogs
  settingsDialogOpen: false,
  deleteConfirmOpen: false,
  deleteTargetId: null,
  renameDialogOpen: false,
  renameTargetId: null,

  // Initial values - Toasts
  toasts: [],

  // Actions - Settings Dialog
  openSettingsDialog: () => {
    logger.debug('Settings dialog opened');
    set({ settingsDialogOpen: true });
  },
  closeSettingsDialog: () => {
    logger.debug('Settings dialog closed');
    set({ settingsDialogOpen: false });
  },

  // Actions - Delete Confirmation
  openDeleteConfirm: (id) => {
    logger.debug('Delete confirmation opened', { targetId: id });
    set({ deleteConfirmOpen: true, deleteTargetId: id });
  },
  closeDeleteConfirm: () => {
    logger.debug('Delete confirmation closed');
    set({ deleteConfirmOpen: false, deleteTargetId: null });
  },

  // Actions - Rename Dialog
  openRenameDialog: (id) => {
    logger.debug('Rename dialog opened', { targetId: id });
    set({ renameDialogOpen: true, renameTargetId: id });
  },
  closeRenameDialog: () => {
    logger.debug('Rename dialog closed');
    set({ renameDialogOpen: false, renameTargetId: null });
  },

  // Actions - Toast Notifications
  addToast: (toast) => {
    const id = crypto.randomUUID();
    logger.info('Toast added', { id, title: toast.title, variant: toast.variant });
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
  },
  removeToast: (id) => {
    logger.debug('Toast removed', { id });
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));
