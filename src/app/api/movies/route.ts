import { NextResponse } from 'next/server';
import { getMovies } from '@/lib/db';

export async function GET() {
    try {
        const movies = await getMovies();
        return NextResponse.json({ movies });
    } catch (error: any) {
        console.error('Fetch error:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch movies' }, { status: 500 });
    }
}
