import { parseVideoUrl } from "@/lib/video";

type LazySocialVideoProps = {
  url: string;
  title: string;
};

export default function LazySocialVideo({
  url,
  title,
}: LazySocialVideoProps) {
  const parsed = parseVideoUrl(url);
  const isVertical =
    parsed?.provider === "instagram" || parsed?.provider === "tiktok";
  const frameClass = isVertical
    ? "mx-auto aspect-[9/16] w-full max-w-[22rem] sm:max-w-[24rem]"
    : "mx-auto aspect-video w-full max-w-4xl";
  const mediaClass = `${frameClass} rounded-2xl bg-black object-contain sm:rounded-3xl`;

  if (!parsed || parsed.provider === "unknown") {
    return (
      <div className="mx-auto flex aspect-video w-full max-w-4xl items-center justify-center rounded-2xl bg-surface-container-low px-6 text-center text-sm font-semibold text-on-surface-variant sm:rounded-3xl">
        El enlace de video no es compatible.
      </div>
    );
  }

  if (parsed.provider === "file" && parsed.fileUrl) {
    return (
      <video
        src={parsed.fileUrl}
        controls
        playsInline
        preload="metadata"
        className={mediaClass}
      />
    );
  }

  if (parsed.embedUrl) {
    return (
      <iframe
        src={parsed.embedUrl}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        className={mediaClass}
      />
    );
  }

  return (
    <a
      href={parsed.originalUrl}
      target="_blank"
      rel="noreferrer"
      className="mx-auto inline-flex rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary"
    >
      Abrir video
    </a>
  );
}
