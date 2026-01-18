export interface Document {
  id: string;
  name: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  lastReadPosition: number;
  sortOrder: number;
}

export interface DocumentMeta {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  sortOrder: number;
}
