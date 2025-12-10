import React, { useRef, useState, useImperativeHandle, forwardRef, useEffect } from 'react';
import { EditorToolbar } from './EditorToolbar';
import { FindReplace } from './FindReplace';
import { ExportService, ExportFormat } from '../services/ExportService';

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

export const Editor = forwardRef<EditorHandle, EditorProps>((
  {
    content,
    onChange,
    title,
    onTitleChange,
    focusMode,
    active
  },
  ref
) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

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

  // Formatting functions
  const wrapSelection = (prefix: string, suffix: string = prefix) => {
    const ta = textareaRef.current;
    if (!ta) return;

    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selectedText = content.substring(start, end);
    const before = content.substring(0, start);
    const after = content.substring(end);

    const newContent = before + prefix + selectedText + suffix + after;
    onChange(newContent);

    // Restore selection
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const handleBold = () => {
    wrapSelection('**');
  };

  const handleItalic = () => {
    wrapSelection('*');
  };

  const handleHeader = (level: 1 | 2 | 3) => {
    const ta = textareaRef.current;
    if (!ta) return;

    const start = ta.selectionStart;
    const end = ta.selectionEnd;

    // Find the start of the current line
    let lineStart = start;
    while (lineStart > 0 && content[lineStart - 1] !== '\n') {
      lineStart--;
    }

    const before = content.substring(0, lineStart);
    const lineContent = content.substring(lineStart, end);
    const after = content.substring(end);

    const headerPrefix = '#'.repeat(level) + ' ';
    const newContent = before + headerPrefix + lineContent + after;
    onChange(newContent);

    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + headerPrefix.length, end + headerPrefix.length);
    }, 0);
  };

  const handleExport = async (format: ExportFormat) => {
    try {
      await ExportService.exportDocument(format, {
        title: title || 'Untitled',
        content: content || '',
        author: 'Author' // Could be from user settings
      });
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const handleReplace = (newContent: string) => {
    onChange(newContent);
  };

  const handleNavigate = (index: number) => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.setSelectionRange(index, index + 10); // Highlight ~10 chars
    ta.focus();
  };

  // Simple markdown rendering for preview
  const renderMarkdown = (text: string) => {
    let html = text;

    // Headers
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Line breaks
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');

    return `<p>${html}</p>`;
  };

  return (
    <div className="relative flex flex-col h-full">
      {/* Toolbar */}
      <EditorToolbar
        onBold={handleBold}
        onItalic={handleItalic}
        onHeader={handleHeader}
        onExport={handleExport}
        onFindReplace={() => setShowFindReplace(!showFindReplace)}
        focusMode={focusMode}
        active={active}
      />

      {/* Find & Replace Dialog */}
      {showFindReplace && (
        <FindReplace
          content={content}
          onReplace={handleReplace}
          onClose={() => setShowFindReplace(false)}
          onNavigate={handleNavigate}
        />
      )}

      <div className={`flex flex-col mx-auto px-4 md:px-12 py-8 min-h-[calc(100vh-4rem)] transition-all duration-700 ease-in-out overflow-y-auto flex-1
        ${focusMode ? 'max-w-6xl mt-12' : 'max-w-5xl'}
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

        {/* Toggle Preview Button */}
        {!focusMode && (
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="text-xs text-gray-500 hover:text-gold-600 px-3 py-1 rounded border border-gray-300 dark:border-gray-600 hover:border-gold-500"
            >
              {showPreview ? 'Edit' : 'Preview'}
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <div className="relative flex-1 w-full min-h-[60vh]">
          {showPreview ? (
            <div
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(content || '') }}
            />
          ) : (
            <textarea
              ref={textareaRef}
              value={content || ''}
              onChange={(e) => onChange(e.target.value)}
              className={`w-full h-full resize-none bg-transparent focus:outline-none text-gray-900 dark:text-cream-100 caret-gold-600 dark:caret-gold-400 overflow-hidden
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
          )}
        </div>
      </div>
    </div>
  );
});

Editor.displayName = 'Editor';