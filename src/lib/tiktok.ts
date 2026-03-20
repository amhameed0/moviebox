import { Downloader } from "@tobyg74/tiktok-api-dl";

export type TikTokContentType = "video" | "slideshow";

export interface TikTokMetadata {
  title: string;
  description: string;
  contentType: TikTokContentType;
  videoUrl: string | null;
  imageUrls: string[];
}

const VERSIONS = ["v1", "v2", "v3"] as const;

export async function fetchTikTokMetadata(
  url: string
): Promise<TikTokMetadata> {
  let lastError: string | undefined;

  for (const version of VERSIONS) {
    try {
      const result = await Downloader(url, { version });

      if (result.status !== "success" || !result.result) {
        lastError = result.message ?? `${version} returned no data`;
        console.warn(`TikTok ${version} failed: ${lastError}`);
        continue;
      }

      console.log(`TikTok metadata fetched via ${version}`);

      const data = result.result as any;
      const isSlideshow = data.type === "image";

      // Extract video URL — response shape varies by version:
      //   v1: { video: { playAddr: [...], downloadAddr: [...] } }
      //   v2: { video: { playAddr: [url] } }
      //   v3: { videoHD, videoSD, videoWatermark } (flat on result)
      let videoUrl: string | null = null;
      if (!isSlideshow) {
        videoUrl =
          data.video?.playAddr?.[0] ??
          data.video?.downloadAddr?.[0] ??
          data.videoHD ??
          data.videoSD ??
          data.videoWatermark ??
          null;
      }

      return {
        title: data.desc ?? data.description ?? "",
        description: data.desc ?? data.description ?? "",
        contentType: isSlideshow ? "slideshow" : "video",
        videoUrl,
        imageUrls: isSlideshow && data.images ? data.images : [],
      };
    } catch (err) {
      lastError =
        err instanceof Error ? err.message : `${version} failed`;
      console.warn(`TikTok ${version} threw: ${lastError}`);
    }
  }

  throw new Error(
    `Failed to fetch TikTok metadata: ${lastError ?? "All download versions failed"}`
  );
}
