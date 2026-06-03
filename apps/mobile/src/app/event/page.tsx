'use client';

import { useRouter } from 'next/navigation';
import EventScreen from '../../screens/EventScreen';

export default function Page() {
  const router = useRouter();
  return <EventScreen onOpenArtist={(slug) => router.push(`/artists/${slug}`)} />;
}
