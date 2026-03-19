import { NextResponse } from 'next/server';
import { saveMovie } from '@/lib/db';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Handle array of movies (slideshow batch save)
        if (Array.isArray(body)) {
            if (body.length === 0) {
                return NextResponse.json({ error: 'No movies to save' }, { status: 400 });
            }

            const savedMovies = await Promise.all(
                body.map(async (movieData) => {
                    if (!movieData.tiktok_url || !movieData.title) {
                        throw new Error('Missing required fields in one or more movies');
                    }
                    return saveMovie(movieData);
                })
            );

            return NextResponse.json({ movies: savedMovies });
        }

        // Handle single movie (video post — backward compatible)
        if (!body.tiktok_url || !body.title) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const savedMovie = await saveMovie(body);
        return NextResponse.json({ movie: savedMovie });
    } catch (error: any) {
        console.error('Save error:', error);
        return NextResponse.json({ error: error.message || 'Failed to save movie' }, { status: 500 });
    }
}
