'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ShieldAlert, ShieldX, Star, Calendar, Save, RotateCcw, CheckSquare, Square, Images } from 'lucide-react';

interface MovieResult {
    title: string;
    tmdb_id: number | null;
    poster_url: string | null;
    synopsis: string | null;
    release_year: number | null;
    genres: string[];
    imdb_rating: number | null;
    watch_providers?: { stream: any[]; rent: any[]; buy: any[] } | null;
    confidence: string;
    context: string | null;
    source: string;
}

interface ExtractionResult {
    contentType: 'video' | 'slideshow';
    movies: MovieResult[];
    tiktok_url: string;
    raw_metadata: any;
}

export default function ReviewPage() {
    const router = useRouter();
    const [data, setData] = useState<ExtractionResult | null>(null);
    // For video: editable title
    const [title, setTitle] = useState('');
    // For slideshow: selection state
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const stored = sessionStorage.getItem('moviebox_review');
        if (!stored) {
            router.replace('/');
            return;
        }
        const parsed = JSON.parse(stored) as ExtractionResult;
        setData(parsed);

        if (parsed.contentType === 'video' && parsed.movies.length > 0) {
            setTitle(parsed.movies[0].title || '');
        }

        if (parsed.contentType === 'slideshow') {
            // Select all by default
            setSelected(new Set(parsed.movies.map((_, i) => i)));
        }
    }, [router]);

    if (!data) return null;

    const isSlideshow = data.contentType === 'slideshow';
    const movies = data.movies;

    // ─── Video: single movie review ─────────────────────────────────
    if (!isSlideshow) {
        if (movies.length === 0) {
            return (
                <div className="max-w-4xl mx-auto animate-fade-in-up text-center py-20">
                    <h1 className="text-3xl font-bold mb-4">No Movie Found</h1>
                    <p className="text-slate-400 mb-8">We couldn&apos;t identify a movie from this video.</p>
                    <button onClick={() => router.push('/')} className="text-violet-400 hover:text-violet-300 flex items-center gap-2 mx-auto transition-colors">
                        <RotateCcw className="w-4 h-4" /> Try Another Link
                    </button>
                </div>
            );
        }

        const movie = movies[0];

        const handleSaveVideo = async () => {
            setSaving(true);
            try {
                const payload = {
                    tiktok_url: data.tiktok_url,
                    title,
                    tmdb_id: movie.tmdb_id,
                    poster_url: movie.poster_url,
                    synopsis: movie.synopsis,
                    release_year: movie.release_year,
                    genres: movie.genres,
                    imdb_rating: movie.imdb_rating,
                    confidence: movie.confidence,
                    watch_providers: movie.watch_providers,
                    raw_metadata: data.raw_metadata,
                };
                const res = await fetch('/api/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
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
        }[movie.confidence] || 'text-slate-400';

        const ConfidenceIcon = {
            complete: ShieldCheck,
            partial: ShieldAlert,
            no_movie: ShieldX,
        }[movie.confidence] || ShieldAlert;

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
                        {movie.poster_url ? (
                            <img src={movie.poster_url} alt="Poster" className="w-full h-auto rounded-2xl shadow-2xl object-cover aspect-[2/3]" />
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
                                <span className="capitalize">{movie.confidence} Match</span>
                            </div>

                            {movie.imdb_rating && (
                                <div className="flex items-center gap-1.5 text-yellow-400 font-medium bg-yellow-400/10 px-3 py-1 rounded-full border border-yellow-400/20 text-sm">
                                    <Star className="w-4 h-4 fill-current" /> {movie.imdb_rating}/10
                                </div>
                            )}

                            {movie.release_year && (
                                <div className="flex items-center gap-1.5 text-slate-300 bg-slate-800 px-3 py-1 rounded-full text-sm">
                                    <Calendar className="w-4 h-4" /> {movie.release_year}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2 mb-6">
                            {movie.genres?.map((g: string) => (
                                <span key={g} className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-800 text-slate-300">
                                    {g}
                                </span>
                            ))}
                        </div>

                        <div className="mb-8 flex-1">
                            <h3 className="text-lg font-semibold mb-2">Synopsis</h3>
                            <p className="text-slate-400 leading-relaxed text-sm md:text-base">
                                {movie.synopsis || 'No synopsis available.'}
                            </p>
                        </div>

                        <button
                            onClick={handleSaveVideo}
                            disabled={saving || !title}
                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-violet-900/20 transition-all disabled:opacity-50"
                        >
                            {saving ? <span className="animate-pulse">Saving to Library...</span> : <><Save className="w-5 h-5" /> Save to Library</>}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ─── Slideshow: multi-select review ─────────────────────────────

    if (movies.length === 0) {
        return (
            <div className="max-w-4xl mx-auto animate-fade-in-up text-center py-20">
                <h1 className="text-3xl font-bold mb-4">No Movies Found</h1>
                <p className="text-slate-400 mb-8">We couldn&apos;t identify any movies from this slideshow.</p>
                <button onClick={() => router.push('/')} className="text-violet-400 hover:text-violet-300 flex items-center gap-2 mx-auto transition-colors">
                    <RotateCcw className="w-4 h-4" /> Try Another Link
                </button>
            </div>
        );
    }

    const toggleSelection = (index: number) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });
    };

    const allSelected = selected.size === movies.length;

    const toggleAll = () => {
        if (allSelected) {
            setSelected(new Set());
        } else {
            setSelected(new Set(movies.map((_, i) => i)));
        }
    };

    const handleSaveSlideshow = async () => {
        setSaving(true);
        try {
            const moviesToSave = movies
                .filter((_, i) => selected.has(i))
                .map(movie => ({
                    tiktok_url: data.tiktok_url,
                    title: movie.title,
                    tmdb_id: movie.tmdb_id,
                    poster_url: movie.poster_url,
                    synopsis: movie.synopsis,
                    release_year: movie.release_year,
                    genres: movie.genres,
                    imdb_rating: movie.imdb_rating,
                    confidence: movie.confidence,
                    watch_providers: movie.watch_providers,
                    raw_metadata: data.raw_metadata,
                }));

            const res = await fetch('/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(moviesToSave),
            });
            if (!res.ok) throw new Error('Failed to save');
            sessionStorage.removeItem('moviebox_review');
            router.push('/library');
        } catch (err) {
            console.error(err);
            alert('Could not save movies');
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold">Select movies to save</h1>
                    <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/20">
                        <Images className="w-3.5 h-3.5" />
                        {data.raw_metadata?.imageUrls?.length ?? '?'} slides
                    </span>
                </div>
                <button onClick={() => router.push('/')} className="text-slate-400 hover:text-white flex items-center gap-2 transition-colors text-sm">
                    <RotateCcw className="w-4 h-4" /> Try again
                </button>
            </div>

            {/* Counter + Select all */}
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-400">
                    <span className="text-white font-medium">{selected.size}</span> of {movies.length} selected
                </p>
                <button
                    onClick={toggleAll}
                    className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
                >
                    {allSelected ? 'Deselect all' : 'Select all'}
                </button>
            </div>

            {/* Movie list */}
            <div className="flex flex-col gap-3 mb-6">
                {movies.map((movie, index) => {
                    const isSelected = selected.has(index);
                    const isPartial = movie.confidence === 'partial';

                    return (
                        <button
                            key={index}
                            type="button"
                            onClick={() => toggleSelection(index)}
                            className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                                isSelected
                                    ? 'border-violet-500/50 bg-violet-500/5'
                                    : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600'
                            }`}
                        >
                            {/* Poster thumbnail */}
                            {movie.poster_url ? (
                                <img
                                    src={movie.poster_url}
                                    alt={movie.title}
                                    className="w-14 h-[84px] rounded-lg object-cover shrink-0"
                                />
                            ) : (
                                <div className="w-14 h-[84px] rounded-lg bg-slate-700 flex items-center justify-center text-slate-500 text-xs shrink-0">
                                    No img
                                </div>
                            )}

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <p className="text-[15px] font-medium text-white truncate">{movie.title}</p>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    {/* Confidence dot */}
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                                        movie.confidence === 'complete' ? 'bg-emerald-400' : 'bg-amber-400'
                                    }`} />
                                    {movie.release_year && (
                                        <span className="text-xs text-slate-400">{movie.release_year}</span>
                                    )}
                                    {movie.genres?.length > 0 && (
                                        <span className="text-xs text-slate-500">{movie.genres.slice(0, 2).join(', ')}</span>
                                    )}
                                    {movie.imdb_rating && (
                                        <span className="text-xs text-yellow-400 flex items-center gap-0.5">
                                            <Star className="w-3 h-3 fill-current" /> {movie.imdb_rating}
                                        </span>
                                    )}
                                </div>
                                {movie.context && (
                                    <p className="text-xs text-slate-500 italic mt-1">{movie.context}</p>
                                )}
                                {isPartial && (
                                    <p className="text-xs text-amber-400/70 mt-1">Partial match — verify title</p>
                                )}
                            </div>

                            {/* Checkbox */}
                            <div className="shrink-0">
                                {isSelected ? (
                                    <CheckSquare className="w-5 h-5 text-violet-400" />
                                ) : (
                                    <Square className="w-5 h-5 text-slate-600" />
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Footer actions */}
            <button
                onClick={handleSaveSlideshow}
                disabled={saving || selected.size === 0}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-violet-900/20 transition-all disabled:opacity-50"
            >
                {saving ? (
                    <span className="animate-pulse">Saving to Library...</span>
                ) : (
                    <>
                        <Save className="w-5 h-5" /> Save {selected.size} to library
                    </>
                )}
            </button>
        </div>
    );
}
