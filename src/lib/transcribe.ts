import { AssemblyAI } from 'assemblyai';

export async function transcribeVideo(videoUrl: string): Promise<string> {
    if (!process.env.ASSEMBLYAI_API_KEY) {
        throw new Error('ASSEMBLYAI_API_KEY is required');
    }

    const client = new AssemblyAI({
        apiKey: process.env.ASSEMBLYAI_API_KEY,
    });

    try {
        const transcript = await client.transcripts.transcribe({
            audio: videoUrl,
        });

        if (transcript.status === 'error') {
            throw new Error(transcript.error);
        }

        return transcript.text || '';
    } catch (error: any) {
        throw new Error(`Transcription failed: ${error.message}`);
    }
}
