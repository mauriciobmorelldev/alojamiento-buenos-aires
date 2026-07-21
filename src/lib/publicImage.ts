const STORAGE_PUBLIC_MARKER = "/storage/v1/object/public/";
const STORAGE_RENDER_MARKER = "/storage/v1/render/image/public/";

export const isSupabasePublicImage = (src: string) => {
  if (!src || src.startsWith("data:") || src.startsWith("blob:")) return false;

  try {
    const url = new URL(src);
    return (
      url.hostname.endsWith(".supabase.co") &&
      url.pathname.includes(STORAGE_PUBLIC_MARKER)
    );
  } catch {
    return false;
  }
};

export const getOptimizedPublicImageUrl = (
  src: string,
  options: { width?: number; quality?: number } = {}
) => {
  if (!src || src.startsWith("data:") || src.startsWith("blob:")) return src;

  try {
    const url = new URL(src);
    if (!url.hostname.endsWith(".supabase.co")) return src;

    const markerIndex = url.pathname.indexOf(STORAGE_PUBLIC_MARKER);
    if (markerIndex < 0) return src;

    const publicPath = url.pathname.slice(markerIndex + STORAGE_PUBLIC_MARKER.length);
    url.pathname = `${url.pathname.slice(0, markerIndex)}${STORAGE_RENDER_MARKER}${publicPath}`;
    url.search = "";
    if (options.width) url.searchParams.set("width", String(options.width));
    url.searchParams.set("quality", String(options.quality ?? 76));
    url.searchParams.set("resize", "cover");
    return url.toString();
  } catch {
    return src;
  }
};


export const getSupabaseObjectPublicUrl = (src: string) => {
  if (!src || src.startsWith("data:") || src.startsWith("blob:")) return src;

  try {
    const url = new URL(src);
    if (!url.hostname.endsWith(".supabase.co")) return src;

    const markerIndex = url.pathname.indexOf(STORAGE_RENDER_MARKER);
    if (markerIndex < 0) return src;

    const publicPath = url.pathname.slice(markerIndex + STORAGE_RENDER_MARKER.length);
    url.pathname = `${url.pathname.slice(0, markerIndex)}${STORAGE_PUBLIC_MARKER}${publicPath}`;
    url.search = "";
    return url.toString();
  } catch {
    return src;
  }
};

export const getOptimizedPublicImageSrcSet = (
  src: string,
  widths: number[],
  options: { quality?: number } = {}
) =>
  widths
    .map(
      (width) =>
        `${getOptimizedPublicImageUrl(src, {
          width,
          quality: options.quality,
        })} ${width}w`
    )
    .join(", ");
