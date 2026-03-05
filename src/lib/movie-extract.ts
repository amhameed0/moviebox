import { generateObject } from 'ai';
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
