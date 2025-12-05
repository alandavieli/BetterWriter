import React, { useState } from 'react';
import { Book, FileNode, NodeType } from '../types';
import { Icons } from './Icons';
import { Button } from './Button';
import { analyzeBookProgress } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

interface StatsPageProps {
  books: Book[];
  fileMap: Record<string, FileNode>;
}

interface AnalysisResult {
  bookId: string;
  bookTitle: string;
  progress: number;
  estimatedCompletion: string;
  tone: string;
}

export const StatsPage: React.FC<StatsPageProps> = ({ books, fileMap }) => {
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
    <div className="min-h-screen bg-cream-50 dark:bg-neutral-900 p-8 pt-24 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 border-b border-gold-200 dark:border-white/10 pb-6">
          <h2 className="text-3xl font-serif font-bold text-gold-900 dark:text-gold-100 flex items-center gap-3">
            <Icons.BarChart2 className="text-gold-500" size={32} />
            Writing Statistics
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Detailed overview of your creative productivity and story analysis.
          </p>
        </div>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl shadow-sm border border-gold-100 dark:border-white/5 flex items-center gap-4">
            <div className="p-3 bg-gold-100 dark:bg-gold-900/30 rounded-xl text-gold-600">
              <Icons.Type size={24} />
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Words</div>
              <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">{totalWords.toLocaleString()}</div>
            </div>
          </div>
          <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl shadow-sm border border-gold-100 dark:border-white/5 flex items-center gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600">
              <Icons.BookOpen size={24} />
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">Active Projects</div>
              <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">{books.length}</div>
            </div>
          </div>
           <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl shadow-sm border border-gold-100 dark:border-white/5 flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600">
              <Icons.FileText size={24} />
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Notes & Chapters</div>
              <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">{files.length}</div>
            </div>
          </div>
        </div>

        {/* AI Analysis Section */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-lg border border-gold-100 dark:border-white/5 p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <Icons.Sparkles size={20} className="text-gold-500" />
                Gemini Project Analysis
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Deep AI insights on completion, pacing, and tone.</p>
            </div>
            <Button onClick={handleRunAnalysis} isLoading={analyzing}>
              {results.length > 0 ? 'Refresh Analysis' : 'Run Full Analysis'}
            </Button>
          </div>

          {results.length === 0 && !analyzing ? (
            <div className="text-center py-16 bg-cream-50 dark:bg-black/20 rounded-xl border border-dashed border-gray-200 dark:border-white/10">
              <Icons.Wand2 className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={56} />
              <p className="text-gray-500 dark:text-gray-400 font-medium">No analysis data yet.</p>
              <p className="text-sm text-gray-400">Click the button above to analyze your books.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Chart */}
              <div className="bg-gray-50 dark:bg-black/20 p-6 rounded-xl border border-gray-100 dark:border-white/5 h-80">
                 <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#8884d820" />
                    <XAxis dataKey="bookTitle" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} unit="%" />
                    <Tooltip 
                      cursor={{fill: 'transparent'}}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="progress" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={40}>
                      {chartData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.progress > 80 ? '#10b981' : '#f59e0b'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Details List */}
              <div className="space-y-4">
                {results.map(res => (
                  <div key={res.bookId} className="bg-cream-50 dark:bg-black/20 p-5 rounded-xl border border-gold-100 dark:border-white/5 hover:border-gold-300 transition-colors">
                    <div className="flex justify-between mb-2">
                      <span className="font-bold text-gray-800 dark:text-gray-200 text-lg">{res.bookTitle}</span>
                      <span className="text-gold-600 font-bold font-mono text-lg">{res.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                      <div className="bg-gold-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${res.progress}%` }}></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Icons.Music size={14} className="text-gold-500" />
                        Tone: <span className="font-medium text-gray-800 dark:text-gray-200">{res.tone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Icons.Clock size={14} className="text-gold-500" />
                        ETA: <span className="font-medium text-gray-800 dark:text-gray-200">{res.estimatedCompletion}</span>
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
  );
};