import React, { useState } from 'react';
import { Book, FileNode, NodeType } from '../types';
import { Icons } from './Icons';
import { Button } from './Button';
import { analyzeBookProgress } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

interface DashboardProps {
  books: Book[];
  fileMap: Record<string, FileNode>;
  onClose: () => void;
}

interface AnalysisResult {
  bookId: string;
  bookTitle: string;
  progress: number;
  estimatedCompletion: string;
  tone: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ books, fileMap, onClose }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult[]>([]);

  // Calculate simple stats immediately
  const allNodes = Object.values(fileMap) as FileNode[];
  const totalWords = allNodes.reduce((acc, node) => acc + (node.wordCount || 0), 0);
  const files = allNodes.filter(n => n.type === NodeType.FILE);

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    const newResults: AnalysisResult[] = [];

    for (const book of books) {
      // In this demo version, we analyze all files as if they belong to the current book
      const bookFiles = files; 

      const chaptersData = bookFiles.map(f => ({
        title: f.title,
        wordCount: f.wordCount || 0
      }));

      try {
        const aiRes = await analyzeBookProgress(book.title, chaptersData);
        newResults.push({
          bookId: book.id,
          bookTitle: book.title,
          progress: aiRes.progress,
          estimatedCompletion: aiRes.estimatedCompletion,
          tone: aiRes.tone
        });
      } catch (e) {
        console.error("Analysis failed for book", book.title, e);
      }
    }
    setResults(newResults);
    setAnalyzing(false);
  };

  const chartData = results.length > 0 ? results : books.map(b => ({
    bookTitle: b.title,
    progress: 0,
    estimatedCompletion: 'N/A',
    tone: 'N/A'
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-neutral-800 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gold-200 dark:border-white/10 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-cream-50 dark:bg-neutral-900">
          <div>
            <h2 className="text-2xl font-serif font-bold text-gold-900 dark:text-gold-100 flex items-center gap-2">
              <Icons.BarChart2 className="text-gold-500" />
              Writing Dashboard
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Overview of your creative progress
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <Icons.X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto bg-white dark:bg-neutral-800">
          
          {/* Top Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-cream-50 dark:bg-white/5 p-4 rounded-xl border border-gold-100 dark:border-white/5">
              <div className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Total Words</div>
              <div className="text-3xl font-bold text-gold-700 dark:text-gold-400">{totalWords.toLocaleString()}</div>
            </div>
            <div className="bg-cream-50 dark:bg-white/5 p-4 rounded-xl border border-gold-100 dark:border-white/5">
              <div className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Active Projects</div>
              <div className="text-3xl font-bold text-gray-800 dark:text-gray-200">{books.length}</div>
            </div>
             <div className="bg-cream-50 dark:bg-white/5 p-4 rounded-xl border border-gold-100 dark:border-white/5">
              <div className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Total Notes</div>
              <div className="text-3xl font-bold text-gray-800 dark:text-gray-200">{files.length}</div>
            </div>
          </div>

          {/* AI Analysis Section */}
          <div className="mb-8">
            <div className="flex justify-between items-end mb-4">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <Icons.Sparkles size={18} className="text-gold-500" />
                Gemini Analysis
              </h3>
              <Button onClick={handleRunAnalysis} isLoading={analyzing} size="sm">
                {results.length > 0 ? 'Refresh Analysis' : 'Analyze Progress'}
              </Button>
            </div>

            {results.length === 0 && !analyzing ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-white/5 rounded-xl border border-dashed border-gray-200 dark:border-white/10">
                <Icons.Wand2 className="mx-auto text-gray-300 dark:text-gray-600 mb-3" size={48} />
                <p className="text-gray-500 dark:text-gray-400">Run an AI analysis to get deep insights on your book's completion, tone, and pacing.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Chart */}
                <div className="bg-white dark:bg-black/20 p-4 rounded-xl border border-gray-100 dark:border-white/5 h-64">
                   <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#8884d820" />
                      <XAxis dataKey="bookTitle" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} unit="%" />
                      <Tooltip 
                        cursor={{fill: 'transparent'}}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="progress" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.progress > 80 ? '#10b981' : '#f59e0b'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Details List */}
                <div className="space-y-3">
                  {results.map(res => (
                    <div key={res.bookId} className="bg-cream-50 dark:bg-white/5 p-4 rounded-lg border border-gold-100 dark:border-white/5">
                      <div className="flex justify-between mb-1">
                        <span className="font-bold text-gray-800 dark:text-gray-200">{res.bookTitle}</span>
                        <span className="text-gold-600 font-mono">{res.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-3">
                        <div className="bg-gold-500 h-1.5 rounded-full" style={{ width: `${res.progress}%` }}></div>
                      </div>
                      <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Icons.Book size={12} />
                          Tone: <span className="text-gray-700 dark:text-gray-300">{res.tone}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Icons.Save size={12} />
                          ETA: <span className="text-gray-700 dark:text-gray-300">{res.estimatedCompletion}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};