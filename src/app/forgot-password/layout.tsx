import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Recover your account password on My Trust through secure email verification.',
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
