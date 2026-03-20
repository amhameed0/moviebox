import type { WatchProviders, Provider } from './db';

export interface TMDBMovie {
    tmdb_id: number;
    title: string;
    poster_url: string;
    synopsis: string;
    release_year: number;
    genres: string[];
    imdb_rating: number | null;
    watch_providers: WatchProviders | null;
}

function mapProviders(arr: any[] | undefined): Provider[] {
    if (!arr) return [];
    return arr.map((p: any) => ({
        provider_id: p.provider_id,
        provider_name: p.provider_name,
        logo_path: p.logo_path,
    }));
}

export async function fetchWatchProviders(tmdbId: number, apiKey: string): Promise<WatchProviders> {
    const url = `https://api.themoviedb.org/3/movie/${tmdbId}/watch/providers?api_key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return { stream: [], rent: [], buy: [] };

    const data = await res.json();
    const us = data.results?.US;
    if (!us) return { stream: [], rent: [], buy: [] };

    return {
        stream: mapProviders(us.flatrate),
        rent: mapProviders(us.rent),
        buy: mapProviders(us.buy),
    };
}

export async function searchTMDB(movieTitle: string): Promise<TMDBMovie> {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
        throw new Error('TMDB_API_KEY is missing');
    }

    // Search for the movie
    const searchUrl = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(movieTitle)}&api_key=${apiKey}`;
    const response = await fetch(searchUrl);
    if (!response.ok) {
        throw new Error('Failed to fetch from TMDB search API');
    }

    const data = await response.json();
    if (!data.results || data.results.length === 0) {
        throw new Error('No movie found on TMDB');
    }

    const result = data.results[0];
    const tmdb_id = result.id;
    const title = result.title;
    const synopsis = result.overview || '';
    const release_year = result.release_date ? parseInt(result.release_date.split('-')[0], 10) : 0;
    const poster_url = result.poster_path ? `https://image.tmdb.org/t/p/w500${result.poster_path}` : '';
    const imdb_rating = result.vote_average ? Math.round(result.vote_average * 10) / 10 : null; // single decimal

    // Fetch movie details and watch providers in parallel
    const detailsUrl = `https://api.themoviedb.org/3/movie/${tmdb_id}?api_key=${apiKey}`;
    const [detailsRes, watch_providers] = await Promise.all([
        fetch(detailsUrl),
        fetchWatchProviders(tmdb_id, apiKey),
    ]);
    let genres: string[] = [];

    if (detailsRes.ok) {
        const detailsData = await detailsRes.json();
        if (detailsData.genres) {
            genres = detailsData.genres.map((g: any) => g.name);
        }
    }

    return {
        tmdb_id,
        title,
        poster_url,
        synopsis,
        release_year,
        genres,
        imdb_rating,
        watch_providers
    };
}
