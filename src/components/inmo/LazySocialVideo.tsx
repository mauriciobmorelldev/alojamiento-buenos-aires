"use client";

import { useState } from "react";
import { parseVideoUrl } from "@/lib/video";

type LazySocialVideoProps = {
  url: string;
  title: string;
  poster?: string;
};

const providerLabel: Record<string, string> = {
  youtube: "YouTube",
  vimeo: "Vimeo",
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  file: "Video",
  embed: "Video",
};

export default function LazySocialVideo({
  url,
  title,
  poster,
}: LazySocialVideoProps) {
  const [playing, setPlaying] = useState(false);
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

  if (playing && parsed.provider === "file" && parsed.fileUrl) {
    return (
      <video
        src={parsed.fileUrl}
        controls
        autoPlay
        playsInline
        preload="metadata"
        className={mediaClass}
      />
    );
  }

  if (playing && parsed.embedUrl) {
    return (
      <iframe
        src={`${parsed.embedUrl}${parsed.embedUrl.includes("?") ? "&" : "?"}autoplay=1`}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        className={mediaClass}
      />
    );
  }

  const preview = poster?.trim() || parsed.posterUrl;

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className={`${frameClass} group relative cursor-pointer overflow-hidden rounded-2xl bg-primary text-on-primary sm:rounded-3xl`}
      aria-label={`Reproducir ${title}`}
    >
      {preview ? (
        <img
          src={preview}
          alt=""
          width={1280}
          height={720}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
        />
      ) : null}
      <span className="absolute inset-0 bg-black/35" />
      <span className="absolute inset-0 flex flex-col items-center justify-center gap-2.5">
        <span className="material-symbols-outlined flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl text-primary shadow-lg transition group-hover:scale-105 sm:h-16 sm:w-16 sm:text-3xl">
          play_arrow
        </span>
        <span className="max-w-[80%] rounded-full bg-black/45 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-sm sm:px-4 sm:py-2 sm:text-xs">
          Reproducir en {providerLabel[parsed.provider] ?? "video"}
        </span>
      </span>
    </button>
  );
}
