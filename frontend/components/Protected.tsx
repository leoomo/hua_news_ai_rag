'use client';
import { ReactNode, useEffect, useState } from 'react';
import { getAuthToken } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export function Protected({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.replace('/login');
    } else {
      setOk(true);
    }
  }, [router]);
  if (!ok) return null;
  return <>{children}</>;
}

