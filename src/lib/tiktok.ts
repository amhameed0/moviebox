import Tiktok from '@tobyg74/tiktok-api-dl';

export async function fetchTikTokMetadata(url: string): Promise<{
    title: string;
    description: string;
    videoUrl: string;
}> {
    try {
        const result = await Tiktok.Downloader(url, { version: 'v1' });
        if (result.status !== 'success' || !result.result) {
            throw new Error('Failed to fetch TikTok metadata');
        }

        const data = result.result;
        const title = data.desc || 'Unknown Title';
        const description = data.desc || '';

        // Attempt to extract the primary video without watermark if possible
        const videoUrl = data.videoHD || data.videoWatermark || data.video?.playAddr?.[0] || '';
        if (!videoUrl) {
            throw new Error('No video URL found in TikTok metadata');
        }

        return {
            title,
            description,
            videoUrl
        };
    } catch (error: any) {
        throw new Error(`TikTok fetch error: ${error.message}`);
    }
}
