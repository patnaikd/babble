import { Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { DocumentList } from './DocumentList';
import { StorageIndicator } from './StorageIndicator';
import { useDocuments } from '@/hooks/useDocuments';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function DocumentSidebar() {
  const { createDocument } = useDocuments();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <span className="font-semibold">Documents</span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => createDocument()}>
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>New document</TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
