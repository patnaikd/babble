import { useLiveQuery } from 'dexie-react-hooks';
import { documentService } from '@/services/documentService';
import { useDocumentStore } from '@/stores';
import { CommentItem } from './CommentItem';

export function CommentList() {
  const { currentDocumentId } = useDocumentStore();

  const comments = useLiveQuery(
    () => currentDocumentId ? documentService.getComments(currentDocumentId) : Promise.resolve([]),
    [currentDocumentId],
    []
  );

  if (!currentDocumentId) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>Open a document to view comments.</p>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>No comments yet.</p>
        <p className="text-sm">Select text and add a comment.</p>
      </div>
    );
  }

  return (
    <div className="p-2">
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </div>
  );
}
