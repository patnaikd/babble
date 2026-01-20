import { Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { DocumentList } from './DocumentList';
import { StorageIndicator } from './StorageIndicator';
import { useDocuments } from '@/hooks/useDocuments';

export function DocumentSidebar() {
  const { createDocument } = useDocuments();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <span className="font-semibold">Documents</span>
        </div>
        <Button
          variant="outline"
          className="w-full bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700"
          onClick={() => createDocument()}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Document
        </Button>
      </div>

      <Separator />

      {/* Document List */}
      <ScrollArea className="flex-1">
        <DocumentList />
      </ScrollArea>

      <Separator />

      {/* Storage Indicator */}
      <StorageIndicator />
    </div>
  );
}
