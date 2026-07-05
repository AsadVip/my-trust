'use client';

import { useState } from 'react';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';
import { Menu, X, Shield } from 'lucide-react';

export default function PublicHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-light dark:border-border-dark bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 text-primary-600 dark:text-primary-400 font-bold text-lg select-none">
          <Shield size={24} className="stroke-[2.5px]" />
          <span className="tracking-tight text-text-primary dark:text-white">My Trust</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link href="/faq" className="text-sm font-medium text-text-secondary hover:text-primary-500 transition-colors duration-150">
            FAQ
          </Link>
          <Link href="/contact" className="text-sm font-medium text-text-secondary hover:text-primary-500 transition-colors duration-150">
            Contact
          </Link>
          <Link href="/terms" className="text-sm font-medium text-text-secondary hover:text-primary-500 transition-colors duration-150">
            Terms
          </Link>
          <Link href="/privacy" className="text-sm font-medium text-text-secondary hover:text-primary-500 transition-colors duration-150">
            Privacy
          </Link>
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center space-x-4">
          <ThemeToggle />
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-primary-500 transition-colors duration-150"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="px-5 py-2.5 text-sm font-semibold bg-primary-600 text-white rounded-xl hover:bg-primary-700 active:translate-y-0.5 shadow-sm transition-all duration-150 cursor-pointer"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center space-x-3">
          <ThemeToggle />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-xl text-text-secondary hover:bg-primary-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden border-t border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-4 py-4 space-y-3 animate-fadeIn">
          <Link
            href="/faq"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:bg-primary-50 dark:hover:bg-slate-800 transition-colors"
          >
            FAQ
          </Link>
          <Link
            href="/contact"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:bg-primary-50 dark:hover:bg-slate-800 transition-colors"
          >
            Contact
          </Link>
          <Link
            href="/terms"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:bg-primary-50 dark:hover:bg-slate-800 transition-colors"
          >
            Terms
          </Link>
          <Link
            href="/privacy"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:bg-primary-50 dark:hover:bg-slate-800 transition-colors"
          >
            Privacy
          </Link>
          <div className="h-px bg-border-light dark:border-border-dark my-2"></div>
          <div className="flex flex-col space-y-2 px-4 pt-2">
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="text-center py-2.5 text-sm font-medium text-text-secondary hover:text-primary-500 transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/register"
              onClick={() => setIsOpen(false)}
              className="text-center py-2.5 text-sm font-semibold bg-primary-600 text-white rounded-xl hover:bg-primary-700 shadow-sm transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
