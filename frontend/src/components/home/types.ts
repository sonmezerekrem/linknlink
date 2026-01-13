import type { RecordModel } from 'pocketbase';

export type Link = RecordModel & {
  url: string;
  title?: string;
  description?: string;
  og_image?: string;
  og_site_name?: string;
  favicon?: string;
  tags?: string[];
  expand?: {
    tags?: Tag[];
  };
};

export type Tag = RecordModel & {
  name: string;
  color?: string;
};

export type LinksResponse = {
  items: Link[];
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
};

export type PaginationState = {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
};
