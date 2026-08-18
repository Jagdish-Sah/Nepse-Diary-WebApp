'use client';

import React, { useState } from 'react';
import { Bot, Send, Sparkles, Cpu, Layers } from 'lucide-react';

export default function AiAnalystView() {
  const [model, setModel] = useState<'gemini' | 'chatgpt' | 'grok'>('gemini');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, query })
      });
      const data = await res.json();
      if (data.success) {
        setResponse(data.response);
      } else {
        setResponse(`Error: ${data.error}`);
      }
    } catch (e: any) {
      setResponse(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header & Model Selector */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm space-y-4">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          🤖 Multi-Model Quantitative AI Analyst
        </h2>
        <p className="text-xs text-slate-400">
          Consult top-tier LLM models injected with live NEPSE portfolio data as context.
        </p>

        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          {[
            { id: 'gemini', label: '🔵 Google Gemini 2.0 Flash' },
            { id: 'chatgpt', label: '🟢 OpenAI GPT-4o' },
            { id: 'grok', label: '✖️ xAI Grok' }
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setModel(m.id as any)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                model === m.id
                  ? 'bg-emerald-600 text-slate-950 shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleAsk} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
        <label className="block text-xs font-semibold text-slate-300">
          Ask Your Quantitative Portfolio Analyst
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Analyze my portfolio concentration and give me breakeven targets..."
            className="flex-1 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs text-slate-100 outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Send className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Analyzing...' : 'Consult AI'}
          </button>
        </div>
      </form>

      {/* Response Display */}
      {response && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <Sparkles className="w-4 h-4" /> AI Consensus Report
          </div>
          <div className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
            {response}
          </div>
        </div>
      )}
    </div>
  );
}
