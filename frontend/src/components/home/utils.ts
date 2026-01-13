import type { Link, Tag } from './types';

export const decode = (value?: string) => {
  if (!value) return value;
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .trim();
};

export const getLinkTitle = (link: Link) => {
  const decoded = decode(link.title);
  if (decoded) return decoded;
  try {
    return new URL(link.url).hostname;
  } catch {
    return link.url;
  }
};

export const getLinkDescription = (link: Link) => {
  const decoded = decode(link.description);
  if (decoded) return decoded;
  try {
    return new URL(link.url).hostname;
  } catch {
    return link.url;
  }
};

export const getLinkImage = (link: Link) => {
  return link.og_image || link.favicon || '';
};

export const getTagColor = (tags: Tag[], tagId: string) => {
  const tag = tags.find((t) => t.id === tagId);
  return tag?.color || '#3b82f6';
};

export const getTagName = (tags: Tag[], tagId: string) => {
  const tag = tags.find((t) => t.id === tagId);
  return tag?.name || 'Unknown';
};
