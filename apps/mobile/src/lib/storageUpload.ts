const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type) && !file.type.startsWith('image/')) {
    return 'Only image files are allowed';
  }
  if (file.size > MAX_BYTES) {
    return 'Image must be 8 MB or smaller';
  }
  return null;
}

export async function putFileToSignedUrl(signedUrl: string, file: File): Promise<void> {
  const res = await fetch(signedUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
  });
  if (!res.ok) {
    throw new Error(`Upload failed (${res.status})`);
  }
}

export async function uploadEventPhoto(
  eventId: string,
  file: File,
): Promise<{ publicUrl: string; photoId?: string }> {
  const err = validateImageFile(file);
  if (err) throw new Error(err);

  const res = await fetch('/api/photos/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventId,
      fileName: file.name,
      contentType: file.type,
    }),
  });
  const data = (await res.json()) as {
    signedUrl?: string;
    publicUrl?: string;
    photoId?: string;
    error?: string;
  };
  if (!res.ok || !data.signedUrl || !data.publicUrl) {
    throw new Error(data.error ?? 'Could not start upload');
  }
  await putFileToSignedUrl(data.signedUrl, file);
  return { publicUrl: data.publicUrl, photoId: data.photoId };
}

export async function uploadPostMedia(file: File): Promise<string> {
  const err = validateImageFile(file);
  if (err) throw new Error(err);

  const res = await fetch('/api/posts/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName: file.name, contentType: file.type }),
  });
  const data = (await res.json()) as { signedUrl?: string; publicUrl?: string; error?: string };
  if (!res.ok || !data.signedUrl || !data.publicUrl) {
    throw new Error(data.error ?? 'Could not start upload');
  }
  await putFileToSignedUrl(data.signedUrl, file);
  return data.publicUrl;
}

export async function uploadPostMediaBatch(files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    urls.push(await uploadPostMedia(file));
  }
  return urls;
}
