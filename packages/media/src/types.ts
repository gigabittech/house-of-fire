export type EventPhotoCursor = {
  createdAt: string;
  id: string;
};

export type EventPhotoRow = {
  id: string;
  storage_path: string;
  public_url: string | null;
  created_at: string;
  caption?: string | null;
};

export type EventPhotoPage<T extends EventPhotoRow = EventPhotoRow> = {
  photos: T[];
  nextCursor: EventPhotoCursor | null;
  hasMore: boolean;
  totalCount?: number;
};
