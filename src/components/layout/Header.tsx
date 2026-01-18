import { PanelLeftClose, PanelLeftOpen, PanelRightClose, Settings, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSettingsStore, useUIStore, useDocumentStore } from '@/stores';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function Header() {
  const { leftSidebarOpen, rightPanelOpen, toggleLeftSidebar, toggleRightPanel } = useSettingsStore();
  const { openSettingsDialog } = useUIStore();
  const { hasUnsavedChanges, currentDocument } = useDocumentStore();

  return (
    <header className="h-14 border-b flex items-center justify-between px-4 flex-shrink-0" style={{ backgroundColor: '#002d4d', color: '#ff6b5b' }}>
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={toggleLeftSidebar}>
                {leftSidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {leftSidebarOpen ? 'Hide documents' : 'Show documents'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <h1 className="text-xl font-semibold">Babble</h1>

        {currentDocument && (
          <span className="ml-2" style={{ color: '#a0d2ff' }}>
            {currentDocument.name}
            {hasUnsavedChanges && <span className="text-orange-500 ml-1">•</span>}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={toggleRightPanel}>
                {rightPanelOpen ? <PanelRightClose className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {rightPanelOpen ? 'Hide comments' : 'Show comments'}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={openSettingsDialog}>
                <Settings className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  );
}
