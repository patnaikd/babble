import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { useDocumentStore, useSpeechStore } from '@/stores';
import { EditorToolbar } from './EditorToolbar';
import { useEffect, useRef, type RefObject } from 'react';
import { cn } from '@/lib/utils';

interface TextEditorProps {
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
}

// Convert plain text position to ProseMirror document position
function plainTextToProseMirrorPos(doc: any, plainTextPos: number): number {
  let charCount = 0;
  let result = 0;

  doc.descendants((node: any, pos: number) => {
    if (result) return false; // Already found

    if (node.isText) {
      const textLength = node.text?.length || 0;
      if (charCount + textLength >= plainTextPos) {
        // Found the node containing our position
        result = pos + (plainTextPos - charCount);
        return false;
      }
      charCount += textLength;
    }
    return true;
  });

  // If not found, return end of document
  return result || doc.content.size;
}

export function TextEditor({ scrollContainerRef }: TextEditorProps) {
  const { currentDocument, updateCurrentDocumentContent, setHasUnsavedChanges } = useDocumentStore();
  const { currentWordIndex, wordPositions, isPlaying, setStartPosition, setEditorContent } = useSpeechStore();
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const lastHighlightRef = useRef<{ from: number; to: number } | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight.configure({
        multicolor: true,
      }),
      Placeholder.configure({
        placeholder: 'Paste or type your text here...',
      }),
      Underline,
    ],
    content: currentDocument?.content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[300px] p-4',
      },
    },
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      updateCurrentDocumentContent(content);
      setEditorContent(content);
    },
  });

  // Update editor content when document changes
  useEffect(() => {
    if (editor && currentDocument) {
      const currentContent = editor.getHTML();
      if (currentContent !== currentDocument.content) {
        editor.commands.setContent(currentDocument.content || '');
        setEditorContent(currentDocument.content || '');
        setHasUnsavedChanges(false);
      }
    }
  }, [editor, currentDocument?.id, setHasUnsavedChanges, setEditorContent]);

  // Handle word highlighting during speech using TipTap's highlight mark
  useEffect(() => {
    if (!editor) return;

    // Remove previous highlight if exists
    if (lastHighlightRef.current) {
      const { from, to } = lastHighlightRef.current;
      console.log('[TextEditor] Removing previous highlight at', from, '-', to);
      editor.chain()
        .setTextSelection({ from, to })
        .unsetHighlight()
        .run();
      lastHighlightRef.current = null;
    }

    // If not playing or no valid word index, just clear and return
    if (!isPlaying || currentWordIndex < 0) {
      console.log('[TextEditor] Not playing or invalid word index:', { isPlaying, currentWordIndex });
      return;
    }

    const wordPos = wordPositions[currentWordIndex];
    if (!wordPos) {
      console.log('[TextEditor] No word position for index:', currentWordIndex);
      return;
    }

    console.log('[TextEditor] Highlighting word:', wordPos.word, 'at plain text position', wordPos.start, '-', wordPos.end);

    // Convert plain text positions to ProseMirror document positions
    const from = plainTextToProseMirrorPos(editor.state.doc, wordPos.start);
    const to = plainTextToProseMirrorPos(editor.state.doc, wordPos.end);

    console.log('[TextEditor] ProseMirror positions:', from, '-', to);

    // Apply highlight to the word
    editor.chain()
      .setTextSelection({ from, to })
      .setHighlight({ color: '#fde047' }) // yellow-300
      .run();

    // Store the highlight position for cleanup
    lastHighlightRef.current = { from, to };

    // Auto-scroll to keep highlighted word visible
    const container = scrollContainerRef?.current || editorContainerRef.current;
    if (container) {
      // Find the highlighted mark element
      const highlightEl = container.querySelector('mark[data-color="#fde047"]');
      if (highlightEl) {
        const rect = highlightEl.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const middleTop = containerRect.top + containerRect.height / 3;
        const middleBottom = containerRect.top + (2 * containerRect.height / 3);

        if (rect.top < middleTop || rect.bottom > middleBottom) {
          highlightEl.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      }
    }
  }, [editor, currentWordIndex, wordPositions, isPlaying, scrollContainerRef]);

  // Handle click to set start position
  const handleClick = () => {
    if (editor) {
      const selection = editor.state.selection;
      const from = selection.from;

      // Calculate character position
      let charPos = 0;
      editor.state.doc.nodesBetween(0, from, (node, pos) => {
        if (node.isText) {
          const start = Math.max(pos, 0);
          const end = Math.min(pos + node.nodeSize, from);
          if (end > start) {
            charPos += end - start;
          }
        }
        return true;
      });

      setStartPosition(charPos);
    }
  };

  if (!editor) {
    return <div className="p-4">Loading editor...</div>;
  }

  return (
    <div className="border rounded-lg bg-background" ref={editorContainerRef}>
      <EditorToolbar editor={editor} />
      <EditorContent
        editor={editor}
        onClick={handleClick}
        className={cn(
          "min-h-[400px]",
          "[&_.ProseMirror]:min-h-[400px]",
          "[&_.ProseMirror]:p-4",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none",
        )}
      />
    </div>
  );
}
