import { AuthNavigationProvider } from '@/components/auth/AuthNavigation';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthNavigationProvider>{children}</AuthNavigationProvider>;
}
