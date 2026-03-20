'use client';

import { useEffect, useState } from 'react';
import { Star, Eye, EyeOff, Loader2, X, Trash2 } from 'lucide-react';

export default function LibraryPage() {
    const [movies, setMovies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'want_to_watch' | 'watched'>('all');
    const [selectedMovie, setSelectedMovie] = useState<any | null>(null);

    useEffect(() => {
        fetch('/api/movies')
            .then(res => res.json())
            .then(data => {
                if (data.movies) setMovies(data.movies);
            })
            .finally(() => setLoading(false));
    }, []);

    const toggleWatchStatus = async (movie: any) => {
        const newStatus = movie.watch_status === 'watched' ? 'want_to_watch' : 'watched';

        // optimistically update
        setMovies(prev => prev.map(m => m.id === movie.id ? { ...m, watch_status: newStatus } : m));
        if (selectedMovie) {
            setSelectedMovie({ ...selectedMovie, watch_status: newStatus });
        }

        try {
            await fetch(`/api/movies/${movie.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ watch_status: newStatus })
            });
        } catch {
            // revert on failure
            setMovies(prev => prev.map(m => m.id === movie.id ? { ...m, watch_status: movie.watch_status } : m));
        }
    };

    const handleDelete = async (e: React.MouseEvent, movie: any) => {
        e.stopPropagation();
        if (!confirm(`Delete "${movie.title}" from your library?`)) return;

        setMovies(prev => prev.filter(m => m.id !== movie.id));
        if (selectedMovie?.id === movie.id) setSelectedMovie(null);

        try {
            const res = await fetch(`/api/movies/${movie.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
        } catch {
            setMovies(prev => [...prev, movie]);
        }
    };

    const filteredMovies = movies.filter(m => filter === 'all' ? true : m.watch_status === filter);

    return (
        <>
        <div className="max-w-6xl mx-auto animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400">
                    My Library
                </h1>

                <div className="flex p-1 bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-700 w-fit">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === 'all' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        All Movies
                    </button>
                    <button
                        onClick={() => setFilter('want_to_watch')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === 'want_to_watch' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        Want to Watch
                    </button>
                    <button
                        onClick={() => setFilter('watched')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === 'watched' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        Watched
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-4" />
                    <p className="text-slate-400">Loading library...</p>
                </div>
            ) : filteredMovies.length === 0 ? (
                <div className="text-center py-20 glass-panel rounded-3xl">
                    <p className="text-lg text-slate-400">No movies found in this category.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {filteredMovies.map(movie => (
                        <div
                            key={movie.id}
                            className="group cursor-pointer flex flex-col gap-3"
                            onClick={() => setSelectedMovie(movie)}
                        >
                            <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-lg border border-slate-800 transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-violet-900/20">
                                {movie.poster_url ? (
                                    <img src={movie.poster_url} alt={movie.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-slate-800 flex items-center justify-center">No Poster</div>
                                )}

                                <button
                                    onClick={(e) => handleDelete(e, movie)}
                                    className="absolute top-2 right-2 bg-slate-900/70 text-slate-400 hover:text-red-400 hover:bg-red-500/20 p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all z-10"
                                    title="Delete movie"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>

                                {movie.watch_status === 'watched' && (
                                    <div className="absolute top-2 left-2 bg-emerald-500 text-white p-1.5 rounded-full shadow-md">
                                        <Eye className="w-4 h-4" />
                                    </div>
                                )}

                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                    <span className="text-white font-medium text-sm line-clamp-2">{movie.title}</span>
                                </div>
                            </div>
                            <div className="px-1">
                                <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-violet-400 transition-colors">{movie.title}</h3>
                                <p className="text-xs text-slate-500">{movie.release_year}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

        </div>

            {/* Modal — outside animated div so fixed positioning works relative to viewport */}
            {selectedMovie && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setSelectedMovie(null)} />
                    <div className="relative glass-panel rounded-3xl max-w-2xl w-full p-6 animate-fade-in-up border-slate-700 shadow-2xl flex flex-col md:flex-row gap-6 max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => setSelectedMovie(null)}
                            className="absolute right-4 top-4 text-slate-400 hover:text-white bg-slate-800/50 rounded-full p-1"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <img
                            src={selectedMovie.poster_url}
                            alt={selectedMovie.title}
                            className="w-[120px] md:w-[200px] rounded-xl shadow-lg object-cover self-start"
                        />

                        <div className="flex flex-col flex-1">
                            <h2 className="text-2xl font-bold mb-1">{selectedMovie.title}</h2>
                            <div className="flex items-center gap-3 text-sm text-slate-400 mb-4">
                                <span>{selectedMovie.release_year}</span>
                                {selectedMovie.imdb_rating && (
                                    <span className="flex items-center gap-1 text-yellow-400"><Star className="w-3 h-3 fill-current" /> {selectedMovie.imdb_rating}</span>
                                )}
                            </div>

                            {selectedMovie.watch_providers && (selectedMovie.watch_providers.stream?.length > 0 || selectedMovie.watch_providers.rent?.length > 0 || selectedMovie.watch_providers.buy?.length > 0) && (() => {
                                const wp = selectedMovie.watch_providers;
                                const baseProviderName = (name: string) =>
                                    name.replace(/\s*(Premium Plus|Premium|Standard with Ads|with Ads|Amazon Channel|Apple TV Channel|On Demand)\s*/gi, '').trim();
                                const dedup = (arr: any[]) => {
                                    const seen = new Set<string>();
                                    return arr.filter((p: any) => {
                                        const base = baseProviderName(p.provider_name);
                                        if (seen.has(base)) return false;
                                        seen.add(base);
                                        return true;
                                    });
                                };
                                const stream = dedup(wp.stream || []);
                                const hasStream = stream.length > 0;
                                const rentBuy = dedup([...(wp.rent || []), ...(wp.buy || [])]);
                                const hasRentBuy = rentBuy.length > 0;

                                return (
                                    <div className="mb-4">
                                        {hasStream && (
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-slate-400 shrink-0">Stream</span>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {stream.map((p: any) => (
                                                        <img
                                                            key={p.provider_id}
                                                            src={`https://image.tmdb.org/t/p/original${p.logo_path}`}
                                                            alt={p.provider_name}
                                                            title={p.provider_name}
                                                            className="w-7 h-7 rounded-[7px]"
                                                            style={{ border: '0.5px solid rgba(255,255,255,0.1)' }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {hasStream && hasRentBuy && (
                                            <hr className="border-0 h-px bg-slate-700/50 my-2" />
                                        )}
                                        {hasRentBuy && (
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-slate-400 shrink-0">Rent / Buy</span>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {rentBuy.map((p: any) => (
                                                        <img
                                                            key={p.provider_id}
                                                            src={`https://image.tmdb.org/t/p/original${p.logo_path}`}
                                                            alt={p.provider_name}
                                                            title={p.provider_name}
                                                            className="w-7 h-7 rounded-[7px]"
                                                            style={{ border: '0.5px solid rgba(255,255,255,0.1)' }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            <div className="flex flex-wrap gap-2 mb-4">
                                {selectedMovie.genres?.map((g: string) => (
                                    <span key={g} className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">{g}</span>
                                ))}
                            </div>

                            <p className="text-slate-400 text-sm leading-relaxed mb-6 flex-1">
                                {selectedMovie.synopsis}
                            </p>

                            <button
                                onClick={() => toggleWatchStatus(selectedMovie)}
                                className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors ${selectedMovie.watch_status === 'watched'
                                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                        : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                    }`}
                            >
                                {selectedMovie.watch_status === 'watched' ? (
                                    <><EyeOff className="w-5 h-5" /> Mark as Unwatched</>
                                ) : (
                                    <><Eye className="w-5 h-5" /> Mark as Watched</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
