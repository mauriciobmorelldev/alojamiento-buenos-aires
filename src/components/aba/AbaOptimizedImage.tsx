import Image from "next/image";
import type { CSSProperties, MouseEventHandler } from "react";
import {
  getOptimizedPublicImageUrl,
  getSupabaseObjectPublicUrl,
  isSupabasePublicImage,
} from "@/lib/publicImage";

const isInlineImage = (src: string) => src.startsWith("data:") || src.startsWith("blob:");
const isLocalPublicImage = (src: string) => src.startsWith("/");

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
  const optimizedSrc = getOptimizedPublicImageUrl(publicSrc, { width, quality });

  if (isSupabasePublicImage(publicSrc) || isInlineImage(publicSrc)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- Supabase render/image can reject valid public storage URLs in Next image optimizer.
      <img
        src={publicSrc}
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
      />
    );
  }

  return (
    <Image
      src={isLocalPublicImage(optimizedSrc) ? optimizedSrc : publicSrc}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      quality={quality}
      sizes={sizes}
      draggable={draggable}
      onClick={onClick}
      style={style}
      className={className}
    />
  );
}
