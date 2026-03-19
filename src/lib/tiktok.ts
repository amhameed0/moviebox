import { Downloader } from "@tobyg74/tiktok-api-dl";

export type TikTokContentType = "video" | "slideshow";

export interface TikTokMetadata {
  title: string;
  description: string;
  contentType: TikTokContentType;
  videoUrl: string | null;
  imageUrls: string[];
}

export async function fetchTikTokMetadata(
  url: string
): Promise<TikTokMetadata> {
  const result = await Downloader(url, { version: "v1" });

  if (result.status !== "success" || !result.result) {
    throw new Error(
      `Failed to fetch TikTok metadata: ${result.message ?? "Unknown error"}`
    );
  }

  const data = result.result as any;
  const isSlideshow = data.type === "image";

  return {
    title: data.description ?? "",
    description: data.description ?? "",
    contentType: isSlideshow ? "slideshow" : "video",
    videoUrl: isSlideshow ? null : data.video?.[0] ?? null,
    imageUrls: isSlideshow && data.images ? data.images : [],
  };
}
