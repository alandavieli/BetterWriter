import React, { useRef, useState } from 'react';
import { Icons } from './Icons';
import { Button } from './Button';

interface EditorToolbarProps {
  onBold: () => void;
  onItalic: () => void;
  onHeader: (level: 1 | 2 | 3) => void;
  onExport: (format: 'TXT' | 'PDF' | 'DOCX' | 'EPUB') => void;
  onFindReplace: () => void;
  focusMode: boolean;
  active: boolean;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  onBold,
  onItalic,
  onHeader,
  onExport,
  onFindReplace,
  focusMode,
  active
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);

  return (
    <div
      className={`sticky top-0 z-10 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-white/10 px-4 py-2 flex items-center gap-2 transition-all
        ${focusMode ? (active ? 'opacity-100' : 'opacity-0 pointer-events-none') : 'opacity-100'}
      `}
    >
      {/* Formatting Tools */}
      <div className="flex items-center gap-1 border-r border-gray-200 dark:border-gray-600 pr-2">
        <button
          onClick={onBold}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 hover:text-gold-600"
          title="Bold (Ctrl+B)"
        >
          <Icons.Type size={16} className="font-bold" />
          <span className="sr-only">Bold</span>
        </button>
        <button
          onClick={onItalic}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 hover:text-gold-600"
          title="Italic (Ctrl+I)"
        >
          <span className="italic font-serif text-sm">I</span>
        </button>
        <button
          onClick={() => onHeader(1)}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 hover:text-gold-600"
          title="Header 1"
        >
          <span className="font-bold text-sm">H1</span>
        </button>
        <button
          onClick={() => onHeader(2)}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 hover:text-gold-600"
          title="Header 2"
        >
          <span className="font-bold text-sm">H2</span>
        </button>
        <button
          onClick={() => onHeader(3)}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 hover:text-gold-600"
          title="Header 3"
        >
          <span className="font-bold text-sm">H3</span>
        </button>
      </div>

      {/* Find & Replace */}
      <button
        onClick={onFindReplace}
        className="p-2 rounded hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 hover:text-gold-600 flex items-center gap-1"
        title="Find & Replace (Ctrl+F)"
      >
        <Icons.Search size={16} />
        <span className="text-xs hidden md:inline">Find</span>
      </button>

      <div className="flex-1"></div>

      {/* Export Menu */}
      <div className="relative">
        <button
          onClick={() => setShowExportMenu(!showExportMenu)}
          className="px-3 py-2 rounded bg-gold-500 hover:bg-gold-600 text-white flex items-center gap-2 text-sm font-medium"
        >
          <Icons.Download size={16} />
          Export
        </button>

        {showExportMenu && (
          <div className="absolute top-full right-0 mt-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl py-1 min-w-[140px] z-20">
            <button
              onClick={() => {
                onExport('TXT');
                setShowExportMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-white/10 flex items-center gap-2 text-gray-700 dark:text-gray-300"
            >
              <Icons.FileText size={14} />
              TXT
            </button>
            <button
              onClick={() => {
                onExport('PDF');
                setShowExportMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-white/10 flex items-center gap-2 text-gray-700 dark:text-gray-300"
            >
              <Icons.FileText size={14} />
              PDF
            </button>
            <button
              onClick={() => {
                onExport('DOCX');
                setShowExportMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-white/10 flex items-center gap-2 text-gray-700 dark:text-gray-300"
            >
              <Icons.FileText size={14} />
              DOCX
            </button>
            <button
              onClick={() => {
                onExport('EPUB');
                setShowExportMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-white/10 flex items-center gap-2 text-gray-700 dark:text-gray-300"
            >
              <Icons.BookOpen size={14} />
              EPUB
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
