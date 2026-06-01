import { redirect } from 'next/navigation.js';

export default function RootPage() {
  redirect('/dashboard');
}
