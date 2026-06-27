'use client';

import { useEffect } from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import { ThemeSync } from '@/components/ui/ThemeToggle';
import { SignInModal } from '@/components/auth/SignInModal';
import { Toaster } from '@/components/tasks/Toaster';

/**
 * App-wide provider mounted at the root. Loads the session once so every page
 * (public or workspace) knows who is signed in, applies the theme globally, and
 * hosts the global sign-in modal + toast stack.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const loadSession = useTaskStore((s) => s.loadSession);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  return (
    <>
      <ThemeSync />
      {children}
      <SignInModal />
      <Toaster />
    </>
  );
}
