import type { InmoState, Listing } from "@/lib/inmoData";
import { getSupabaseWriteClient, isSupabaseWriteConfigured } from "@/lib/supabase/server";

const MEDIA_BUCKET = "property-media";

const maybeAddUrl = (urls: Set<string>, value?: string) => {
  const normalized = value?.trim();
  if (normalized) urls.add(normalized);
};

export const extractStoragePath = (value: string) => {
  try {
    const url = new URL(value);
    const marker = `/storage/v1/object/public/${MEDIA_BUCKET}/`;
    const markerIndex = url.pathname.indexOf(marker);
    if (markerIndex < 0) return "";
    return decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
  } catch {
    return "";
  }
};

export const collectListingMediaUrls = (listing?: Listing | null) => {
  const urls = new Set<string>();
  if (!listing) return urls;
  listing.images.forEach((image) => maybeAddUrl(urls, image));
  listing.videos?.forEach((video) => maybeAddUrl(urls, video));
  return urls;
};

export const collectStateMediaUrls = (state?: InmoState | null) => {
  const urls = new Set<string>();
  if (!state) return urls;

  maybeAddUrl(urls, state.theme.logo);
  maybeAddUrl(urls, state.theme.heroImage);

  state.homeContent.banners.forEach((banner) => maybeAddUrl(urls, banner.image));
  state.homeContent.partnerLogos.forEach((logo) => maybeAddUrl(urls, logo.image));
  maybeAddUrl(urls, state.homeContent.buenosAires.heroImage);
  maybeAddUrl(urls, state.homeContent.buenosAires.heroVideo);
  state.homeContent.buenosAires.sections.forEach((section) =>
    maybeAddUrl(urls, section.image)
  );

  state.customPages.forEach((page) =>
    page.blocks.forEach((block) => maybeAddUrl(urls, block.image))
  );
  state.listings.forEach((listing) =>
    collectListingMediaUrls(listing).forEach((url) => urls.add(url))
  );

  return urls;
};

export const deleteStorageMediaUrls = async (urls: Iterable<string>) => {
  const supabase = getSupabaseWriteClient();
  if (!supabase || !isSupabaseWriteConfigured()) return { deletedCount: 0 };

  const paths = Array.from(
    new Set(
      Array.from(urls)
        .map(extractStoragePath)
        .filter(Boolean)
    )
  );

  if (!paths.length) return { deletedCount: 0 };

  const result = await supabase.storage.from(MEDIA_BUCKET).remove(paths);
  if (result.error) {
    throw new Error(`delete storage media: ${result.error.message}`);
  }

  return { deletedCount: paths.length };
};

export const deleteRemovedStateMedia = async (
  previousState: InmoState,
  nextState: InmoState
) => {
  const previousUrls = collectStateMediaUrls(previousState);
  const nextUrls = collectStateMediaUrls(nextState);
  const removedUrls = Array.from(previousUrls).filter((url) => !nextUrls.has(url));
  return deleteStorageMediaUrls(removedUrls);
};

export const deleteRemovedListingMedia = async (
  previousListing?: Listing | null,
  nextListing?: Listing | null
) => {
  const previousUrls = collectListingMediaUrls(previousListing);
  const nextUrls = collectListingMediaUrls(nextListing);
  const removedUrls = Array.from(previousUrls).filter((url) => !nextUrls.has(url));
  return deleteStorageMediaUrls(removedUrls);
};
