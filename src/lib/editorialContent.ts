import type { EditorialContentBlock, EditorialPost } from "./inmoData";

const EDITORIAL_BODY_PREFIX = "__ABA_EDITORIAL_V2__";

type EditorialBodyPayload = {
  body?: unknown;
  authorName?: unknown;
  authorPhoto?: unknown;
  authorSignature?: unknown;
  contentBlocks?: unknown;
};

const stringValue = (value: unknown) => (typeof value === "string" ? value : "");

const normalizeLayout = (value: unknown): EditorialContentBlock["layout"] =>
  value === "left" || value === "right" ? value : "wide";

export const normalizeEditorialBlocks = (value: unknown): EditorialContentBlock[] => {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const block = item as Record<string, unknown>;
    const type = block.type === "image" ? "image" : block.type === "text" ? "text" : null;
    if (!type) return [];
    return [{
      id: stringValue(block.id) || `editorial-block-${index + 1}`,
      type,
      text: stringValue(block.text),
      image: stringValue(block.image),
      alt: stringValue(block.alt),
      caption: stringValue(block.caption),
      layout: normalizeLayout(block.layout),
    }];
  });
};

export const decodeEditorialBody = (value: string) => {
  if (!value.startsWith(EDITORIAL_BODY_PREFIX)) {
    return {
      body: value,
      authorName: "",
      authorPhoto: "",
      authorSignature: "",
      contentBlocks: [] as EditorialContentBlock[],
    };
  }

  try {
    const payload = JSON.parse(value.slice(EDITORIAL_BODY_PREFIX.length)) as EditorialBodyPayload;
    return {
      body: stringValue(payload.body),
      authorName: stringValue(payload.authorName),
      authorPhoto: stringValue(payload.authorPhoto),
      authorSignature: stringValue(payload.authorSignature),
      contentBlocks: normalizeEditorialBlocks(payload.contentBlocks),
    };
  } catch {
    return {
      body: value,
      authorName: "",
      authorPhoto: "",
      authorSignature: "",
      contentBlocks: [] as EditorialContentBlock[],
    };
  }
};

export const encodeEditorialBody = (post: EditorialPost) => {
  const contentBlocks = normalizeEditorialBlocks(post.contentBlocks);
  const hasStructuredContent = Boolean(
    post.authorName?.trim() ||
      post.authorPhoto?.trim() ||
      post.authorSignature?.trim() ||
      contentBlocks.length
  );
  if (!hasStructuredContent) return post.body;

  return EDITORIAL_BODY_PREFIX + JSON.stringify({
    body: post.body,
    authorName: post.authorName ?? "",
    authorPhoto: post.authorPhoto ?? "",
    authorSignature: post.authorSignature ?? "",
    contentBlocks,
  });
};
