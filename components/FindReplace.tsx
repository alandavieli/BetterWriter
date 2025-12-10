import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';

interface FindReplaceProps {
  content: string;
  onReplace: (newContent: string) => void;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export const FindReplace: React.FC<FindReplaceProps> = ({
  content,
  onReplace,
  onClose,
  onNavigate
}) => {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [matches, setMatches] = useState<number[]>([]);
  const [currentMatch, setCurrentMatch] = useState(0);

  useEffect(() => {
    if (!findText) {
      setMatches([]);
      setCurrentMatch(0);
      return;
    }

    const flags = caseSensitive ? 'g' : 'gi';
    let pattern: RegExp;

    try {
      if (useRegex) {
        pattern = new RegExp(findText, flags);
      } else {
        // Escape special regex characters for literal search
        const escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        pattern = new RegExp(escaped, flags);
      }

      const foundMatches: number[] = [];
      let match;

      while ((match = pattern.exec(content)) !== null) {
        foundMatches.push(match.index);
      }

      setMatches(foundMatches);
      setCurrentMatch(0);
    } catch (e) {
      // Invalid regex
      setMatches([]);
    }
  }, [findText, content, caseSensitive, useRegex]);

  const handleNext = () => {
    if (matches.length === 0) return;
    const nextIndex = (currentMatch + 1) % matches.length;
    setCurrentMatch(nextIndex);
    onNavigate(matches[nextIndex]);
  };

  const handlePrevious = () => {
    if (matches.length === 0) return;
    const prevIndex = currentMatch === 0 ? matches.length - 1 : currentMatch - 1;
    setCurrentMatch(prevIndex);
    onNavigate(matches[prevIndex]);
  };

  const handleReplace = () => {
    if (matches.length === 0 || !findText) return;

    const flags = caseSensitive ? 'g' : 'gi';
    let pattern: RegExp;

    try {
      if (useRegex) {
        pattern = new RegExp(findText, flags);
      } else {
        const escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        pattern = new RegExp(escaped, flags);
      }

      const newContent = content.replace(pattern, replaceText);
      onReplace(newContent);
    } catch (e) {
      // Invalid regex
    }
  };

  return (
    <div className="fixed top-20 right-4 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl p-4 w-96 z-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 dark:text-white">Find & Replace</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded text-gray-500"
        >
          <Icons.X size={16} />
        </button>
      </div>

      {/* Find Input */}
      <div className="mb-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={findText}
            onChange={(e) => setFindText(e.target.value)}
            placeholder="Find..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-neutral-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
            autoFocus
          />
          <button
            onClick={handlePrevious}
            disabled={matches.length === 0}
            className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            title="Previous"
          >
            <Icons.ChevronUp size={16} />
          </button>
          <button
            onClick={handleNext}
            disabled={matches.length === 0}
            className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            title="Next"
          >
            <Icons.ChevronDown size={16} />
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {matches.length > 0 ? `${currentMatch + 1} of ${matches.length}` : 'No matches'}
        </div>
      </div>

      {/* Replace Input */}
      <div className="mb-3">
        <input
          type="text"
          value={replaceText}
          onChange={(e) => setReplaceText(e.target.value)}
          placeholder="Replace with..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-neutral-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
        />
      </div>

      {/* Options */}
      <div className="flex gap-4 mb-4">
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={caseSensitive}
            onChange={(e) => setCaseSensitive(e.target.checked)}
            className="rounded"
          />
          Case sensitive
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={useRegex}
            onChange={(e) => setUseRegex(e.target.checked)}
            className="rounded"
          />
          Regex
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleReplace}
          disabled={matches.length === 0}
          className="flex-1 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-white rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Replace All
        </button>
      </div>
    </div>
  );
};
