import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

let _sql: NeonQueryFunction<false, false> | null = null;

function getSQL() {
    if (!_sql) {
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL environment variable is required.');
        }
        _sql = neon(process.env.DATABASE_URL);
    }
    return _sql;
}

export type Provider = {
    provider_id: number;
    provider_name: string;
    logo_path: string;
};

export type WatchProviders = {
    stream: Provider[];
    rent: Provider[];
    buy: Provider[];
};

export interface MovieRecord {
    id?: number;
    tiktok_url: string;
    title: string;
    tmdb_id: number | null;
    poster_url: string | null;
    synopsis: string | null;
    release_year: number | null;
    genres: string[] | null;
    imdb_rating: number | null;
    watch_status?: string; // 'want_to_watch', 'watched', etc.
    watch_providers?: WatchProviders | null;
    confidence: string;
    raw_metadata?: any;
    created_at?: string | Date;
}

export async function saveMovie(movie: MovieRecord): Promise<MovieRecord> {
    const sql = getSQL();
    const result = await sql`
    INSERT INTO movies (
      tiktok_url, title, tmdb_id, poster_url, synopsis,
      release_year, genres, imdb_rating, watch_status,
      confidence, raw_metadata, watch_providers
    ) VALUES (
      ${movie.tiktok_url}, ${movie.title}, ${movie.tmdb_id}, ${movie.poster_url}, ${movie.synopsis},
      ${movie.release_year}, ${movie.genres as any}, ${movie.imdb_rating}, ${movie.watch_status || 'want_to_watch'},
      ${movie.confidence}, ${movie.raw_metadata ? JSON.stringify(movie.raw_metadata) : null},
      ${movie.watch_providers ? JSON.stringify(movie.watch_providers) : null}
    )
    RETURNING *;
  `;

    return result[0] as MovieRecord;
}

export async function getMovies(): Promise<MovieRecord[]> {
    const sql = getSQL();
    const result = await sql`
    SELECT * FROM movies
    ORDER BY created_at DESC;
  `;
    return result as MovieRecord[];
}

export async function updateWatchStatus(id: number, status: string): Promise<void> {
    const sql = getSQL();
    await sql`
    UPDATE movies
    SET watch_status = ${status}
    WHERE id = ${id};
  `;
}

export async function deleteMovie(id: number): Promise<void> {
    const sql = getSQL();
    await sql`
    DELETE FROM movies
    WHERE id = ${id};
  `;
}
