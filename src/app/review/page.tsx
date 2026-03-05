'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ShieldAlert, ShieldX, Star, Calendar, Save, RotateCcw } from 'lucide-react';

export default function ReviewPage() {
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [title, setTitle] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const stored = sessionStorage.getItem('moviebox_review');
        if (!stored) {
            router.replace('/');
            return;
        }
        const parsed = JSON.parse(stored);
        setData(parsed);
        setTitle(parsed.title || '');
    }, [router]);

    if (!data) return null;

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                ...data,
                title, // use potentially edited title
            };
            const res = await fetch('/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error('Failed to save');

            sessionStorage.removeItem('moviebox_review');
            router.push('/library');
        } catch (err) {
            console.error(err);
            alert('Could not save movie');
            setSaving(false);
        }
    };

    const confidenceColor = {
        complete: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
        partial: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
        no_movie: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
    }[data.confidence as string] || 'text-slate-400';

    const ConfidenceIcon = {
        complete: ShieldCheck,
        partial: ShieldAlert,
        no_movie: ShieldX,
    }[data.confidence as string] || ShieldAlert;

    return (
        <div className="max-w-4xl mx-auto animate-fade-in-up">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">Review Match</h1>
                <button onClick={() => router.push('/')} className="text-slate-400 hover:text-white flex items-center gap-2 transition-colors">
                    <RotateCcw className="w-4 h-4" /> Try Again
                </button>
            </div>

            <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-1/3 shrink-0">
                    {data.poster_url ? (
                        <img src={data.poster_url} alt="Poster" className="w-full h-auto rounded-2xl shadow-2xl object-cover aspect-[2/3]" />
                    ) : (
                        <div className="w-full aspect-[2/3] bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500">
                            No Poster
                        </div>
                    )}
                </div>

                <div className="flex-1 flex flex-col">
                    <div className="mb-6">
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Movie Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full text-4xl font-bold bg-transparent border-b-2 border-slate-700 hover:border-violet-500 focus:border-violet-500 focus:outline-none py-1 transition-colors"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mb-6">
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-medium ${confidenceColor}`}>
                            <ConfidenceIcon className="w-4 h-4" />
                            <span className="capitalize">{data.confidence} Match</span>
                        </div>

                        {data.imdb_rating && (
                            <div className="flex items-center gap-1.5 text-yellow-400 font-medium bg-yellow-400/10 px-3 py-1 rounded-full border border-yellow-400/20 text-sm">
                                <Star className="w-4 h-4 fill-current" /> {data.imdb_rating}/10
                            </div>
                        )}

                        {data.release_year && (
                            <div className="flex items-center gap-1.5 text-slate-300 bg-slate-800 px-3 py-1 rounded-full text-sm">
                                <Calendar className="w-4 h-4" /> {data.release_year}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6">
                        {data.genres?.map((g: string) => (
                            <span key={g} className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-800 text-slate-300">
                                {g}
                            </span>
                        ))}
                    </div>

                    <div className="mb-8 flex-1">
                        <h3 className="text-lg font-semibold mb-2">Synopsis</h3>
                        <p className="text-slate-400 leading-relaxed text-sm md:text-base">
                            {data.synopsis || 'No synopsis available.'}
                        </p>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving || !title}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-violet-900/20 transition-all disabled:opacity-50"
                    >
                        {saving ? <span className="animate-pulse">Saving to Library...</span> : <><Save className="w-5 h-5" /> Save to Library</>}
                    </button>
                </div>
            </div>
        </div >
    );
}
