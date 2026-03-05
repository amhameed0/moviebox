import { NextResponse } from 'next/server';
import { saveMovie } from '@/lib/db';

export async function POST(req: Request) {
    try {
        const movieData = await req.json();
        if (!movieData.tiktok_url || !movieData.title) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const savedMovie = await saveMovie(movieData);
        return NextResponse.json({ movie: savedMovie });
    } catch (error: any) {
        console.error('Save error:', error);
        // Handle unique constraint violation on tiktok_url gracefully if needed.
        return NextResponse.json({ error: error.message || 'Failed to save movie' }, { status: 500 });
    }
}
