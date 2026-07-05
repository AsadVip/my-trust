import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Register for an account on My Trust to start earning daily check-in rewards and building streak multipliers.',
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
