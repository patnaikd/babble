import { TextEditor } from '../editor/TextEditor';
import { SpeechControls } from '../speech/SpeechControls';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRef } from 'react';

export function MainContent() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="h-full flex flex-col">
      {/* Speech Controls */}
      <SpeechControls />

      {/* Editor Area */}
      <ScrollArea className="flex-1" ref={scrollContainerRef}>
        <div className="max-w-4xl mx-auto p-6">
          <TextEditor scrollContainerRef={scrollContainerRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
