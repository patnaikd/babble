export interface Comment {
  id: string;
  documentId: string;
  text: string;
  anchorStart: number;
  anchorEnd: number;
  selectedText: string;
  createdAt: Date;
  updatedAt: Date;
}
