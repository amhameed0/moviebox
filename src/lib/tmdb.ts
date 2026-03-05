export interface TMDBMovie {
    tmdb_id: number;
    title: string;
    poster_url: string;
    synopsis: string;
    release_year: number;
    genres: string[];
    imdb_rating: number | null;
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

    // Fetch movie details to get genres
    const detailsUrl = `https://api.themoviedb.org/3/movie/${tmdb_id}?api_key=${apiKey}`;
    const detailsRes = await fetch(detailsUrl);
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
        imdb_rating
    };
}
