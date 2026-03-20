import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local from project root
config({ path: resolve(__dirname, '..', '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;
const TMDB_API_KEY = process.env.TMDB_API_KEY;

if (!DATABASE_URL) {
    console.error('DATABASE_URL environment variable is required.');
    process.exit(1);
}
if (!TMDB_API_KEY) {
    console.error('TMDB_API_KEY environment variable is required.');
    process.exit(1);
}

const sql = neon(DATABASE_URL);

type Provider = {
    provider_id: number;
    provider_name: string;
    logo_path: string;
};

type WatchProviders = {
    stream: Provider[];
    rent: Provider[];
    buy: Provider[];
};

function mapProviders(arr: any[] | undefined): Provider[] {
    if (!arr) return [];
    return arr.map((p: any) => ({
        provider_id: p.provider_id,
        provider_name: p.provider_name,
        logo_path: p.logo_path,
    }));
}

async function fetchWatchProviders(tmdbId: number): Promise<WatchProviders> {
    const url = `https://api.themoviedb.org/3/movie/${tmdbId}/watch/providers?api_key=${TMDB_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDB API error: ${res.status}`);

    const data = await res.json();
    const us = data.results?.US;
    if (!us) return { stream: [], rent: [], buy: [] };

    return {
        stream: mapProviders(us.flatrate),
        rent: mapProviders(us.rent),
        buy: mapProviders(us.buy),
    };
}

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log('Querying movies without watch provider data...');

    const movies = await sql`
        SELECT id, title, tmdb_id
        FROM movies
        WHERE watch_providers IS NULL AND tmdb_id IS NOT NULL
    `;

    if (movies.length === 0) {
        console.log('No movies to backfill.');
        return;
    }

    console.log(`Found ${movies.length} movie(s) to backfill.\n`);

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const movie of movies) {
        try {
            const providers = await fetchWatchProviders(movie.tmdb_id);

            await sql`
                UPDATE movies
                SET watch_providers = ${JSON.stringify(providers)}
                WHERE id = ${movie.id}
            `;

            const hasProviders = providers.stream.length > 0 || providers.rent.length > 0 || providers.buy.length > 0;
            if (hasProviders) {
                console.log(`✓ ${movie.title} — updated`);
                updated++;
            } else {
                console.log(`- ${movie.title} — no US providers (marked as fetched)`);
                skipped++;
            }
        } catch (err: any) {
            console.error(`✗ ${movie.title} — failed: ${err.message}`);
            failed++;
        }

        await delay(250);
    }

    console.log(`\nBackfill complete: ${updated} updated, ${skipped} skipped, ${failed} failed`);
}

main().catch(err => {
    console.error('Backfill failed:', err);
    process.exit(1);
});
