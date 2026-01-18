/**
 * Document Service - Database operations for documents and comments.
 *
 * This service provides the data access layer for all document-related operations,
 * abstracting the Dexie (IndexedDB) implementation from the rest of the application.
 *
 * Features:
 * - CRUD operations for documents
 * - CRUD operations for comments
 * - Document reordering with sort order management
 * - Automatic timestamp management (createdAt, updatedAt)
 * - Transactional operations for data integrity
 *
 * @module services/documentService
 *
 * @example
 * ```typescript
 * import { documentService } from '@/services/documentService';
 *
 * // Create a new document
 * const doc = await documentService.createDocument('My Notes');
 *
 * // Update document content
 * await documentService.updateDocument(doc.id, {
 *   content: '<p>Hello, world!</p>'
 * });
 *
 * // Add a comment
 * await documentService.addComment({
 *   documentId: doc.id,
 *   text: 'Important section',
 *   anchorStart: 0,
 *   anchorEnd: 10,
 *   selectedText: 'Hello'
 * });
 * ```
 */

import { db, type DocumentRecord, type CommentRecord } from '@/db';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '@/utils/logger';

const logger = createLogger('DocumentService');

// ============================================================================
// Service Definition
// ============================================================================

/**
 * Document service object containing all database operations.
 * All methods are async and handle their own error logging.
 */
export const documentService = {
  // ==========================================================================
  // Document Operations
  // ==========================================================================

  /**
   * Creates a new document with the given name.
   *
   * @param name - The name for the new document (defaults to 'Untitled')
   * @returns The created document record
   *
   * @example
   * ```typescript
   * const doc = await documentService.createDocument('Meeting Notes');
   * console.log(doc.id); // UUID
   * ```
   */
  async createDocument(name: string = 'Untitled'): Promise<DocumentRecord> {
    logger.info('Creating document', { name });

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
    logger.info('Document created', { id: doc.id, name: doc.name });

    return doc;
  },

  /**
   * Retrieves a document by its ID.
   *
   * @param id - The document ID to fetch
   * @returns The document record, or undefined if not found
   *
   * @example
   * ```typescript
   * const doc = await documentService.getDocument('abc-123');
   * if (doc) {
   *   console.log(doc.name, doc.content);
   * }
   * ```
   */
  async getDocument(id: string): Promise<DocumentRecord | undefined> {
    logger.debug('Fetching document', { id });
    const doc = await db.documents.get(id);

    if (doc) {
      logger.debug('Document found', { id, name: doc.name });
    } else {
      logger.warn('Document not found', { id });
    }

    return doc;
  },

  /**
   * Retrieves all documents ordered by their sort order.
   *
   * @returns Array of all document records sorted by sortOrder
   *
   * @example
   * ```typescript
   * const documents = await documentService.getAllDocuments();
   * documents.forEach(doc => console.log(doc.name));
   * ```
   */
  async getAllDocuments(): Promise<DocumentRecord[]> {
    logger.debug('Fetching all documents');
    const docs = await db.documents.orderBy('sortOrder').toArray();
    logger.debug('Documents fetched', { count: docs.length });
    return docs;
  },

  /**
   * Updates a document with the provided fields.
   * Automatically updates the updatedAt timestamp.
   *
   * @param id - The document ID to update
   * @param updates - Partial document fields to update
   *
   * @example
   * ```typescript
   * await documentService.updateDocument('abc-123', {
   *   name: 'Updated Title',
   *   content: '<p>New content</p>'
   * });
   * ```
   */
  async updateDocument(id: string, updates: Partial<DocumentRecord>): Promise<void> {
    logger.debug('Updating document', { id, fields: Object.keys(updates) });

    await db.documents.update(id, {
      ...updates,
      updatedAt: new Date(),
    });

    logger.debug('Document updated', { id });
  },

  /**
   * Deletes a document and all its associated comments.
   * Uses a transaction to ensure data integrity.
   *
   * @param id - The document ID to delete
   *
   * @example
   * ```typescript
   * await documentService.deleteDocument('abc-123');
   * ```
   */
  async deleteDocument(id: string): Promise<void> {
    logger.info('Deleting document', { id });

    await db.transaction('rw', [db.documents, db.comments], async () => {
      const commentCount = await db.comments.where('documentId').equals(id).count();
      await db.comments.where('documentId').equals(id).delete();
      await db.documents.delete(id);

      logger.info('Document deleted', { id, commentsDeleted: commentCount });
    });
  },

  /**
   * Reorders documents by updating their sort order.
   * Takes an array of document IDs in the desired order.
   *
   * @param documentIds - Array of document IDs in the new order
   *
   * @example
   * ```typescript
   * // Move document 'c' to the top
   * await documentService.reorderDocuments(['c', 'a', 'b']);
   * ```
   */
  async reorderDocuments(documentIds: string[]): Promise<void> {
    logger.debug('Reordering documents', { count: documentIds.length });

    await db.transaction('rw', db.documents, async () => {
      for (let i = 0; i < documentIds.length; i++) {
        await db.documents.update(documentIds[i], { sortOrder: i });
      }
    });

    logger.debug('Documents reordered');
  },

  // ==========================================================================
  // Comment Operations
  // ==========================================================================

  /**
   * Retrieves all comments for a document, sorted by anchor position.
   *
   * @param documentId - The document ID to get comments for
   * @returns Array of comment records sorted by anchorStart
   *
   * @example
   * ```typescript
   * const comments = await documentService.getComments('abc-123');
   * comments.forEach(c => console.log(c.text, c.selectedText));
   * ```
   */
  async getComments(documentId: string): Promise<CommentRecord[]> {
    logger.debug('Fetching comments', { documentId });
    const comments = await db.comments.where('documentId').equals(documentId).sortBy('anchorStart');
    logger.debug('Comments fetched', { documentId, count: comments.length });
    return comments;
  },

  /**
   * Adds a new comment to a document.
   * Automatically generates ID and timestamps.
   *
   * @param comment - The comment data (without id, createdAt, updatedAt)
   * @returns The created comment record with generated fields
   *
   * @example
   * ```typescript
   * const comment = await documentService.addComment({
   *   documentId: 'abc-123',
   *   text: 'This is important!',
   *   anchorStart: 10,
   *   anchorEnd: 25,
   *   selectedText: 'important text'
   * });
   * ```
   */
  async addComment(
    comment: Omit<CommentRecord, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<CommentRecord> {
    logger.info('Adding comment', {
      documentId: comment.documentId,
      anchorStart: comment.anchorStart,
    });

    const now = new Date();
    const newComment: CommentRecord = {
      ...comment,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };

    await db.comments.add(newComment);
    logger.info('Comment added', { id: newComment.id, documentId: newComment.documentId });

    return newComment;
  },

  /**
   * Updates a comment with the provided fields.
   * Automatically updates the updatedAt timestamp.
   *
   * @param id - The comment ID to update
   * @param updates - Partial comment fields to update
   *
   * @example
   * ```typescript
   * await documentService.updateComment('comment-123', {
   *   text: 'Updated comment text'
   * });
   * ```
   */
  async updateComment(id: string, updates: Partial<CommentRecord>): Promise<void> {
    logger.debug('Updating comment', { id });

    await db.comments.update(id, {
      ...updates,
      updatedAt: new Date(),
    });

    logger.debug('Comment updated', { id });
  },

  /**
   * Deletes a comment by its ID.
   *
   * @param id - The comment ID to delete
   *
   * @example
   * ```typescript
   * await documentService.deleteComment('comment-123');
   * ```
   */
  async deleteComment(id: string): Promise<void> {
    logger.info('Deleting comment', { id });
    await db.comments.delete(id);
    logger.info('Comment deleted', { id });
  },
};
