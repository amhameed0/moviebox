import { NextRequest, NextResponse } from "next/server";
import { fetchTikTokMetadata } from "@/lib/tiktok";
import {
  extractMovieFromText,
  extractMovieFromTranscript,
  extractMoviesFromSlideshow,
} from "@/lib/movie-extract";
import { searchTMDB } from "@/lib/tmdb";
import { transcribeVideo } from "@/lib/transcribe";
import { cleanText } from "@/lib/clean-text";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "A valid TikTok URL is required" },
        { status: 400 }
      );
    }

    const metadata = await fetchTikTokMetadata(url);

    // ─── Slideshow path ────────────────────────────────────────────
    if (metadata.contentType === "slideshow" && metadata.imageUrls.length > 0) {
      // Download images server-side to avoid TikTok CDN blocking OpenAI's servers
      const imageBuffers = await Promise.all(
        metadata.imageUrls.map(async (imageUrl) => {
          const res = await fetch(imageUrl);
          if (!res.ok) {
            throw new Error(`Failed to download slide image: ${res.status}`);
          }
          return Buffer.from(await res.arrayBuffer());
        })
      );

      const slideshowResult = await extractMoviesFromSlideshow(
        imageBuffers,
        metadata.description
      );

      if (slideshowResult.movies.length === 0) {
        return NextResponse.json({
          contentType: "slideshow",
          movies: [],
          confidence: "no_movie",
          tiktok_url: url,
          raw_metadata: metadata,
        });
      }

      const enrichedMovies = await Promise.all(
        slideshowResult.movies.map(async (movie) => {
          try {
            const tmdbData = await searchTMDB(movie.title);
            return {
              ...tmdbData,
              confidence: movie.confidence,
              context: movie.context ?? null,
              source: "slideshow_vision" as const,
            };
          } catch {
            return {
              title: movie.title,
              tmdb_id: null,
              poster_url: null,
              synopsis: null,
              release_year: null,
              genres: [],
              imdb_rating: null,
              confidence: movie.confidence,
              context: movie.context ?? null,
              source: "slideshow_vision" as const,
            };
          }
        })
      );

      return NextResponse.json({
        contentType: "slideshow",
        movies: enrichedMovies,
        tiktok_url: url,
        raw_metadata: metadata,
      });
    }

    // ─── Video path (existing pipeline) ────────────────────────────

    const level1 = await extractMovieFromText(
      cleanText(metadata.title),
      cleanText(metadata.description)
    );

    let movieTitle = level1.movieTitle;
    let confidence = level1.confidence;
    let source: "metadata" | "transcript" = "metadata";

    if (confidence === "no_movie" && metadata.videoUrl) {
      const transcript = await transcribeVideo(metadata.videoUrl);
      const level2 = await extractMovieFromTranscript(cleanText(transcript));
      movieTitle = level2.movieTitle;
      confidence = level2.confidence;
      source = "transcript";
    }

    if (!movieTitle || confidence === "no_movie") {
      return NextResponse.json({
        contentType: "video",
        movies: [],
        confidence: "no_movie",
        tiktok_url: url,
        raw_metadata: metadata,
      });
    }

    try {
      const tmdbData = await searchTMDB(movieTitle);
      return NextResponse.json({
        contentType: "video",
        movies: [{ ...tmdbData, confidence, context: null, source }],
        tiktok_url: url,
        raw_metadata: metadata,
      });
    } catch {
      return NextResponse.json({
        contentType: "video",
        movies: [
          {
            title: movieTitle,
            tmdb_id: null,
            poster_url: null,
            synopsis: null,
            release_year: null,
            genres: [],
            imdb_rating: null,
            confidence,
            context: null,
            source,
          },
        ],
        tiktok_url: url,
        raw_metadata: metadata,
      });
    }
  } catch (error) {
    console.error("Extraction error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Extraction failed" },
      { status: 500 }
    );
  }
}
