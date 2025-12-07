import React from 'react';
import { Icons } from './Icons';
import { Button } from './Button';

interface HelpDialogProps {
  onClose: () => void;
}

export const HelpDialog: React.FC<HelpDialogProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-gold-100 dark:border-white/10">

        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-cream-50 dark:bg-black/20">
          <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-gold-100 flex items-center gap-3">
            <Icons.HelpCircle className="text-gold-500" />
            How to use BetterWriter
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <Icons.X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 grid md:grid-cols-2 gap-8">

          {/* Best Experience */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Icons.Chrome className="text-blue-500" size={24} />
              <h3 className="font-bold text-lg text-gray-800 dark:text-white">Chrome / Edge</h3>
              <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold">Recommended</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              These modern browsers support the <b>File System Access API</b>.
            </p>
            <ul className="text-sm space-y-2 text-gray-700 dark:text-gray-300 list-disc list-inside bg-green-50 dark:bg-green-900/10 p-4 rounded-xl border border-green-100 dark:border-green-900/20">
              <li>Files save <b>directly</b> to your computer.</li>
              <li><b>Auto-save</b> is enabled.</li>
              <li>Open projects and edit freely.</li>
              <li><span className="font-bold">One-time setup:</span> Click "Allow" when the browser asks for permission.</li>
            </ul>
          </div>

          {/* Compatibility Mode */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Icons.Globe className="text-orange-500" size={24} />
              <h3 className="font-bold text-lg text-gray-800 dark:text-white">Safari / Firefox</h3>
              <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-bold">Compatible</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              These browsers prioritize security and <b>restrict</b> direct file access.
            </p>
            <ul className="text-sm space-y-2 text-gray-700 dark:text-gray-300 list-disc list-inside bg-orange-50 dark:bg-orange-900/10 p-4 rounded-xl border border-orange-100 dark:border-orange-900/20">
              <li><b>Manual Save Only:</b> Clicking save will <b>download</b> a new copy of your file.</li>
              <li>You must replace the old file manually if you want to update it.</li>
              <li>Perfect for quick edits or drafts.</li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Icons.FileText size={14} />
            <span>Only <b>.txt</b> and <b>.md</b> files are currently supported.</span>
          </div>
          <Button onClick={onClose} variant="primary">Got it</Button>
        </div>

      </div>
    </div>
  );
};
