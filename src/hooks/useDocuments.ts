import { useCallback, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { documentService } from '@/services/documentService';
import { useDocumentStore, useUIStore, useSpeechStore, useSettingsStore } from '@/stores';
import type { Document, DocumentMeta } from '@/types';

export function useDocuments() {
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
  const { lastDocumentId, setLastDocumentId } = useSettingsStore();
  const hasAutoLoaded = useRef(false);

  // Live query for documents list
  const documents = useLiveQuery(
    () => documentService.getAllDocuments(),
    [],
    []
  );

  // Update store when documents change
  useEffect(() => {
    if (documents) {
      const metas: DocumentMeta[] = documents.map(d => ({
        id: d.id,
        name: d.name,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
        sortOrder: d.sortOrder,
      }));
      setDocuments(metas);
    }
  }, [documents, setDocuments]);

  // Auto-load last document on startup
  useEffect(() => {
    if (hasAutoLoaded.current || !documents || documents.length === 0 || currentDocumentId) {
      return;
    }

    hasAutoLoaded.current = true;

    const loadInitialDocument = async () => {
      // Try to load the last opened document
      if (lastDocumentId) {
        const docExists = documents.some(d => d.id === lastDocumentId);
        if (docExists) {
          const doc = await documentService.getDocument(lastDocumentId);
          if (doc) {
            setCurrentDocumentId(doc.id);
            setCurrentDocument(doc as Document);
            return;
          }
        }
      }

      // Fallback: load the first document
      const firstDoc = await documentService.getDocument(documents[0].id);
      if (firstDoc) {
        setCurrentDocumentId(firstDoc.id);
        setCurrentDocument(firstDoc as Document);
        setLastDocumentId(firstDoc.id);
      }
    };

    loadInitialDocument();
  }, [documents, lastDocumentId, currentDocumentId, setCurrentDocumentId, setCurrentDocument, setLastDocumentId]);

  const createDocument = useCallback(async (name?: string) => {
    try {
      setLoading(true);
      const doc = await documentService.createDocument(name);
      setCurrentDocumentId(doc.id);
      setCurrentDocument(doc as Document);
      addToast({ title: 'Document created', description: `"${doc.name}" has been created.` });
      return doc;
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to create document.',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setCurrentDocumentId, setCurrentDocument, addToast]);

  const loadDocument = useCallback(async (id: string) => {
    // Save current document if needed
    if (currentDocument && hasUnsavedChanges) {
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
      }
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to load document.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [currentDocument, hasUnsavedChanges, resetSpeech, setLoading, setCurrentDocumentId, setCurrentDocument, setHasUnsavedChanges, setLastDocumentId, addToast]);

  const saveDocument = useCallback(async () => {
    if (!currentDocument) return;

    try {
      await documentService.updateDocument(currentDocument.id, {
        content: currentDocument.content,
        lastReadPosition: currentDocument.lastReadPosition,
      });
      setHasUnsavedChanges(false);
      addToast({ title: 'Saved', description: 'Document saved successfully.' });
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to save document.',
        variant: 'destructive'
      });
    }
  }, [currentDocument, setHasUnsavedChanges, addToast]);

  const deleteDocument = useCallback(async (id: string) => {
    try {
      await documentService.deleteDocument(id);
      if (currentDocumentId === id) {
        setCurrentDocumentId(null);
        setCurrentDocument(null);
        resetSpeech();
      }
      addToast({ title: 'Deleted', description: 'Document deleted.' });
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to delete document.',
        variant: 'destructive'
      });
    }
  }, [currentDocumentId, setCurrentDocumentId, setCurrentDocument, resetSpeech, addToast]);

  const renameDocument = useCallback(async (id: string, name: string) => {
    try {
      await documentService.updateDocument(id, { name });
      if (currentDocument?.id === id) {
        setCurrentDocument({ ...currentDocument, name });
      }
      addToast({ title: 'Renamed', description: `Document renamed to "${name}".` });
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to rename document.',
        variant: 'destructive'
      });
    }
  }, [currentDocument, setCurrentDocument, addToast]);

  const reorderDocuments = useCallback(async (documentIds: string[]) => {
    try {
      await documentService.reorderDocuments(documentIds);
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to reorder documents.',
        variant: 'destructive'
      });
    }
  }, [addToast]);

  // Auto-save on content change (debounced)
  useEffect(() => {
    if (!currentDocument || !hasUnsavedChanges) return;

    const timer = setTimeout(async () => {
      await documentService.updateDocument(currentDocument.id, {
        content: currentDocument.content,
      });
      setHasUnsavedChanges(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [currentDocument?.content, hasUnsavedChanges]);

  return {
    documents: documents || [],
    currentDocument,
    currentDocumentId,
    hasUnsavedChanges,
    createDocument,
    loadDocument,
    saveDocument,
    deleteDocument,
    renameDocument,
    reorderDocuments,
  };
}
