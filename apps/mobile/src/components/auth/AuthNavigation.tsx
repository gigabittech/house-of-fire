'use client';

import { useRouter } from 'next/navigation';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useTransition,
} from 'react';

interface AuthNavigationContextValue {
  isPending: boolean;
  navigate: (href: string) => void;
  replace: (href: string) => void;
}

const AuthNavigationContext = createContext<AuthNavigationContextValue | null>(null);

export function AuthNavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const navigate = useCallback(
    (href: string) => {
      startTransition(() => {
        router.push(href);
      });
    },
    [router],
  );

  const replace = useCallback(
    (href: string) => {
      startTransition(() => {
        router.replace(href);
      });
    },
    [router],
  );

  const value = useMemo(() => ({ isPending, navigate, replace }), [isPending, navigate, replace]);

  return (
    <AuthNavigationContext.Provider value={value}>
      <div
        style={{
          opacity: isPending ? 0.72 : 1,
          transition: 'opacity 150ms ease',
        }}
      >
        {children}
      </div>
    </AuthNavigationContext.Provider>
  );
}

export function useAuthNavigation(): AuthNavigationContextValue {
  const ctx = useContext(AuthNavigationContext);
  if (ctx == null) {
    throw new Error('useAuthNavigation must be used within AuthNavigationProvider');
  }
  return ctx;
}
