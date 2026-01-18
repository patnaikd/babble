import Dexie, { type Table } from 'dexie';

export interface DocumentRecord {
  id: string;
  name: string;
  content: string;           // TipTap JSON stringified
  createdAt: Date;
  updatedAt: Date;
  lastReadPosition: number;  // Character position for TTS resume
  sortOrder: number;         // For manual drag-drop ordering
}

export interface CommentRecord {
  id: string;
  documentId: string;
  text: string;
  anchorStart: number;       // Start position in document
  anchorEnd: number;         // End position in document
  selectedText: string;      // Snapshot of the selected text
  createdAt: Date;
  updatedAt: Date;
}

export class BabbleDatabase extends Dexie {
  documents!: Table<DocumentRecord>;
  comments!: Table<CommentRecord>;

  constructor() {
    super('BabbleDB');

    this.version(1).stores({
      documents: 'id, createdAt, updatedAt, sortOrder',
      comments: 'id, documentId, createdAt'
    });
  }
}

export const db = new BabbleDatabase();
