import React from 'react';
import { Icons } from './Icons';

interface TutorialDialogProps {
  onClose: () => void;
}

export const TutorialDialog: React.FC<TutorialDialogProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">Welcome to BetterWriter</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500"
          >
            <Icons.X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Intro */}
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            BetterWriter is a distraction-free writing environment designed to help you focus on what matters most: your words.
          </p>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Getting Started */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-gold-50 to-orange-50 dark:from-gold-900/20 dark:to-orange-900/20 border border-gold-200 dark:border-gold-800">
              <div className="w-12 h-12 bg-gold-500 text-white rounded-xl flex items-center justify-center mb-4">
                <Icons.FilePlus size={24} />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Getting Started</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create a new document, open an existing file, or import an entire project folder. BetterWriter supports .txt and .md files.
              </p>
            </div>

            {/* Markdown Support */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
              <div className="w-12 h-12 bg-blue-500 text-white rounded-xl flex items-center justify-center mb-4">
                <Icons.Type size={24} />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Markdown Formatting</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Use the formatting toolbar for bold, italic, headers (H1-H3), strikethrough, code, blockquotes, lists, and links. See live markdown preview as you type.
              </p>
            </div>

            {/* Zen Focus Mode */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800">
              <div className="w-12 h-12 bg-purple-500 text-white rounded-xl flex items-center justify-center mb-4">
                <Icons.Focus size={24} />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Zen Focus Mode</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Click "Zen Focus Mode" to hide all distractions. The sidebar and navbar disappear—only your text remains. Move your mouse to the top of the screen to reveal the navbar.
              </p>
            </div>

            {/* Export */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
              <div className="w-12 h-12 bg-green-500 text-white rounded-xl flex items-center justify-center mb-4">
                <Icons.Download size={24} />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Export Your Work</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Export your documents in multiple formats: TXT, PDF, DOCX, or EPUB. Click the "Export" button in the toolbar to get started.
              </p>
            </div>

            {/* Stats Tracking */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-800">
              <div className="w-12 h-12 bg-amber-500 text-white rounded-xl flex items-center justify-center mb-4">
                <Icons.BarChart2 size={24} />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Track Your Progress</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                View writing statistics, set daily goals, track your streaks, and monitor word counts. Click "Stats" to see your progress.
              </p>
            </div>

            {/* Organization */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border border-teal-200 dark:border-teal-800">
              <div className="w-12 h-12 bg-teal-500 text-white rounded-xl flex items-center justify-center mb-4">
                <Icons.Folder size={24} />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Stay Organized</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Use the sidebar to organize your files and folders. Create folders, rename files, and drag-and-drop to reorganize your project structure.
              </p>
            </div>
          </div>

          {/* Tips */}
          <div className="p-6 rounded-xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold mb-3 text-gray-900 dark:text-white flex items-center gap-2">
              <Icons.Sparkles size={20} className="text-gold-500" />
              Pro Tips
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-gold-500 mt-0.5">•</span>
                <span>Files auto-save every 5 minutes when you have write permissions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold-500 mt-0.5">•</span>
                <span>Toggle dark mode with the moon/sun icon in the top-right</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold-500 mt-0.5">•</span>
                <span>Use Find & Replace (search icon) to quickly edit your text</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold-500 mt-0.5">•</span>
                <span>Access the Planning panel for character cards and story outlines</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-neutral-800 border-t border-gray-200 dark:border-gray-700 p-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gold-500 hover:bg-gold-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
          >
            Got it! Let's Write
          </button>
        </div>
      </div>
    </div>
  );
};
