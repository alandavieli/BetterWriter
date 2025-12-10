import React, { useState, useEffect } from 'react';
import { Book, FileNode, NodeType, WritingStats } from '../types';
import { Icons } from './Icons';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

interface StatsPageProps {
  books: Book[];
  fileMap: Record<string, FileNode>;
  stats: WritingStats;
  onUpdateGoals: (daily: number, weekly: number) => void;
}

const getTodayString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const StatsPage: React.FC<StatsPageProps> = ({ books, fileMap, stats, onUpdateGoals }) => {
  // Calculate current stats
  const allNodes = Object.values(fileMap) as FileNode[];
  const files = allNodes.filter(n => n.type === NodeType.FILE);
  const totalWords = allNodes.reduce((acc, node) => acc + (node.wordCount || 0), 0);

  const [showGoalEditor, setShowGoalEditor] = useState(false);
  const [dailyGoalInput, setDailyGoalInput] = useState(stats.dailyGoal);
  const [weeklyGoalInput, setWeeklyGoalInput] = useState(stats.weeklyGoal);

  // Calculate today's progress
  const todayEntry = stats.dailyHistory.find(d => d.date === getTodayString());
  const todayWords = todayEntry?.wordCount || 0;
  const todayTime = todayEntry?.timeMinutes || 0;
  const dailyProgress = stats.dailyGoal > 0 ? Math.min((todayWords / stats.dailyGoal) * 100, 100) : 0;

  // Calculate weekly progress
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weeklyWords = stats.dailyHistory
    .filter(d => new Date(d.date) >= oneWeekAgo)
    .reduce((acc, d) => acc + d.wordCount, 0);
  const weeklyProgress = stats.weeklyGoal > 0 ? Math.min((weeklyWords / stats.weeklyGoal) * 100, 100) : 0;

  // Get last 30 days for charts
  const last30Days = stats.dailyHistory.slice(-30);

  // Prepare productivity chart data
  const productivityData = last30Days.map(d => ({
    date: formatDate(d.date),
    words: d.wordCount,
    time: d.timeMinutes
  }));

  // Reading time estimate
  const readingTime = Math.ceil(totalWords / 250);

  // Average words per session
  const sessionsWithWords = stats.dailyHistory.filter(d => d.wordCount > 0);
  const avgWordsPerSession = sessionsWithWords.length > 0
    ? Math.round(sessionsWithWords.reduce((acc, d) => acc + d.wordCount, 0) / sessionsWithWords.length)
    : 0;

  const handleSaveGoals = () => {
    onUpdateGoals(dailyGoalInput, weeklyGoalInput);
    setShowGoalEditor(false);
  };

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
            Track your progress, maintain streaks, and achieve your writing goals.
          </p>
        </div>

        {/* Goals Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Your Goals</h3>
            <button
              onClick={() => setShowGoalEditor(!showGoalEditor)}
              className="px-3 py-1.5 text-sm bg-gold-500 hover:bg-gold-600 text-white rounded-lg"
            >
              {showGoalEditor ? 'Cancel' : 'Edit Goals'}
            </button>
          </div>

          {showGoalEditor ? (
            <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl shadow-sm border border-gold-100 dark:border-white/5 mb-6">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Daily Goal (words)
                  </label>
                  <input
                    type="number"
                    value={dailyGoalInput}
                    onChange={(e) => setDailyGoalInput(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-900 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Weekly Goal (words)
                  </label>
                  <input
                    type="number"
                    value={weeklyGoalInput}
                    onChange={(e) => setWeeklyGoalInput(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-900 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <button
                onClick={handleSaveGoals}
                className="px-4 py-2 bg-gold-500 hover:bg-gold-600 text-white rounded-lg font-medium"
              >
                Save Goals
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Daily Goal Progress */}
              <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl shadow-sm border border-gold-100 dark:border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600">
                      <Icons.Star size={24} />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Daily Goal</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {todayWords} / {stats.dailyGoal}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-500"
                    style={{ width: `${dailyProgress}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-2">{Math.round(dailyProgress)}% complete</div>
              </div>

              {/* Weekly Goal Progress */}
              <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl shadow-sm border border-gold-100 dark:border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600">
                      <Icons.Star size={24} />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Weekly Goal</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {weeklyWords} / {stats.weeklyGoal}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-full transition-all duration-500"
                    style={{ width: `${weeklyProgress}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-2">{Math.round(weeklyProgress)}% complete</div>
              </div>
            </div>
          )}
        </div>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Streak */}
          <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl shadow-sm border border-gold-100 dark:border-white/5 flex flex-col items-center text-center">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl text-orange-600 mb-3">
              <Icons.Heart size={24} />
            </div>
            <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">Current Streak</div>
            <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">{stats.currentStreak}</div>
            <div className="text-xs text-gray-400 mt-1">Best: {stats.longestStreak} days</div>
          </div>

          {/* Total Words */}
          <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl shadow-sm border border-gold-100 dark:border-white/5 flex flex-col items-center text-center">
            <div className="p-3 bg-gold-100 dark:bg-gold-900/30 rounded-xl text-gold-600 mb-3">
              <Icons.Type size={24} />
            </div>
            <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Words</div>
            <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">{totalWords.toLocaleString()}</div>
          </div>

          {/* Time Spent */}
          <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl shadow-sm border border-gold-100 dark:border-white/5 flex flex-col items-center text-center">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl text-green-600 mb-3">
              <Icons.Clock size={24} />
            </div>
            <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">Time Spent</div>
            <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">
              {Math.floor(stats.totalTimeMinutes / 60)}h {stats.totalTimeMinutes % 60}m
            </div>
          </div>

          {/* Active Projects */}
          <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl shadow-sm border border-gold-100 dark:border-white/5 flex flex-col items-center text-center">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 mb-3">
              <Icons.BookOpen size={24} />
            </div>
            <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">Projects</div>
            <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">{books.length}</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          {/* Productivity Graph - Words Over Time */}
          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-lg border border-gold-100 dark:border-white/5 p-6 h-80">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">Writing Productivity (Last 30 Days)</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={productivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#8884d820" />
                <XAxis
                  dataKey="date"
                  stroke="#888"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="words"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b', r: 4 }}
                  name="Words Written"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Time Spent Chart */}
          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-lg border border-gold-100 dark:border-white/5 p-6 h-80">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">Time Spent (Last 30 Days)</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productivityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#8884d820" />
                <XAxis
                  dataKey="date"
                  stroke="#888"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar dataKey="time" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Minutes" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-neutral-800 p-5 rounded-2xl shadow-sm border border-gold-100 dark:border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <Icons.Clock className="text-green-500" size={20} />
              <span className="text-sm font-bold text-gray-500 uppercase">Reading Time</span>
            </div>
            <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {readingTime} <span className="text-sm font-normal text-gray-400">min</span>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 p-5 rounded-2xl shadow-sm border border-gold-100 dark:border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <Icons.FileText className="text-blue-500" size={20} />
              <span className="text-sm font-bold text-gray-500 uppercase">Total Files</span>
            </div>
            <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {files.length}
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 p-5 rounded-2xl shadow-sm border border-gold-100 dark:border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <Icons.Type className="text-orange-500" size={20} />
              <span className="text-sm font-bold text-gray-500 uppercase">Avg. Per Session</span>
            </div>
            <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {avgWordsPerSession} <span className="text-sm font-normal text-gray-400">words</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};