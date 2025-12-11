import React, { useRef, useImperativeHandle, forwardRef, useEffect } from 'react';

export interface EditorHandle {
  getSelection: () => { start: number; end: number; text: string };
  setSelection: (start: number, end: number) => void;
  getTextarea: () => HTMLTextAreaElement | null;
}

interface EditorProps {
  content: string;
  onChange: (value: string) => void;
  title: string;
  onTitleChange: (value: string) => void;
  focusMode: boolean;
  active: boolean;
  sidebarOpen: boolean;
}

export const Editor = forwardRef<EditorHandle, EditorProps>((
  {
    content,
    onChange,
    title,
    onTitleChange,
    focusMode,
    active,
    sidebarOpen
  },
  ref
) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    getSelection: () => {
      const ta = textareaRef.current;
      if (!ta) return { start: 0, end: 0, text: '' };
      return {
        start: ta.selectionStart,
        end: ta.selectionEnd,
        text: ta.value.substring(ta.selectionStart, ta.selectionEnd)
      };
    },
    setSelection: (start, end) => {
      if (textareaRef.current) {
        textareaRef.current.setSelectionRange(start, end);
        textareaRef.current.focus();
      }
    },
    getTextarea: () => textareaRef.current
  }));

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onTitleChange(e.target.value);
  };

  // Auto-resize logic for title
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = 'auto';
      titleRef.current.style.height = titleRef.current.scrollHeight + 'px';
    }
  }, [title]);

  // Sync scroll between textarea and highlight layer
  const handleScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  // Process content with markdown styling - keeping layout consistent for cursor alignment
  const processMarkdown = (text: string) => {
    if (!text) return '';

    let processed = text
      // Escape HTML
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Headers - just color them, don't change size (to prevent cursor misalignment)
      .replace(/^(### )(.+)$/gm, '<span class="text-gold-600 dark:text-gold-400 font-bold">$1$2</span>')
      .replace(/^(## )(.+)$/gm, '<span class="text-gold-600 dark:text-gold-400 font-bold">$1$2</span>')
      .replace(/^(# )(.+)$/gm, '<span class="text-gold-600 dark:text-gold-400 font-bold">$1$2</span>')
      // Bold - keep ** visible but bold the text
      .replace(/(\*\*)(.+?)(\*\*)/g, '<span class="text-gold-500 dark:text-gold-400">$1</span><span class="font-bold">$2</span><span class="text-gold-500 dark:text-gold-400">$3</span>')
      // Italic - keep * visible but italicize the text
      .replace(/(\*)(.+?)(\*)/g, '<span class="text-gold-500 dark:text-gold-400">$1</span><span class="italic">$2</span><span class="text-gold-500 dark:text-gold-400">$3</span>')
      // Newlines
      .replace(/\n/g, '<br/>');

    return processed;
  };

  return (
    <div className="relative flex flex-col h-full w-full overflow-hidden">
      <div className={`flex flex-col w-full py-8 flex-1 overflow-y-auto transition-all duration-700 ease-in-out
        ${focusMode ? 'mt-16 px-8 md:px-32 lg:px-48' : sidebarOpen ? 'px-8 md:px-12 lg:px-20 mt-4' : 'px-8 md:px-20 lg:px-32 xl:px-48 mt-4'}
      `}>
        {/* Title Input */}
        <textarea
          ref={titleRef}
          rows={1}
          value={title}
          onChange={handleTitleChange}
          className={`w-full bg-transparent font-serif font-bold text-gray-800 dark:text-gold-50 mb-8 focus:outline-none placeholder-gray-300 dark:placeholder-gray-700 transition-all duration-500 resize-none overflow-hidden whitespace-pre-wrap
            ${focusMode ? 'text-4xl text-center opacity-80 focus:opacity-100' : 'text-3xl md:text-4xl'}
          `}
          placeholder="Untitled"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              textareaRef.current?.focus();
            }
          }}
        />

        {/* Editor Container with Live Markdown Preview */}
        <div className="relative w-full flex-1 min-h-[500px]">
          {/* Styled markdown background */}
          <div
            ref={highlightRef}
            className="absolute inset-0 pointer-events-none overflow-hidden"
            style={{
              fontFamily: 'Merriweather, serif',
              fontSize: '1.25rem',
              lineHeight: '1.75',
              whiteSpace: 'pre-wrap',
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
              padding: '0',
              margin: '0',
              border: 'none'
            }}
            dangerouslySetInnerHTML={{ __html: processMarkdown(content || '') }}
          />

          {/* Actual textarea - transparent text */}
          <textarea
            ref={textareaRef}
            value={content || ''}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            className={`w-full h-full resize-none bg-transparent focus:outline-none relative
              ${focusMode ? 'placeholder-gray-200/20' : 'placeholder-gray-300 dark:placeholder-gray-800'}
            `}
            style={{
              fontFamily: 'Merriweather, serif',
              fontSize: '1.25rem',
              lineHeight: '1.75',
              whiteSpace: 'pre-wrap',
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
              color: 'transparent',
              caretColor: '#f59e0b',
              padding: '0',
              margin: '0',
              border: 'none',
              overflow: 'auto'
            }}
            placeholder="Start writing..."
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
});

Editor.displayName = 'Editor';