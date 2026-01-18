import { db, type DocumentRecord, type CommentRecord } from '@/db';
import { v4 as uuidv4 } from 'uuid';

export const documentService = {
  async createDocument(name: string = 'Untitled'): Promise<DocumentRecord> {
    const now = new Date();
    const maxSortOrder = await db.documents.orderBy('sortOrder').last();

    const doc: DocumentRecord = {
      id: uuidv4(),
      name,
      content: '',
      createdAt: now,
      updatedAt: now,
      lastReadPosition: 0,
      sortOrder: (maxSortOrder?.sortOrder ?? 0) + 1,
    };

    await db.documents.add(doc);
    return doc;
  },

  async getDocument(id: string): Promise<DocumentRecord | undefined> {
    return db.documents.get(id);
  },

  async getAllDocuments(): Promise<DocumentRecord[]> {
    return db.documents.orderBy('sortOrder').toArray();
  },

  async updateDocument(id: string, updates: Partial<DocumentRecord>): Promise<void> {
    await db.documents.update(id, {
      ...updates,
      updatedAt: new Date(),
    });
  },

  async deleteDocument(id: string): Promise<void> {
    await db.transaction('rw', [db.documents, db.comments], async () => {
      await db.comments.where('documentId').equals(id).delete();
      await db.documents.delete(id);
    });
  },

  async reorderDocuments(documentIds: string[]): Promise<void> {
    await db.transaction('rw', db.documents, async () => {
      for (let i = 0; i < documentIds.length; i++) {
        await db.documents.update(documentIds[i], { sortOrder: i });
      }
    });
  },

  // Comments
  async getComments(documentId: string): Promise<CommentRecord[]> {
    return db.comments.where('documentId').equals(documentId).sortBy('anchorStart');
  },

  async addComment(comment: Omit<CommentRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<CommentRecord> {
    const now = new Date();
    const newComment: CommentRecord = {
      ...comment,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    await db.comments.add(newComment);
    return newComment;
  },

  async updateComment(id: string, updates: Partial<CommentRecord>): Promise<void> {
    await db.comments.update(id, {
      ...updates,
      updatedAt: new Date(),
    });
  },

  async deleteComment(id: string): Promise<void> {
    await db.comments.delete(id);
  },
};
