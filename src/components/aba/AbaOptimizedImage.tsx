"use client";

import type { CSSProperties, MouseEventHandler } from "react";
import {
  getOptimizedPublicImageUrl,
  getOptimizedPublicImageSrcSet,
  getSupabaseObjectPublicUrl,
  isSupabasePublicImage,
} from "@/lib/publicImage";

const isInlineImage = (src: string) => src.startsWith("data:") || src.startsWith("blob:");

type AbaOptimizedImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  draggable?: boolean;
  onClick?: MouseEventHandler<HTMLImageElement>;
  style?: CSSProperties;
};

export default function AbaOptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  sizes,
  quality = 76,
  draggable,
  onClick,
  style,
}: AbaOptimizedImageProps) {
  const publicSrc = getSupabaseObjectPublicUrl(src);
  const isSupabaseImage = isSupabasePublicImage(publicSrc);
  const optimizedSrc = isSupabaseImage
    ? getOptimizedPublicImageUrl(publicSrc, { width, quality })
    : publicSrc;
  const responsiveWidths = Array.from(
    new Set([Math.min(width, 480), Math.min(width, 960), width])
  ).sort((a, b) => a - b);

  return (
    // eslint-disable-next-line @next/next/no-img-element -- Avoid routing public media through the constrained Next.js image optimizer.
    <img
      src={optimizedSrc}
      srcSet={
        isSupabaseImage && !isInlineImage(publicSrc)
          ? getOptimizedPublicImageSrcSet(publicSrc, responsiveWidths, { quality })
          : undefined
      }
      sizes={sizes}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      draggable={draggable}
      onClick={onClick}
      style={style}
      className={className}
      onError={(event) => {
        if (isSupabaseImage && event.currentTarget.src !== publicSrc) {
          event.currentTarget.srcset = "";
          event.currentTarget.src = publicSrc;
        }
      }}
    />
  );
}
