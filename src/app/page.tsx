'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Film, Loader2, ArrowRight } from 'lucide-react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Extraction failed');
      }

      // Store result in sessionStorage
      sessionStorage.setItem('moviebox_review', JSON.stringify(data));
      router.push('/review');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in-up">
      <div className="text-center mb-10 max-w-xl">
        <h1 className="text-5xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
          Capture the Magic
        </h1>
        <p className="text-lg text-slate-400">
          Paste a TikTok video link and we will automatically extract the movie recommendation and log it to your library.
        </p>
      </div>

      <div className="w-full max-w-2xl glass-panel p-8 rounded-3xl relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 z-10 bg-slate-900/50 backdrop-blur-sm flex flex-col items-center justify-center rounded-3xl">
            <Loader2 className="w-10 h-10 text-violet-400 animate-spin mb-4" />
            <p className="text-violet-200 font-medium animate-pulse">Extracting movie metadata...</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative flex flex-col gap-4">
          <div className="relative">
            <Film className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="url"
              required
              placeholder="https://www.tiktok.com/@user/video/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-600 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all font-medium"
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm px-2 text-center bg-red-950/30 py-2 rounded-lg border border-red-900/50">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !url}
            className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-2xl py-4 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-900/20"
          >
            Extract Movie
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
}
