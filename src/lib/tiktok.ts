/**
 * Fetch TikTok video metadata using the official oEmbed API
 * and page scraping for the video download URL.
 * Works reliably in serverless environments (Vercel).
 */

export async function fetchTikTokMetadata(url: string): Promise<{
    title: string;
    description: string;
    videoUrl: string;
}> {
    // Step 1: Resolve shortened URLs to canonical form
    // oEmbed API requires full URLs like tiktok.com/@user/video/123
    // but users often paste shortened URLs like tiktok.com/t/... or vm.tiktok.com/...
    const canonicalUrl = await resolveUrl(url);

    // Step 2: Use TikTok's official oEmbed API for metadata
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(canonicalUrl)}`;
    const oembedRes = await fetch(oembedUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; MovieBox/1.0)',
        },
    });

    if (!oembedRes.ok) {
        throw new Error(`TikTok oEmbed failed with status ${oembedRes.status} for URL: ${canonicalUrl}`);
    }

    const oembed = await oembedRes.json();
    const title = oembed.title || 'Unknown Title';
    const description = `${oembed.title || ''} by ${oembed.author_name || ''}`.trim();

    // Step 3: Try to get a video URL by fetching the page HTML
    // and extracting from meta tags or embedded JSON
    let videoUrl = '';
    try {
        videoUrl = await extractVideoUrl(canonicalUrl);
    } catch (e) {
        // Video URL extraction is best-effort for Level 2 transcription fallback
        console.warn('Could not extract video URL (Level 2 transcription will be unavailable):', e);
    }

    return { title, description, videoUrl };
}

/**
 * Resolve shortened TikTok URLs (vm.tiktok.com/..., tiktok.com/t/...)
 * to their canonical form (tiktok.com/@user/video/...) by following redirects.
 */
async function resolveUrl(url: string): Promise<string> {
    // If already a canonical video URL, return as-is
    if (url.includes('/@') && url.includes('/video/')) {
        return url;
    }

    try {
        const res = await fetch(url, {
            method: 'HEAD',
            redirect: 'follow',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
        });

        // The final URL after redirects is the canonical URL
        const resolved = res.url;
        if (resolved && resolved !== url) {
            // Strip query params for a cleaner oEmbed request
            const clean = resolved.split('?')[0];
            console.log(`Resolved TikTok URL: ${url} -> ${clean}`);
            return clean;
        }
    } catch (e) {
        console.warn('URL resolution failed, using original:', e);
    }

    return url;
}

async function extractVideoUrl(tiktokUrl: string): Promise<string> {
    const res = await fetch(tiktokUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'follow',
    });

    if (!res.ok) return '';

    const html = await res.text();

    // Try to extract video URL from OpenGraph meta tag
    const ogVideoMatch = html.match(/<meta\s+property="og:video(?::url)?"\s+content="([^"]+)"/);
    if (ogVideoMatch?.[1]) {
        return decodeURIComponent(ogVideoMatch[1]);
    }

    // Try to extract from JSON-LD / SIGI_STATE / UNIVERSAL_DATA
    const jsonPatterns = [
        /"playAddr"\s*:\s*"([^"]+)"/,
        /"downloadAddr"\s*:\s*"([^"]+)"/,
        /"play_addr"\s*:\s*\{[^}]*"url_list"\s*:\s*\["([^"]+)"/,
    ];

    for (const pattern of jsonPatterns) {
        const match = html.match(pattern);
        if (match?.[1]) {
            return decodeURIComponent(match[1].replace(/\\u002F/g, '/'));
        }
    }

    return '';
}
