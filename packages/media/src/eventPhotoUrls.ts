const EVENT_PHOTOS_BUCKET = 'event-photos';

export type EventPhotoTransformOptions = {
  width?: number;
  height?: number;
  quality?: number;
  resize?: 'cover' | 'contain' | 'fill';
};

export const EVENT_PHOTO_THUMB = { width: 320, height: 320, quality: 70, resize: 'cover' } as const;
export const EVENT_PHOTO_GRID = { width: 480, height: 480, quality: 75, resize: 'cover' } as const;
export const EVENT_PHOTO_PREVIEW = { width: 96, height: 96, quality: 65, resize: 'cover' } as const;
export const EVENT_PHOTO_LIGHTBOX = {
  width: 1920,
  height: 1920,
  quality: 85,
  resize: 'contain',
} as const;

function supabaseProjectUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  return url || null;
}

export function eventPhotoRenderUrl(
  storagePath: string,
  options: EventPhotoTransformOptions = EVENT_PHOTO_GRID,
): string | null {
  const base = supabaseProjectUrl();
  if (!base || !storagePath) return null;

  const params = new URLSearchParams();
  if (options.width) params.set('width', String(options.width));
  if (options.height) params.set('height', String(options.height));
  if (options.quality) params.set('quality', String(options.quality));
  if (options.resize) params.set('resize', options.resize);

  const qs = params.toString();
  return `${base}/storage/v1/render/image/public/${EVENT_PHOTOS_BUCKET}/${storagePath}${qs ? `?${qs}` : ''}`;
}

export function eventPhotoPublicObjectUrl(storagePath: string): string | null {
  const base = supabaseProjectUrl();
  if (!base || !storagePath) return null;
  return `${base}/storage/v1/object/public/${EVENT_PHOTOS_BUCKET}/${storagePath}`;
}

export function eventPhotoThumbUrl(photo: {
  storage_path?: string | null;
  public_url?: string | null;
}): string | null {
  if (photo.storage_path) {
    return eventPhotoRenderUrl(photo.storage_path, EVENT_PHOTO_THUMB);
  }
  return photo.public_url ?? null;
}

export function eventPhotoGridUrl(photo: {
  storage_path?: string | null;
  public_url?: string | null;
}): string | null {
  if (photo.storage_path) {
    return eventPhotoRenderUrl(photo.storage_path, EVENT_PHOTO_GRID);
  }
  return photo.public_url ?? null;
}

export function eventPhotoLightboxUrl(photo: {
  storage_path?: string | null;
  public_url?: string | null;
}): string | null {
  if (photo.storage_path) {
    return eventPhotoRenderUrl(photo.storage_path, EVENT_PHOTO_LIGHTBOX);
  }
  return photo.public_url ?? null;
}

export function eventPhotoPreviewUrl(photo: {
  storage_path?: string | null;
  public_url?: string | null;
}): string | null {
  if (photo.storage_path) {
    return eventPhotoRenderUrl(photo.storage_path, EVENT_PHOTO_PREVIEW);
  }
  return photo.public_url ?? null;
}
