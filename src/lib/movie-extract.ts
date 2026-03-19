import { generateObject, generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const extractionSchema = z.object({
    movieTitle: z.string().nullable().describe('The identified movie title. Null if none found.'),
    confidence: z.enum(['complete', 'partial', 'no_movie']).describe('Confidence level in the extraction.'),
});

type ExtractedMovie = z.infer<typeof extractionSchema>;

export async function extractMovieFromText(
    title: string,
    description: string
): Promise<ExtractedMovie> {
    const prompt = `
You are an expert movie identifier. A user is sharing a TikTok video that recommends a movie.
Identify the movie title from the following metadata. Do not hallucinate.
If you are confident you know the exact movie, return confidence: "complete" and the title.
If you have a partial guess, return confidence: "partial".
If no movie can be identified, return confidence: "no_movie" and null for the title.

Title Metadata: ${title}
Description Metadata: ${description}
`;

    try {
        const { object } = await generateObject({
            model: openai('gpt-4o-mini'),
            schema: extractionSchema,
            prompt,
        });

        return object;
    } catch (error) {
        console.error('Extraction error:', error);
        return { movieTitle: null, confidence: 'no_movie' };
    }
}

export async function extractMovieFromTranscript(
    transcript: string
): Promise<ExtractedMovie> {
    const prompt = `
You are an expert movie identifier. We have the audio transcript of a video recommending a movie.
Identify the movie title from the transcript. Do not hallucinate.
If you are confident you know the exact movie, return confidence: "complete" and the title.
If you have a partial guess, return confidence: "partial".
If no movie can be identified, return confidence: "no_movie" and null for the title.

Transcript:
${transcript}
`;

    try {
        const { object } = await generateObject({
            model: openai('gpt-4o-mini'),
            schema: extractionSchema,
            prompt,
        });

        return object;
    } catch (error) {
        console.error('Transcript Extraction error:', error);
        return { movieTitle: null, confidence: 'no_movie' };
    }
}

export async function extractMoviesFromSlideshow(
    imageBuffers: Buffer[],
    postDescription: string
): Promise<{
    movies: Array<{
        title: string;
        confidence: "complete" | "partial";
        context?: string;
    }>;
}> {
    const content: Array<
        | { type: "text"; text: string }
        | { type: "image"; image: Uint8Array }
    > = [
        {
            type: "text",
            text: `You are a movie identification assistant. The following images are slides from a TikTok slideshow post about movies or TV shows.

Post description/caption: "${postDescription}"

Analyze ALL slides carefully. Extract EVERY movie or TV show title visible in the images. Look for:
- Movie/show titles in text overlays
- Movie posters (identify the movie from the poster)
- Movie stills or screenshots (identify from recognizable scenes, actors, or visual cues)
- Lists of recommendations
- Any text mentioning specific titles

Respond with JSON only, no markdown:
{
  "movies": [
    {
      "title": "Exact Movie or Show Title",
      "confidence": "complete" or "partial",
      "context": "optional extra info visible (e.g. 'on Netflix', '2024', 'horror')"
    }
  ]
}

Rules:
- Return every distinct movie/show found across all slides
- Use the official title (e.g. "The Shawshank Redemption" not "Shawshank")
- "complete" = clearly readable title or unmistakable poster
- "partial" = you can make out most of it but aren't 100% sure
- Do NOT hallucinate titles. If a slide has no identifiable movie, skip it.
- If no movies found in any slide, return { "movies": [] }`,
        },
    ];

    for (const buf of imageBuffers) {
        content.push({
            type: "image",
            image: new Uint8Array(buf),
        });
    }

    const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        messages: [{ role: "user", content }],
    });

    const parsed = JSON.parse(text);
    return {
        movies: Array.isArray(parsed.movies) ? parsed.movies : [],
    };
}
