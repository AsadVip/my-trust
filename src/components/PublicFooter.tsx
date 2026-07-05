import Link from 'next/link';
import { Shield } from 'lucide-react';

export default function PublicFooter() {
  return (
    <footer className="bg-surface-light dark:bg-surface-dark border-t border-border-light dark:border-border-dark transition-colors duration-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex items-center space-x-2 text-primary-600 dark:text-primary-400 font-bold select-none justify-center md:justify-start">
            <Shield size={20} className="stroke-[2.5px]" />
            <span className="text-text-primary dark:text-white tracking-tight">My Trust</span>
          </div>
          
          <nav className="flex flex-wrap justify-center space-x-6 md:space-x-8 mt-6 md:mt-0" aria-label="Footer">
            <Link href="/faq" className="text-sm text-text-muted hover:text-primary-500 transition-colors">
              FAQ
            </Link>
            <Link href="/contact" className="text-sm text-text-muted hover:text-primary-500 transition-colors">
              Contact
            </Link>
            <Link href="/terms" className="text-sm text-text-muted hover:text-primary-500 transition-colors">
              Terms & Conditions
            </Link>
            <Link href="/privacy" className="text-sm text-text-muted hover:text-primary-500 transition-colors">
              Privacy Policy
            </Link>
          </nav>
        </div>
        
        <div className="mt-8 border-t border-divider-light dark:border-divider-dark pt-8 flex flex-col md:flex-row items-center justify-between text-center md:text-left">
          <p className="text-xs text-text-muted">
            &copy; {new Date().getFullYear()} My Trust Platform. All rights reserved.
          </p>
          <p className="text-xs text-text-muted mt-2 md:mt-0">
            Designed for financial transparency, daily check-in habits, and secure wallet management.
          </p>
        </div>
      </div>
    </footer>
  );
}
