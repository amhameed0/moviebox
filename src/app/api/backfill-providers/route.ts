import { NextResponse } from 'next/server';
import { getMovies, updateWatchProviders } from '@/lib/db';
import { fetchWatchProviders } from '@/lib/tmdb';

export async function POST() {
    try {
        const apiKey = process.env.TMDB_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'TMDB_API_KEY is missing' }, { status: 500 });
        }

        const movies = await getMovies();
        const needsBackfill = movies.filter(
            (m) => m.tmdb_id && !m.watch_providers
        );

        let updated = 0;
        const failed: string[] = [];

        for (const movie of needsBackfill) {
            try {
                const providers = await fetchWatchProviders(movie.tmdb_id!, apiKey);
                await updateWatchProviders(movie.id!, providers);
                updated++;
            } catch (err) {
                failed.push(movie.title);
            }
        }

        return NextResponse.json({
            updated,
            skipped: movies.length - needsBackfill.length,
            failed,
        });
    } catch (error) {
        console.error('Backfill error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Backfill failed' },
            { status: 500 }
        );
    }
}
