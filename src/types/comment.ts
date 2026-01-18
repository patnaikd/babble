/**
 * Comment Type Definitions
 *
 * This module defines the TypeScript interfaces for comment-related data structures.
 * Comments allow users to annotate specific text selections within documents.
 *
 * @module types/comment
 */

/**
 * Represents a comment attached to a text selection in a document.
 *
 * Comments are anchored to specific character positions in the document content,
 * allowing users to add notes or annotations to particular passages of text.
 *
 * @example
 * ```typescript
 * const comment: Comment = {
 *   id: 'comment-123',
 *   documentId: 'doc-456',
 *   text: 'This is an important point to remember.',
 *   anchorStart: 100,
 *   anchorEnd: 150,
 *   selectedText: 'the key takeaway from this section',
 *   createdAt: new Date('2024-01-01'),
 *   updatedAt: new Date('2024-01-01'),
 * };
 * ```
 */
export interface Comment {
  /** Unique identifier (UUID) for the comment */
  id: string;

  /** ID of the document this comment belongs to */
  documentId: string;

  /** The comment text/note content */
  text: string;

  /**
   * Starting character position of the selected text (inclusive).
   * This is the index in the plain text content where the selection begins.
   */
  anchorStart: number;

  /**
   * Ending character position of the selected text (exclusive).
   * This is the index in the plain text content where the selection ends.
   */
  anchorEnd: number;

  /**
   * The text that was selected when the comment was created.
   * Stored for reference even if the document content changes.
   */
  selectedText: string;

  /** Timestamp when the comment was created */
  createdAt: Date;

  /** Timestamp when the comment was last modified */
  updatedAt: Date;
}
