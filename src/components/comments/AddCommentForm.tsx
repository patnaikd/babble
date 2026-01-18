import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { documentService } from '@/services/documentService';
import { useDocumentStore, useUIStore } from '@/stores';

export function AddCommentForm() {
  const [commentText, setCommentText] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);

  const { currentDocumentId } = useDocumentStore();
  const { addToast } = useUIStore();

  // Listen for text selection in the editor
  // This is a simplified version - in practice, you'd integrate with TipTap's selection
  const handleSelectionCapture = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString().trim().slice(0, 100));
      // Note: Getting exact positions would require TipTap editor integration
      setSelectionRange({ start: 0, end: selection.toString().length });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentDocumentId || !commentText.trim()) {
      addToast({
        title: 'Cannot add comment',
        description: 'Please enter comment text.',
        variant: 'destructive'
      });
      return;
    }

    try {
      await documentService.addComment({
        documentId: currentDocumentId,
        text: commentText.trim(),
        anchorStart: selectionRange?.start ?? 0,
        anchorEnd: selectionRange?.end ?? 0,
        selectedText: selectedText,
      });

      setCommentText('');
      setSelectedText('');
      setSelectionRange(null);
      addToast({ title: 'Comment added' });
    } catch {
      addToast({
        title: 'Error',
        description: 'Failed to add comment.',
        variant: 'destructive'
      });
    }
  };

  if (!currentDocumentId) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="p-4">
      {selectedText && (
        <div className="mb-2 p-2 bg-muted rounded text-sm italic truncate">
          "{selectedText}"
        </div>
      )}

      <div className="flex gap-2">
        <Input
          placeholder="Add a comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onFocus={handleSelectionCapture}
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={!commentText.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mt-2">
        Select text in the editor, then add your comment.
      </p>
    </form>
  );
}
