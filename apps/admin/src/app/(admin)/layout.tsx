import { AdminLayout } from '@/components/AdminLayout';
import { RealtimeShell } from '@/components/RealtimeShell';

export default function AdminShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <RealtimeShell>
      <AdminLayout>{children}</AdminLayout>
    </RealtimeShell>
  );
}
