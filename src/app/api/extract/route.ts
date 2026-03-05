import { NextResponse } from 'next/server';
import { fetchTikTokMetadata } from '@/lib/tiktok';
import { extractMovieFromText, extractMovieFromTranscript } from '@/lib/movie-extract';
import { transcribeVideo } from '@/lib/transcribe';
import { searchTMDB } from '@/lib/tmdb';
import { cleanText } from '@/lib/clean-text';

export async function POST(req: Request) {
    try {
        const { url } = await req.json();
        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // Level 1: Pull TikTok metadata
        const { title, description, videoUrl } = await fetchTikTokMetadata(url);
        const cleanedTitle = cleanText(title);
        const cleanedDescription = cleanText(description);

        let extracted = await extractMovieFromText(cleanedTitle, cleanedDescription);
        let usedTranscript = false;
        let rawMetadata: any = { source: 'metadata', title, description };

        // Level 2 fallback: Transcribe video if metadata extraction failed
        if (extracted.confidence === 'no_movie' && videoUrl) {
            console.log('Falling back to transcription...');
            const transcript = await transcribeVideo(videoUrl);
            const cleanedTranscript = cleanText(transcript);

            extracted = await extractMovieFromTranscript(cleanedTranscript);
            usedTranscript = true;
            rawMetadata = { source: 'transcript', transcript };
        }

        if (!extracted.movieTitle || extracted.confidence === 'no_movie') {
            return NextResponse.json({
                error: 'Could not identify a movie from this video',
                confidence: 'no_movie',
                original_url: url
            }, { status: 404 });
        }

        // Enrich with TMDB
        const tmdbData = await searchTMDB(extracted.movieTitle);

        return NextResponse.json({
            tiktok_url: url,
            title: extracted.movieTitle, // Use GPT-inferred title in case TMDB search found a slight variant
            confidence: extracted.confidence,
            tmdb_id: tmdbData.tmdb_id,
            poster_url: tmdbData.poster_url,
            synopsis: tmdbData.synopsis,
            release_year: tmdbData.release_year,
            genres: tmdbData.genres,
            imdb_rating: tmdbData.imdb_rating,
            raw_metadata: rawMetadata
        });

    } catch (error: any) {
        console.error('Extraction error:', error);
        return NextResponse.json({ error: error.message || 'Extraction failed' }, { status: 500 });
    }
}
