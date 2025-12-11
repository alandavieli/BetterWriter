import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';

interface FloatingToolbarProps {
  onFormat: (type: 'h1' | 'h2' | 'h3' | 'bold' | 'italic') => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({ onFormat, textareaRef }) => {
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleSelectionChange = () => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      // Only show if text is selected
      if (start !== end && document.activeElement === textarea) {
        // Get the position of the selection
        const rect = textarea.getBoundingClientRect();

        // Estimate position based on textarea position
        // This is a simple approach - position above the textarea
        const top = rect.top - 50; // 50px above
        const left = rect.left + (rect.width / 2) - 100; // Centered horizontally (toolbar is ~200px wide)

        setPosition({ top, left });
        setShow(true);
      } else {
        setShow(false);
      }
    };

    // Listen for selection changes
    document.addEventListener('selectionchange', handleSelectionChange);

    // Also check on mouseup (for better responsiveness)
    const textarea = textareaRef.current;
    textarea?.addEventListener('mouseup', handleSelectionChange);
    textarea?.addEventListener('keyup', handleSelectionChange);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      textarea?.removeEventListener('mouseup', handleSelectionChange);
      textarea?.removeEventListener('keyup', handleSelectionChange);
    };
  }, [textareaRef]);

  if (!show) return null;

  return (
    <div
      ref={toolbarRef}
      className="fixed z-50 bg-neutral-900 dark:bg-neutral-800 rounded-lg shadow-2xl border border-gray-700 p-1 flex items-center gap-1 animate-in fade-in slide-in-from-bottom-2 duration-200"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {/* H1 */}
      <button
        onClick={() => {
          onFormat('h1');
          setShow(false);
        }}
        className="px-3 py-2 rounded hover:bg-white/10 text-white hover:text-gold-400 transition-colors"
        title="Header 1"
      >
        <span className="text-sm font-bold">H1</span>
      </button>

      {/* H2 */}
      <button
        onClick={() => {
          onFormat('h2');
          setShow(false);
        }}
        className="px-3 py-2 rounded hover:bg-white/10 text-white hover:text-gold-400 transition-colors"
        title="Header 2"
      >
        <span className="text-sm font-bold">H2</span>
      </button>

      {/* H3 */}
      <button
        onClick={() => {
          onFormat('h3');
          setShow(false);
        }}
        className="px-3 py-2 rounded hover:bg-white/10 text-white hover:text-gold-400 transition-colors"
        title="Header 3"
      >
        <span className="text-sm font-bold">H3</span>
      </button>

      <div className="w-px h-6 bg-gray-600" />

      {/* Bold */}
      <button
        onClick={() => {
          onFormat('bold');
          setShow(false);
        }}
        className="px-3 py-2 rounded hover:bg-white/10 text-white hover:text-gold-400 transition-colors"
        title="Bold"
      >
        <Icons.Type size={16} className="font-bold" />
      </button>

      {/* Italic */}
      <button
        onClick={() => {
          onFormat('italic');
          setShow(false);
        }}
        className="px-3 py-2 rounded hover:bg-white/10 text-white hover:text-gold-400 transition-colors"
        title="Italic"
      >
        <span className="italic font-serif text-sm">I</span>
      </button>
    </div>
  );
};
