import React, { useRef, useState, useImperativeHandle, forwardRef, useEffect } from 'react';

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
  active: boolean; // Is user currently typing/active
}

export const Editor = forwardRef<EditorHandle, EditorProps>(({
  content,
  onChange,
  title,
  onTitleChange,
  focusMode,
  active
}, ref) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);

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

  // Auto-resize logic for both textareas
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = 'auto';
      titleRef.current.style.height = titleRef.current.scrollHeight + 'px';
    }
  }, [title]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  return (
    <div className={`flex flex-col mx-auto px-4 md:px-12 py-8 min-h-[calc(100vh-4rem)] transition-all duration-700 ease-in-out
      ${focusMode ? 'max-w-4xl mt-12' : 'max-w-5xl'}
    `}>
      {/* Title Input - Textarea for wrapping */}
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

      {/* Main Content Area */}
      <div className="relative flex-1 w-full min-h-[60vh]">
        <textarea
          ref={textareaRef}
          value={content || ''}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full h-full resize-none bg-transparent focus:outline-none text-gray-900 dark:text-cream-100 caret-gold-600 dark:caret-gold-400
            ${focusMode ? 'placeholder-gray-200/20' : 'placeholder-gray-300 dark:placeholder-gray-800'}
          `}
          style={{
            fontFamily: 'Merriweather, serif',
            fontSize: '1.25rem', // text-xl
            lineHeight: '1.75em', // leading-loose
            whiteSpace: 'pre-wrap',
            overflowWrap: 'break-word',
          }}
          placeholder="Start writing..."
          spellCheck={false}
        />
      </div>
    </div>
  );
});

Editor.displayName = 'Editor';