/**
 * Document Store - Current document and document list state management.
 *
 * This store manages the in-memory state for:
 * - Currently active document and its content
 * - List of all document metadata (for sidebar)
 * - Unsaved changes tracking
 * - Loading states
 *
 * This store does NOT handle persistence directly - that's managed by
 * documentService and the useDocuments hook. This store provides the
 * reactive state that components subscribe to.
 *
 * @module stores/documentStore
 */

import { create } from 'zustand';
import type { Document, DocumentMeta } from '../types';
import { createLogger } from '@/utils/logger';

const logger = createLogger('DocumentStore');

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Complete document state interface including all values and actions.
 */
interface DocumentState {
  // -------------------------------------------------------------------------
  // Document State
  // -------------------------------------------------------------------------

  /** ID of the currently active document, null if none selected */
  currentDocumentId: string | null;
  /** Full document data for the currently active document */
  currentDocument: Document | null;
  /** Metadata for all documents (used in sidebar list) */
  documents: DocumentMeta[];

  // -------------------------------------------------------------------------
  // Status Flags
  // -------------------------------------------------------------------------

  /** Whether there are unsaved changes to the current document */
  hasUnsavedChanges: boolean;
  /** Whether a document operation is in progress */
  isLoading: boolean;

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  /** Sets the current document (full data) */
  setCurrentDocument: (doc: Document | null) => void;
  /** Sets just the current document ID */
  setCurrentDocumentId: (id: string | null) => void;
  /** Sets the list of document metadata */
  setDocuments: (docs: DocumentMeta[]) => void;
  /** Sets the unsaved changes flag */
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  /** Sets the loading state */
  setLoading: (loading: boolean) => void;
  /** Updates the content of the current document */
  updateCurrentDocumentContent: (content: string) => void;
  /** Updates the last read position of the current document */
  updateLastReadPosition: (position: number) => void;
}

// ============================================================================
// Store Definition
// ============================================================================

/**
 * Document store hook for managing document state.
 *
 * @example
 * ```typescript
 * import { useDocumentStore } from '@/stores';
 *
 * function DocumentEditor() {
 *   const {
 *     currentDocument,
 *     hasUnsavedChanges,
 *     updateCurrentDocumentContent
 *   } = useDocumentStore();
 *
 *   if (!currentDocument) {
 *     return <div>No document selected</div>;
 *   }
 *
 *   return (
 *     <div>
 *       <h1>{currentDocument.name}</h1>
 *       {hasUnsavedChanges && <span>Unsaved changes</span>}
 *       <Editor
 *         content={currentDocument.content}
 *         onChange={updateCurrentDocumentContent}
 *       />
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Accessing document list for sidebar
 * function DocumentSidebar() {
 *   const { documents, currentDocumentId } = useDocumentStore();
 *
 *   return (
 *     <ul>
 *       {documents.map(doc => (
 *         <li key={doc.id} className={doc.id === currentDocumentId ? 'active' : ''}>
 *           {doc.name}
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export const useDocumentStore = create<DocumentState>((set) => ({
  // Initial values
  currentDocumentId: null,
  currentDocument: null,
  documents: [],
  hasUnsavedChanges: false,
  isLoading: false,

  // Actions
  setCurrentDocument: (doc) => {
    logger.info('Current document set', { id: doc?.id, name: doc?.name });
    set({ currentDocument: doc, hasUnsavedChanges: false });
  },

  setCurrentDocumentId: (id) => {
    logger.debug('Current document ID set', { id });
    set({ currentDocumentId: id });
  },

  setDocuments: (docs) => {
    logger.debug('Documents list updated', { count: docs.length });
    set({ documents: docs });
  },

  setHasUnsavedChanges: (hasChanges) => {
    logger.debug('Unsaved changes flag updated', { hasChanges });
    set({ hasUnsavedChanges: hasChanges });
  },

  setLoading: (loading) => {
    logger.debug('Loading state changed', { loading });
    set({ isLoading: loading });
  },

  updateCurrentDocumentContent: (content) => {
    logger.debug('Document content updated', { contentLength: content.length });
    set((state) => ({
      currentDocument: state.currentDocument
        ? { ...state.currentDocument, content }
        : null,
      hasUnsavedChanges: true,
    }));
  },

  updateLastReadPosition: (position) => {
    logger.debug('Last read position updated', { position });
    set((state) => ({
      currentDocument: state.currentDocument
        ? { ...state.currentDocument, lastReadPosition: position }
        : null,
    }));
  },
}));
