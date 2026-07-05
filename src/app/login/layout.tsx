import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Member Login',
  description: 'Sign in to your My Trust account to claim daily rewards, view wallet balance, or request withdrawals.',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
