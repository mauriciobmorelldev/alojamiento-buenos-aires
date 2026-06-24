export type VideoProvider =
  | "file"
  | "youtube"
  | "vimeo"
  | "instagram"
  | "tiktok"
  | "facebook"
  | "embed"
  | "unknown";

export type ParsedVideo = {
  provider: VideoProvider;
  originalUrl: string;
  embedUrl?: string;
  fileUrl?: string;
  posterUrl?: string;
};

const directVideoPattern = /\.(mp4|webm|ogg|mov)(\?.*)?$/i;
const windowsLocalPathPattern = /^[a-z]:[\\/]/i;

export const isLocalVideoReference = (value: string) => {
  const trimmed = value.trim();
  return (
    trimmed.startsWith("file://") ||
    windowsLocalPathPattern.test(trimmed) ||
    trimmed.startsWith("\\\\")
  );
};

const getYoutubeId = (url: URL) => {
  if (url.hostname.includes("youtu.be")) {
    return url.pathname.split("/").filter(Boolean)[0] ?? "";
  }

  if (url.pathname.startsWith("/embed/")) {
    return url.pathname.split("/").filter(Boolean)[1] ?? "";
  }

  if (url.pathname.startsWith("/shorts/")) {
    return url.pathname.split("/").filter(Boolean)[1] ?? "";
  }

  return url.searchParams.get("v") ?? "";
};

const getVimeoId = (url: URL) => {
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments[0] === "video") return segments[1] ?? "";
  return segments.find((segment) => /^\d+$/.test(segment)) ?? "";
};

export const parseVideoUrl = (value: string): ParsedVideo | null => {
  const originalUrl = value.trim();
  if (!originalUrl) return null;
  if (isLocalVideoReference(originalUrl)) return null;

  let url: URL;
  try {
    url = new URL(originalUrl);
  } catch {
    return null;
  }

  if (!["http:", "https:"].includes(url.protocol)) return null;

  if (directVideoPattern.test(url.pathname)) {
    return { provider: "file", originalUrl, fileUrl: originalUrl };
  }

  if (url.hostname.includes("youtube.com") || url.hostname.includes("youtu.be")) {
    const id = getYoutubeId(url);
    if (!id) return null;
    return {
      provider: "youtube",
      originalUrl,
      embedUrl: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`,
      posterUrl: `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`,
    };
  }

  if (url.hostname.includes("vimeo.com")) {
    const id = getVimeoId(url);
    if (!id) return null;
    return {
      provider: "vimeo",
      originalUrl,
      embedUrl: `https://player.vimeo.com/video/${encodeURIComponent(id)}`,
    };
  }

  if (url.hostname.includes("instagram.com")) {
    const segments = url.pathname.split("/").filter(Boolean);
    const contentType = segments[0];
    const id = segments[1];
    if (!id || !["p", "reel", "tv"].includes(contentType)) {
      return { provider: "unknown", originalUrl };
    }
    return {
      provider: "instagram",
      originalUrl,
      embedUrl: `https://www.instagram.com/${contentType}/${encodeURIComponent(id)}/embed/`,
    };
  }

  if (url.hostname.includes("tiktok.com")) {
    const match = url.pathname.match(/\/video\/(\d+)/);
    if (!match?.[1]) return { provider: "unknown", originalUrl };
    return {
      provider: "tiktok",
      originalUrl,
      embedUrl: `https://www.tiktok.com/player/v1/${encodeURIComponent(match[1])}`,
    };
  }

  if (url.hostname.includes("facebook.com") || url.hostname.includes("fb.watch")) {
    return {
      provider: "facebook",
      originalUrl,
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(originalUrl)}&show_text=false`,
    };
  }

  if (url.pathname.includes("/embed/")) {
    return { provider: "embed", originalUrl, embedUrl: originalUrl };
  }

  return { provider: "unknown", originalUrl };
};

export const isSupportedVideoUrl = (value: string) => {
  const parsed = parseVideoUrl(value);
  return Boolean(parsed && parsed.provider !== "unknown");
};

export const sanitizeVideoUrls = (videos: unknown) =>
  Array.isArray(videos)
    ? videos
        .filter((video): video is string => typeof video === "string")
        .map((video) => video.trim())
        .filter(isSupportedVideoUrl)
    : [];
