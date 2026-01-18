import { Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { documentService } from '@/services/documentService';
import { useUIStore, useSpeechStore } from '@/stores';
import type { CommentRecord } from '@/db';
import { cn } from '@/lib/utils';

interface CommentItemProps {
  comment: CommentRecord;
}

export function CommentItem({ comment }: CommentItemProps) {
  const { addToast } = useUIStore();
  const { setStartPosition } = useSpeechStore();

  const handleDelete = async () => {
    try {
      await documentService.deleteComment(comment.id);
      addToast({ title: 'Comment deleted' });
    } catch {
      addToast({ title: 'Error', description: 'Failed to delete comment.', variant: 'destructive' });
    }
  };

  const handleNavigate = () => {
    // Set speech start position to comment anchor
    setStartPosition(comment.anchorStart);

    // Scroll to the position in the editor
    // This would need to integrate with the editor to scroll to the position
    // For now, we just set the start position for TTS
    addToast({ title: 'Position set', description: 'Speech will start from this comment.' });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={cn(
      "p-3 rounded-md mb-2 bg-card border",
      "hover:border-primary/50 transition-colors"
    )}>
      {/* Selected text preview */}
      {comment.selectedText && (
        <div className="mb-2 p-2 bg-muted rounded text-sm italic truncate">
          "{comment.selectedText}"
        </div>
      )}

      {/* Comment text */}
      <p className="text-sm mb-2">{comment.text}</p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {formatDate(comment.createdAt)}
        </span>

        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleNavigate}
            title="Go to position"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={handleDelete}
            title="Delete comment"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
