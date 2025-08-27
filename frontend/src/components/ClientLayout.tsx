'use client';

import dynamic from 'next/dynamic';
import { Spinner } from '@nextui-org/react';

const AuthProvider = dynamic(
  () => import('@/components/providers/AuthProvider').then(mod => ({ default: mod.AuthProvider })),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    ),
  }
);

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}