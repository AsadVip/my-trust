import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions (FAQ)',
  description: 'Find answers to common questions about rewards check-in rules, deposit verification, and withdrawal channels on My Trust.',
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
