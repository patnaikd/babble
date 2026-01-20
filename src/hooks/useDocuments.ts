/**
 * useDocuments Hook - Document management with auto-save and live queries.
 *
 * This hook provides a complete interface for document operations including:
 * - CRUD operations (create, load, save, delete, rename)
 * - Live query synchronization with IndexedDB
 * - Auto-save with debouncing
 * - Auto-load of last opened document on startup
 * - Document reordering
 *
 * The hook combines Dexie live queries for reactive data updates with
 * the document store for UI state management.
 *
 * @module hooks/useDocuments
 *
 * @example
 * ```typescript
 * import { useDocuments } from '@/hooks/useDocuments';
 *
 * function DocumentList() {
 *   const {
 *     documents,
 *     currentDocument,
 *     createDocument,
 *     loadDocument,
 *     deleteDocument,
 *   } = useDocuments();
 *
 *   return (
 *     <div>
 *       <button onClick={() => createDocument('New Document')}>
 *         Create Document
 *       </button>
 *       <ul>
 *         {documents.map(doc => (
 *           <li
 *             key={doc.id}
 *             onClick={() => loadDocument(doc.id)}
 *             className={doc.id === currentDocument?.id ? 'active' : ''}
 *           >
 *             {doc.name}
 *           </li>
 *         ))}
 *       </ul>
 *     </div>
 *   );
 * }
 * ```
 */

import { useCallback, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { documentService } from '@/services/documentService';
import { useDocumentStore, useUIStore, useSpeechStore, useSettingsStore } from '@/stores';
import type { Document, DocumentMeta } from '@/types';
import { createLogger } from '@/utils/logger';

const logger = createLogger('useDocuments');

// ============================================================================
// Constants
// ============================================================================

/** Auto-save debounce delay in milliseconds */
const AUTO_SAVE_DELAY_MS = 2000;

/** Module-level flag to track if default document creation is in progress or done */
let defaultDocumentCreationState: 'idle' | 'creating' | 'done' = 'idle';

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for managing documents with auto-save and live query support.
 *
 * @returns Object containing document state and operations
 */
export function useDocuments() {
  // ---------------------------------------------------------------------------
  // Store Access
  // ---------------------------------------------------------------------------

  const {
    currentDocumentId,
    currentDocument,
    setCurrentDocument,
    setCurrentDocumentId,
    setDocuments,
    setLoading,
    hasUnsavedChanges,
    setHasUnsavedChanges,
  } = useDocumentStore();

  const { addToast } = useUIStore();
  const { reset: resetSpeech } = useSpeechStore();
  const { lastDocumentId, setLastDocumentId, _hasHydrated } = useSettingsStore();

  /** Ref to track if initial document has been auto-loaded */
  const hasAutoLoaded = useRef(false);

  // ---------------------------------------------------------------------------
  // Live Query
  // ---------------------------------------------------------------------------

  /**
   * Live query for documents list.
   * Automatically updates when IndexedDB data changes.
   * Returns undefined while loading, then the actual array once loaded.
   */
  const documents = useLiveQuery(() => documentService.getAllDocuments(), []);

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  /**
   * Syncs documents from live query to the store.
   * Transforms full records to metadata for the sidebar.
   */
  useEffect(() => {
    if (documents === undefined) {
      return;
    }
    const metas: DocumentMeta[] = documents.map((d) => ({
      id: d.id,
      name: d.name,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      sortOrder: d.sortOrder,
    }));
    setDocuments(metas);
    logger.debug('Documents synced to store', { count: metas.length });
  }, [documents, setDocuments]);

  /**
   * Creates a default document when there are no documents.
   * This ensures the app always has at least one document to work with.
   * Uses module-level state to prevent duplicate creation in React Strict Mode.
   */
  useEffect(() => {
    // Wait for settings to be hydrated and documents query to complete
    if (!_hasHydrated || documents === undefined) {
      return;
    }

    // Only create if idle and no documents exist
    if (defaultDocumentCreationState !== 'idle' || documents.length > 0) {
      return;
    }

    // Mark as creating immediately to prevent concurrent attempts
    defaultDocumentCreationState = 'creating';

    const createDefaultDocument = async () => {
      logger.info('No documents found, creating default document');
      try {
        const doc = await documentService.createDocument('Untitled');
        setCurrentDocumentId(doc.id);
        setCurrentDocument(doc as Document);
        setLastDocumentId(doc.id);
        defaultDocumentCreationState = 'done';
        logger.info('Default document created', { id: doc.id });
      } catch (error) {
        logger.error('Failed to create default document', error);
        // Reset to idle on error so it can be retried
        defaultDocumentCreationState = 'idle';
      }
    };

    createDefaultDocument();
  }, [_hasHydrated, documents, setCurrentDocumentId, setCurrentDocument, setLastDocumentId]);

  /**
   * Auto-loads the last opened document on startup.
   * Falls back to the first document if last document is not available.
   */
  useEffect(() => {
    if (hasAutoLoaded.current || !documents || documents.length === 0 || currentDocumentId) {
      return;
    }

    hasAutoLoaded.current = true;

    const loadInitialDocument = async () => {
      logger.info('Auto-loading initial document');

      // Try to load the last opened document
      if (lastDocumentId) {
        const docExists = documents.some((d) => d.id === lastDocumentId);
        if (docExists) {
          const doc = await documentService.getDocument(lastDocumentId);
          if (doc) {
            logger.info('Loaded last opened document', { id: doc.id, name: doc.name });
            setCurrentDocumentId(doc.id);
            setCurrentDocument(doc as Document);
            return;
          }
        }
      }

      // Fallback: load the first document
      const firstDoc = await documentService.getDocument(documents[0].id);
      if (firstDoc) {
        logger.info('Loaded first document as fallback', { id: firstDoc.id, name: firstDoc.name });
        setCurrentDocumentId(firstDoc.id);
        setCurrentDocument(firstDoc as Document);
        setLastDocumentId(firstDoc.id);
      }
    };

    loadInitialDocument();
  }, [
    documents,
    lastDocumentId,
    currentDocumentId,
    setCurrentDocumentId,
    setCurrentDocument,
    setLastDocumentId,
  ]);

  /**
   * Auto-saves document content with debouncing.
   * Triggers 2 seconds after content changes stop.
   */
  useEffect(() => {
    if (!currentDocument || !hasUnsavedChanges) return;

    const timer = setTimeout(async () => {
      logger.debug('Auto-saving document', { id: currentDocument.id });
      await documentService.updateDocument(currentDocument.id, {
        content: currentDocument.content,
      });
      setHasUnsavedChanges(false);
      logger.debug('Auto-save complete');
    }, AUTO_SAVE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [currentDocument?.content, hasUnsavedChanges, currentDocument, setHasUnsavedChanges]);

  // ---------------------------------------------------------------------------
  // Document Operations
  // ---------------------------------------------------------------------------

  /**
   * Creates a new document and sets it as the current document.
   *
   * @param name - Optional name for the new document
   * @returns The created document
   */
  const createDocument = useCallback(
    async (name?: string) => {
      logger.info('Creating new document', { name });

      try {
        setLoading(true);
        const doc = await documentService.createDocument(name);
        setCurrentDocumentId(doc.id);
        setCurrentDocument(doc as Document);
        addToast({ title: 'Document created', description: `"${doc.name}" has been created.` });
        logger.info('Document created successfully', { id: doc.id });
        return doc;
      } catch (error) {
        logger.error('Failed to create document', error);
        addToast({
          title: 'Error',
          description: 'Failed to create document.',
          variant: 'destructive',
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setCurrentDocumentId, setCurrentDocument, addToast]
  );

  /**
   * Loads a document by ID, saving any unsaved changes first.
   * Resets speech playback when switching documents.
   *
   * @param id - The document ID to load
   */
  const loadDocument = useCallback(
    async (id: string) => {
      logger.info('Loading document', { id });

      // Save current document if needed
      if (currentDocument && hasUnsavedChanges) {
        logger.debug('Saving unsaved changes before switching');
        await documentService.updateDocument(currentDocument.id, {
          content: currentDocument.content,
          lastReadPosition: currentDocument.lastReadPosition,
        });
      }

      resetSpeech();

      try {
        setLoading(true);
        const doc = await documentService.getDocument(id);
        if (doc) {
          setCurrentDocumentId(doc.id);
          setCurrentDocument(doc as Document);
          setHasUnsavedChanges(false);
          setLastDocumentId(doc.id);
          logger.info('Document loaded', { id: doc.id, name: doc.name });
        }
      } catch (error) {
        logger.error('Failed to load document', error);
        addToast({
          title: 'Error',
          description: 'Failed to load document.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    },
    [
      currentDocument,
      hasUnsavedChanges,
      resetSpeech,
      setLoading,
      setCurrentDocumentId,
      setCurrentDocument,
      setHasUnsavedChanges,
      setLastDocumentId,
      addToast,
    ]
  );

  /**
   * Saves the current document to the database.
   */
  const saveDocument = useCallback(async () => {
    if (!currentDocument) return;

    logger.info('Saving document', { id: currentDocument.id });

    try {
      await documentService.updateDocument(currentDocument.id, {
        content: currentDocument.content,
        lastReadPosition: currentDocument.lastReadPosition,
      });
      setHasUnsavedChanges(false);
      addToast({ title: 'Saved', description: 'Document saved successfully.' });
      logger.info('Document saved');
    } catch (error) {
      logger.error('Failed to save document', error);
      addToast({
        title: 'Error',
        description: 'Failed to save document.',
        variant: 'destructive',
      });
    }
  }, [currentDocument, setHasUnsavedChanges, addToast]);

  /**
   * Deletes a document by ID.
   * If the deleted document is current, clears the selection.
   *
   * @param id - The document ID to delete
   */
  const deleteDocument = useCallback(
    async (id: string) => {
      logger.info('Deleting document', { id });

      try {
        await documentService.deleteDocument(id);
        if (currentDocumentId === id) {
          setCurrentDocumentId(null);
          setCurrentDocument(null);
          resetSpeech();
        }
        addToast({ title: 'Deleted', description: 'Document deleted.' });
        logger.info('Document deleted', { id });
      } catch (error) {
        logger.error('Failed to delete document', error);
        addToast({
          title: 'Error',
          description: 'Failed to delete document.',
          variant: 'destructive',
        });
      }
    },
    [currentDocumentId, setCurrentDocumentId, setCurrentDocument, resetSpeech, addToast]
  );

  /**
   * Renames a document.
   *
   * @param id - The document ID to rename
   * @param name - The new name
   */
  const renameDocument = useCallback(
    async (id: string, name: string) => {
      logger.info('Renaming document', { id, name });

      try {
        await documentService.updateDocument(id, { name });
        if (currentDocument?.id === id) {
          setCurrentDocument({ ...currentDocument, name });
        }
        addToast({ title: 'Renamed', description: `Document renamed to "${name}".` });
        logger.info('Document renamed', { id, name });
      } catch (error) {
        logger.error('Failed to rename document', error);
        addToast({
          title: 'Error',
          description: 'Failed to rename document.',
          variant: 'destructive',
        });
      }
    },
    [currentDocument, setCurrentDocument, addToast]
  );

  /**
   * Reorders documents by their IDs.
   *
   * @param documentIds - Array of document IDs in the new order
   */
  const reorderDocuments = useCallback(
    async (documentIds: string[]) => {
      logger.debug('Reordering documents', { count: documentIds.length });

      try {
        await documentService.reorderDocuments(documentIds);
        logger.debug('Documents reordered');
      } catch (error) {
        logger.error('Failed to reorder documents', error);
        addToast({
          title: 'Error',
          description: 'Failed to reorder documents.',
          variant: 'destructive',
        });
      }
    },
    [addToast]
  );

  // ---------------------------------------------------------------------------
  // Return Value
  // ---------------------------------------------------------------------------

  return {
    /** List of all documents (metadata only) */
    documents: documents || [],
    /** The currently active document (full data) */
    currentDocument,
    /** ID of the currently active document */
    currentDocumentId,
    /** Whether there are unsaved changes */
    hasUnsavedChanges,
    /** Creates a new document */
    createDocument,
    /** Loads a document by ID */
    loadDocument,
    /** Saves the current document */
    saveDocument,
    /** Deletes a document by ID */
    deleteDocument,
    /** Renames a document */
    renameDocument,
    /** Reorders documents */
    reorderDocuments,
  };
}
