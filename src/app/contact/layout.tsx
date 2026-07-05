import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Contact Support',
  description: 'Get in touch with the My Trust operations and support team for deposit verification, wallet issues, or streak resets.',
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
