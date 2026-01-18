import { MessageSquare } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CommentList } from './CommentList';
import { AddCommentForm } from './AddCommentForm';

export function CommentsPanel() {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        <span className="font-semibold">Comments</span>
      </div>

      <Separator />

      {/* Add Comment Form */}
      <AddCommentForm />

      <Separator />

      {/* Comments List */}
      <ScrollArea className="flex-1">
        <CommentList />
      </ScrollArea>
    </div>
  );
}
