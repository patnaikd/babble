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

export function TextEditor({ scrollContainerRef }: TextEditorProps) {
  const { currentDocument, updateCurrentDocumentContent, setHasUnsavedChanges } = useDocumentStore();
  const { currentWordIndex, wordPositions, isPlaying, setStartPosition, setEditorContent } = useSpeechStore();
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLSpanElement | null>(null);

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

  // Handle word highlighting during speech using DOM manipulation
  useEffect(() => {
    if (!editorContainerRef.current) return;

    // Remove previous highlight
    if (highlightRef.current) {
      const text = highlightRef.current.textContent || '';
      const parent = highlightRef.current.parentNode;
      if (parent) {
        const textNode = document.createTextNode(text);
        parent.replaceChild(textNode, highlightRef.current);
        parent.normalize();
      }
      highlightRef.current = null;
    }

    if (!isPlaying || currentWordIndex < 0) return;

    const wordPos = wordPositions[currentWordIndex];
    if (!wordPos) return;

    // Find and highlight the word in the DOM
    const proseMirror = editorContainerRef.current.querySelector('.ProseMirror');
    if (!proseMirror) return;

    const treeWalker = document.createTreeWalker(
      proseMirror,
      NodeFilter.SHOW_TEXT,
      null
    );

    let charCount = 0;
    let node: Node | null;

    while ((node = treeWalker.nextNode())) {
      const textNode = node as Text;
      const text = textNode.textContent || '';
      const nodeStart = charCount;
      const nodeEnd = charCount + text.length;

      if (wordPos.start >= nodeStart && wordPos.start < nodeEnd) {
        // Found the node containing the word
        const localStart = wordPos.start - nodeStart;
        const localEnd = Math.min(wordPos.end - nodeStart, text.length);

        if (localStart < text.length && localEnd > localStart) {
          const beforeText = text.slice(0, localStart);
          const wordText = text.slice(localStart, localEnd);
          const afterText = text.slice(localEnd);

          const parent = textNode.parentNode;
          if (parent) {
            const fragment = document.createDocumentFragment();

            if (beforeText) {
              fragment.appendChild(document.createTextNode(beforeText));
            }

            const highlight = document.createElement('span');
            highlight.className = 'speech-highlight';
            highlight.textContent = wordText;
            fragment.appendChild(highlight);
            highlightRef.current = highlight;

            if (afterText) {
              fragment.appendChild(document.createTextNode(afterText));
            }

            parent.replaceChild(fragment, textNode);

            // Auto-scroll to keep highlighted word visible
            const rect = highlight.getBoundingClientRect();
            const container = scrollContainerRef?.current || editorContainerRef.current;
            if (container) {
              const containerRect = container.getBoundingClientRect();
              const middleTop = containerRect.top + containerRect.height / 3;
              const middleBottom = containerRect.top + (2 * containerRect.height / 3);

              if (rect.top < middleTop || rect.bottom > middleBottom) {
                highlight.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center',
                });
              }
            }
          }
        }
        break;
      }
      charCount += text.length;
    }
  }, [currentWordIndex, wordPositions, isPlaying, scrollContainerRef]);

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
