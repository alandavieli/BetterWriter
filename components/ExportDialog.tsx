import React, { useState } from 'react';
import { Icons } from './Icons';
import { Button } from './Button';
import { ExportConfig } from '../types';

interface ExportDialogProps {
  onExport: (config: ExportConfig) => void;
  onClose: () => void;
  bookTitle: string;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({ onExport, onClose, bookTitle }) => {
  const [config, setConfig] = useState<ExportConfig>({
    format: 'PDF',
    template: 'Standard',
    includeCover: true,
    scope: 'project'
  });
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    // Simulate generation time
    setTimeout(() => {
      onExport(config);
      setIsExporting(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-cream-900/40 dark:bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-neutral-800 w-full max-w-2xl rounded-2xl shadow-2xl p-0 border border-gold-200 dark:border-white/10 animate-in fade-in zoom-in duration-200 flex overflow-hidden">

        {/* Left Side: Preview */}
        <div className="w-1/3 bg-cream-100 dark:bg-neutral-900 p-6 border-r border-gray-100 dark:border-white/5 flex flex-col items-center justify-center text-center">
          <div className={`w-32 h-44 shadow-md bg-white dark:bg-neutral-800 mb-4 flex flex-col items-center justify-center p-2 border transition-all duration-300
                ${config.template === 'Modern' ? 'border-l-8 border-gold-500' : ''}
                ${config.template === 'Manuscript' ? 'font-mono text-xs border border-gray-300' : ''}
                ${config.template === 'Standard' ? 'border border-gray-200' : ''}
            `}>
            <div className="w-full h-2 bg-gray-200 dark:bg-white/10 mb-2"></div>
            <div className="w-3/4 h-2 bg-gray-200 dark:bg-white/10 mb-4"></div>
            <div className="w-full h-1 bg-gray-100 dark:bg-white/5 mb-1"></div>
            <div className="w-full h-1 bg-gray-100 dark:bg-white/5 mb-1"></div>
            <div className="w-full h-1 bg-gray-100 dark:bg-white/5 mb-1"></div>
            <div className="w-2/3 h-1 bg-gray-100 dark:bg-white/5 mb-1"></div>
          </div>
          <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{config.template} Template</p>
          <p className="text-xs text-gray-500 mt-1">
            {config.template === 'Standard' && "Clean, readable serif font with generous margins."}
            {config.template === 'Manuscript' && "Courier font, double spaced, industry standard."}
            {config.template === 'Modern' && "Sans-serif headers, bold accents, contemporary feel."}
          </p>
        </div>

        {/* Right Side: Options */}
        <div className="w-2/3 p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Icons.Download className="text-gold-500" />
                Export Project
              </h2>
              <p className="text-sm text-gray-500 mt-1">Compile <span className="font-semibold text-gold-600">{bookTitle}</span> for publishing.</p>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-400">
              <Icons.X size={20} />
            </button>
          </div>

          <div className="space-y-6">
            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">File Format</label>
              <div className="grid grid-cols-3 gap-3">
                {['PDF', 'EPUB', 'DOCX'].map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setConfig({ ...config, format: fmt as any })}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${config.format === fmt
                      ? 'border-gold-500 bg-gold-50 dark:bg-gold-900/20 text-gold-700 dark:text-gold-400'
                      : 'border-gray-200 dark:border-neutral-700 hover:border-gold-300 dark:hover:border-gold-700 text-gray-600 dark:text-gray-400'
                      }`}
                  >
                    <Icons.FileText size={20} className="mb-1" />
                    <span className="text-xs font-bold">{fmt}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Scope Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Export Scope</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfig({ ...config, scope: 'current' })}
                  className={`px-4 py-2 text-sm rounded-lg border transition-all flex items-center gap-2 ${config.scope === 'current'
                    ? 'bg-gray-800 text-white dark:bg-white dark:text-black border-transparent'
                    : 'bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-600 text-gray-600 dark:text-gray-300 hover:border-gray-400'
                    }`}
                >
                  <Icons.FileText size={16} /> Current File
                </button>
                <button
                  onClick={() => setConfig({ ...config, scope: 'project' })}
                  className={`px-4 py-2 text-sm rounded-lg border transition-all flex items-center gap-2 ${config.scope === 'project'
                    ? 'bg-gray-800 text-white dark:bg-white dark:text-black border-transparent'
                    : 'bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-600 text-gray-600 dark:text-gray-300 hover:border-gray-400'
                    }`}
                >
                  <Icons.Folder size={16} /> Entire Project
                </button>
              </div>
            </div>

            {/* Template Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Style Template</label>
              <div className="flex gap-2">
                {['Standard', 'Manuscript', 'Modern'].map(temp => (
                  <button
                    key={temp}
                    onClick={() => setConfig({ ...config, template: temp as any })}
                    className={`px-4 py-2 text-sm rounded-lg border transition-all ${config.template === temp
                      ? 'bg-gray-800 text-white dark:bg-white dark:text-black border-transparent'
                      : 'bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-600 text-gray-600 dark:text-gray-300 hover:border-gray-400'
                      }`}
                  >
                    {temp}
                  </button>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="includeCover"
                checked={config.includeCover}
                onChange={(e) => setConfig({ ...config, includeCover: e.target.checked })}
                className="w-4 h-4 text-gold-600 bg-gray-100 border-gray-300 rounded focus:ring-gold-500 dark:bg-neutral-700 dark:border-neutral-600"
              />
              <label htmlFor="includeCover" className="text-sm text-gray-700 dark:text-gray-300">
                Generate Cover Page
              </label>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
            <Button
              className="flex-1"
              onClick={handleExport}
              isLoading={isExporting}
            >
              Export {config.format}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};