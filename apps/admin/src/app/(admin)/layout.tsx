import { AdminLayout } from '@/components/AdminLayout.js';

export default function AdminShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
