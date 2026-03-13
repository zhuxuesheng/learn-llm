/**
 * Header Component
 * Contains logo, title, and URL input
 */

import React, { useState } from 'react';

interface HeaderProps {
  onAnalyze: (url: string) => void;
  isLoading: boolean;
}

const EXAMPLE_MODELS = [
  { name: 'Qwen3.5-MoE', id: 'Qwen/Qwen3.5-35B-A3B-Base' },
  { name: 'Qwen2.5-7B', id: 'Qwen/Qwen2.5-7B' },
  { name: 'Mistral-7B', id: 'mistralai/Mistral-7B-v0.3' },
];

export function Header({ onAnalyze, isLoading }: HeaderProps) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && !isLoading) {
      onAnalyze(url);
    }
  };

  const handleExampleClick = (modelId: string) => {
    // Use huggingface.co which supports CORS
    const fullUrl = `https://huggingface.co/${modelId}`;
    setUrl(fullUrl);
    onAnalyze(fullUrl);
  };

  return (
    <header className="bg-slate-900 border-b border-slate-700 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">LLM Arch-Viewer</h1>
              <p className="text-xs text-slate-400">Visualize Model Architecture from config.json</p>
            </div>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex-1 max-w-2xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://huggingface.co/author/model or https://hf-mirror.com/author/model"
                className="flex-1 px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !url.trim()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                {isLoading ? 'Loading...' : 'Analyze'}
              </button>
            </div>
          </form>
        </div>

        {/* Example Models */}
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400">Try:</span>
          {EXAMPLE_MODELS.map((model) => (
            <button
              key={model.id}
              onClick={() => handleExampleClick(model.id)}
              disabled={isLoading}
              className="text-xs px-2 py-1 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-blue-400 rounded transition-colors"
            >
              {model.name}
            </button>
          ))}
        </div>

        {/* Tips */}
        <div className="mt-2 text-xs text-slate-500">
          <p>Tip: Use <code className="bg-slate-800 px-1 rounded">hf-mirror.com</code> URLs if huggingface.co is slow or blocked</p>
        </div>
      </div>
    </header>
  );
}
