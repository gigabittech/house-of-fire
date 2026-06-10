import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  eventPhotoGridUrl,
  eventPhotoLightboxUrl,
  eventPhotoRenderUrl,
  eventPhotoThumbUrl,
} from './eventPhotoUrls';

describe('eventPhotoUrls', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('builds Supabase render URLs with transforms', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    const url = eventPhotoRenderUrl('events/ev/uploader/photo.jpg', {
      width: 320,
      height: 320,
      quality: 70,
      resize: 'cover',
    });
    expect(url).toBe(
      'https://example.supabase.co/storage/v1/render/image/public/event-photos/events/ev/uploader/photo.jpg?width=320&height=320&quality=70&resize=cover',
    );
  });

  it('prefers storage_path transforms over raw public_url', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    const photo = {
      storage_path: 'events/1/u/1.jpg',
      public_url: 'https://example.supabase.co/storage/v1/object/public/event-photos/events/1/u/1.jpg',
    };
    expect(eventPhotoThumbUrl(photo)).toContain('/render/image/public/');
    expect(eventPhotoGridUrl(photo)).toContain('width=480');
    expect(eventPhotoLightboxUrl(photo)).toContain('width=1920');
  });

  it('falls back to public_url when storage_path is missing', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    expect(eventPhotoThumbUrl({ public_url: 'https://cdn.example/photo.jpg' })).toBe(
      'https://cdn.example/photo.jpg',
    );
  });
});
