import { create } from 'zustand';
import type { Document, DocumentMeta } from '../types';

interface DocumentState {
  currentDocumentId: string | null;
  currentDocument: Document | null;
  documents: DocumentMeta[];
  hasUnsavedChanges: boolean;
  isLoading: boolean;

  setCurrentDocument: (doc: Document | null) => void;
  setCurrentDocumentId: (id: string | null) => void;
  setDocuments: (docs: DocumentMeta[]) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  setLoading: (loading: boolean) => void;
  updateCurrentDocumentContent: (content: string) => void;
  updateLastReadPosition: (position: number) => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  currentDocumentId: null,
  currentDocument: null,
  documents: [],
  hasUnsavedChanges: false,
  isLoading: false,

  setCurrentDocument: (doc) => set({ currentDocument: doc, hasUnsavedChanges: false }),
  setCurrentDocumentId: (id) => set({ currentDocumentId: id }),
  setDocuments: (docs) => set({ documents: docs }),
  setHasUnsavedChanges: (hasChanges) => set({ hasUnsavedChanges: hasChanges }),
  setLoading: (loading) => set({ isLoading: loading }),
  updateCurrentDocumentContent: (content) => set((state) => ({
    currentDocument: state.currentDocument ? { ...state.currentDocument, content } : null,
    hasUnsavedChanges: true,
  })),
  updateLastReadPosition: (position) => set((state) => ({
    currentDocument: state.currentDocument ? { ...state.currentDocument, lastReadPosition: position } : null,
  })),
}));
