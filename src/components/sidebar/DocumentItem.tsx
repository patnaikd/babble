import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useDocuments } from '@/hooks/useDocuments';
import { useDocumentStore, useUIStore } from '@/stores';
import { cn } from '@/lib/utils';
import type { DocumentMeta } from '@/types';

interface DocumentItemProps {
  document: DocumentMeta;
}

export function DocumentItem({ document }: DocumentItemProps) {
  const { loadDocument } = useDocuments();
  const { currentDocumentId } = useDocumentStore();
  const { openDeleteConfirm, openRenameDialog } = useUIStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: document.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isActive = currentDocumentId === document.id;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-2 rounded-md mb-1 group",
        "hover:bg-accent/50 cursor-pointer",
        isActive && "bg-accent",
        isDragging && "opacity-50"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="touch-none p-1 opacity-0 group-hover:opacity-100 hover:bg-accent rounded"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      <div
        className="flex-1 min-w-0"
        onClick={() => loadDocument(document.id)}
      >
        <p className="font-medium truncate">{document.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatDate(document.createdAt)}
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => openRenameDialog(document.id)}>
            <Pencil className="h-4 w-4 mr-2" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => openDeleteConfirm(document.id)}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
