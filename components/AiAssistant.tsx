import React, { useState, useRef, useEffect } from 'react';
import { Icons } from './Icons';
import { Button } from './Button';
import { AssistantMessage } from '../types';

interface AiAssistantProps {
  isOpen: boolean;
  history: AssistantMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  onClose: () => void;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({ 
  isOpen, 
  history, 
  onSendMessage, 
  isLoading,
  onClose
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const msg = input;
    setInput('');
    await onSendMessage(msg);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-16 right-0 bottom-0 w-80 md:w-96 bg-white dark:bg-neutral-800 border-l border-gold-200/50 dark:border-white/5 shadow-2xl z-40 flex flex-col transition-transform duration-300 transform translate-x-0">
      
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-white/5 bg-cream-50 dark:bg-neutral-900 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Icons.Sparkles className="text-gold-500" size={18} />
          <h3 className="font-serif font-bold text-gray-800 dark:text-cream-100">Better Writer AI</h3>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <Icons.X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-black/20">
        {history.length === 0 && (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
            <p>👋 Hi! I'm your writing assistant.</p>
            <p className="mt-2">Ask me to:</p>
            <ul className="mt-2 space-y-1 text-xs">
              <li>• Suggest a plot twist</li>
              <li>• Critique the current scene</li>
              <li>• Describe a character</li>
            </ul>
          </div>
        )}
        {history.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-gold-500 text-white rounded-br-none' 
                : 'bg-white dark:bg-neutral-700 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-white/5 rounded-bl-none shadow-sm'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-neutral-700 px-4 py-3 rounded-2xl rounded-bl-none border border-gray-100 dark:border-white/5">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white dark:bg-neutral-800 border-t border-gray-100 dark:border-white/5">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask for suggestions..."
            className="w-full pl-4 pr-10 py-3 bg-gray-100 dark:bg-neutral-900 border-transparent focus:border-gold-500 rounded-xl text-sm focus:ring-1 focus:ring-gold-500 outline-none transition-all dark:text-white"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gold-600 hover:text-gold-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icons.Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};