import { createAdminSupabaseClient } from '@/lib/supabase.admin';

const BUCKET = 'event-photos';

type PhotoStatus = 'pending' | 'approved' | 'rejected' | 'inactive';

type PhotoRow = {
  id: string;
  event_id: string;
  uploader_id: string;
  storage_path: string;
};

function publicUrlForPath(storagePath: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;
}

function inactiveStoragePath(photoId: string, storagePath: string): string {
  const fileName = storagePath.split('/').pop() ?? 'photo.jpg';
  return `inactive/${photoId}/${fileName}`;
}

function activeStoragePath(eventId: string, uploaderId: string, storagePath: string): string {
  const fileName = storagePath.split('/').pop() ?? 'photo.jpg';
  const ext = fileName.includes('.') ? fileName.split('.').pop() : 'jpg';
  return `events/${eventId}/${uploaderId}/${Date.now()}.${ext}`;
}

export async function applyPhotoStatusChange(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  photo: PhotoRow,
  nextStatus: PhotoStatus,
): Promise<void> {
  let storagePath = photo.storage_path;
  let publicUrl: string | null = publicUrlForPath(storagePath);

  if (nextStatus === 'inactive') {
    if (!storagePath.startsWith('inactive/')) {
      const dest = inactiveStoragePath(photo.id, storagePath);
      const { error: moveError } = await supabase.storage.from(BUCKET).move(storagePath, dest);
      if (moveError) throw new Error(moveError.message);
      storagePath = dest;
    }
    publicUrl = null;
  } else if (nextStatus === 'approved' && storagePath.startsWith('inactive/')) {
    const dest = activeStoragePath(photo.event_id, photo.uploader_id, storagePath);
    const { error: moveError } = await supabase.storage.from(BUCKET).move(storagePath, dest);
    if (moveError) throw new Error(moveError.message);
    storagePath = dest;
    publicUrl = publicUrlForPath(dest);
  } else if (nextStatus === 'approved') {
    publicUrl = publicUrlForPath(storagePath);
  }

  const { error: updateError } = await supabase
    .from('event_photos')
    .update({
      status: nextStatus,
      storage_path: storagePath,
      public_url: publicUrl,
    })
    .eq('id', photo.id);

  if (updateError) throw new Error(updateError.message);
}
