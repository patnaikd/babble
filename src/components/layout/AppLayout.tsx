import { useSettingsStore } from '@/stores';
import { Header } from './Header';
import { DocumentSidebar } from '../sidebar/DocumentSidebar';
import { CommentsPanel } from '../comments/CommentsPanel';
import { MainContent } from './MainContent';
import { cn } from '@/lib/utils';

export function AppLayout() {
  const { leftSidebarOpen, rightPanelOpen, theme, fontFamily, fontSize, lineHeight, letterSpacing } = useSettingsStore();

  // Map letter spacing to actual values
  const letterSpacingMap = {
    'normal': '0',
    'wide': '0.05em',
    'extra-wide': '0.1em',
  };

  // Map font family
  const fontFamilyMap = {
    'system': 'ui-sans-serif, system-ui, sans-serif',
    'Arial': 'Arial, sans-serif',
    'OpenDyslexic': 'OpenDyslexic, sans-serif',
    'Lexend': 'Lexend, sans-serif',
  };

  return (
    <div
      className={cn(
        "h-screen flex flex-col overflow-hidden",
        theme === 'dark' && 'dark'
      )}
      style={{
        fontFamily: fontFamilyMap[fontFamily],
        fontSize: `${fontSize}px`,
        lineHeight: lineHeight,
        letterSpacing: letterSpacingMap[letterSpacing],
      }}
    >
      <Header />
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside
          className={cn(
            "w-72 border-r bg-muted/30 flex-shrink-0 transition-all duration-300 overflow-hidden",
            !leftSidebarOpen && "w-0 border-r-0"
          )}
        >
          <DocumentSidebar />
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          <MainContent />
        </main>

        {/* Right Panel */}
        <aside
          className={cn(
            "w-80 border-l bg-muted/30 flex-shrink-0 transition-all duration-300 overflow-hidden",
            !rightPanelOpen && "w-0 border-l-0"
          )}
        >
          <CommentsPanel />
        </aside>
      </div>
    </div>
  );
}
