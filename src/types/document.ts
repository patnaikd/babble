/**
 * Document Type Definitions
 *
 * This module defines the TypeScript interfaces for document-related data structures
 * used throughout the Babble application.
 *
 * @module types/document
 */

/**
 * Represents a complete document with all its data.
 *
 * Documents are the primary content units in Babble. Each document
 * contains rich text content that can be read aloud using text-to-speech.
 *
 * @example
 * ```typescript
 * const doc: Document = {
 *   id: 'abc-123',
 *   name: 'Meeting Notes',
 *   content: '<p>Discussion points...</p>',
 *   createdAt: new Date('2024-01-01'),
 *   updatedAt: new Date('2024-01-02'),
 *   lastReadPosition: 150,
 *   sortOrder: 0,
 * };
 * ```
 */
export interface Document {
  /** Unique identifier (UUID) for the document */
  id: string;

  /** Display name of the document */
  name: string;

  /** HTML content of the document (from TipTap editor) */
  content: string;

  /** Timestamp when the document was created */
  createdAt: Date;

  /** Timestamp when the document was last modified */
  updatedAt: Date;

  /**
   * Character position where reading was last paused.
   * Used to resume reading from the same position.
   */
  lastReadPosition: number;

  /**
   * Position in the document list for ordering.
   * Lower numbers appear first.
   */
  sortOrder: number;
}

/**
 * Lightweight document metadata for list displays.
 *
 * Contains only the fields needed for displaying documents in the sidebar,
 * excluding the potentially large content field.
 *
 * @example
 * ```typescript
 * const meta: DocumentMeta = {
 *   id: 'abc-123',
 *   name: 'Meeting Notes',
 *   createdAt: new Date('2024-01-01'),
 *   updatedAt: new Date('2024-01-02'),
 *   sortOrder: 0,
 * };
 * ```
 */
export interface DocumentMeta {
  /** Unique identifier (UUID) for the document */
  id: string;

  /** Display name of the document */
  name: string;

  /** Timestamp when the document was created */
  createdAt: Date;

  /** Timestamp when the document was last modified */
  updatedAt: Date;

  /**
   * Position in the document list for ordering.
   * Lower numbers appear first.
   */
  sortOrder: number;
}
