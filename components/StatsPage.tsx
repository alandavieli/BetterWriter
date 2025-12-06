import React from 'react';
import { Book, FileNode, NodeType } from '../types';
import { Icons } from './Icons';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

interface StatsPageProps {
  books: Book[];
  fileMap: Record<string, FileNode>;
}

export const StatsPage: React.FC<StatsPageProps> = ({ books, fileMap }) => {
  // Calculate stats
  const allNodes = Object.values(fileMap) as FileNode[];
  const files = allNodes.filter(n => n.type === NodeType.FILE);
  const totalWords = allNodes.reduce((acc, node) => acc + (node.wordCount || 0), 0);

  // New Stats Calculations
  const totalChars = files.reduce((acc, f) => acc + (f.content?.length || 0), 0);
  const readingTime = Math.ceil(totalWords / 250); // Approx 250 wpm
  const avgChapterLength = files.length > 0 ? Math.round(totalWords / files.length) : 0;

  const longestChapter = files.reduce((prev, current) => {
    return (prev.wordCount || 0) > (current.wordCount || 0) ? prev : current;
  }, files[0] || { title: 'N/A', wordCount: 0 });

  // Prepare chart data (Words per book instead of progress)
  const chartData = books.map(book => {
    // Find files belonging to this book
    const bookFiles = files.filter(f => {
      let parent = fileMap[f.parentId || ''];
      // Simple check: trace up to root. For this flat demo, we assume all files belong to active book.
      // In a real app with multiple roots, we'd filter by rootFolderId.
      // Here we just estimate for demo purposes or use global files if single project view.
      return true; // Use global stats for now as 'files' contains all files
    });
    return {
      bookTitle: book.title,
      wordCount: totalWords // In this simple data model, words are global.
    };
  });

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
            Detailed overview of your creative productivity.
          </p>
        </div>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
              <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">Chapters</div>
              <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">{files.length}</div>
            </div>
          </div>
        </div>

        {/* Additional Stats Grid */}
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 px-1">Deep Dive</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {/* Reading Time */}
          <div className="bg-white dark:bg-neutral-800 p-5 rounded-2xl shadow-sm border border-gold-100 dark:border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <Icons.Clock className="text-green-500" size={20} />
              <span className="text-sm font-bold text-gray-500 uppercase">Reading Time</span>
            </div>
            <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {readingTime} <span className="text-sm font-normal text-gray-400">min</span>
            </div>
          </div>

          {/* Characters */}
          <div className="bg-white dark:bg-neutral-800 p-5 rounded-2xl shadow-sm border border-gold-100 dark:border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <Icons.Layout className="text-indigo-500" size={20} />
              <span className="text-sm font-bold text-gray-500 uppercase">Characters</span>
            </div>
            <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {totalChars.toLocaleString()}
            </div>
          </div>

          {/* Avg Chapter Length */}
          <div className="bg-white dark:bg-neutral-800 p-5 rounded-2xl shadow-sm border border-gold-100 dark:border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <Icons.Layout className="text-orange-500" size={20} />
              <span className="text-sm font-bold text-gray-500 uppercase">Avg. Chapter</span>
            </div>
            <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {avgChapterLength} <span className="text-sm font-normal text-gray-400">words</span>
            </div>
          </div>

          {/* Longest Chapter */}
          <div className="bg-white dark:bg-neutral-800 p-5 rounded-2xl shadow-sm border border-gold-100 dark:border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <Icons.Star className="text-yellow-500" size={20} />
              <span className="text-sm font-bold text-gray-500 uppercase">Longest File</span>
            </div>
            <div className="truncate text-lg font-bold text-gray-800 dark:text-gray-100" title={longestChapter.title}>
              {longestChapter.title}
            </div>
            <div className="text-xs text-gray-400">{longestChapter.wordCount} words</div>
          </div>
        </div>

        {/* Word Count Chart */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-lg border border-gold-100 dark:border-white/5 p-8 h-96">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-6">Word Count Distribution</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.length ? chartData : [{ bookTitle: 'No Data', wordCount: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#8884d820" />
              <XAxis dataKey="bookTitle" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="wordCount" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={60}>
                {/* @ts-ignore */}
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={'#f59e0b'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};