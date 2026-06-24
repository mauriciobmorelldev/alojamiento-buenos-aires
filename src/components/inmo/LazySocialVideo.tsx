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

  if (!parsed || parsed.provider === "unknown") {
    return (
      <div className="flex aspect-video items-center justify-center rounded-3xl bg-surface-container-low px-6 text-center text-sm font-semibold text-on-surface-variant">
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
        className="aspect-video w-full rounded-3xl bg-black object-contain"
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
        className="aspect-video w-full rounded-3xl bg-black"
      />
    );
  }

  const preview = poster?.trim() || parsed.posterUrl;

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="group relative aspect-video w-full cursor-pointer overflow-hidden rounded-3xl bg-primary text-on-primary"
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
      <span className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <span className="material-symbols-outlined flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl text-primary shadow-lg transition group-hover:scale-105">
          play_arrow
        </span>
        <span className="rounded-full bg-black/45 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-sm">
          Reproducir en {providerLabel[parsed.provider] ?? "video"}
        </span>
      </span>
    </button>
  );
}
