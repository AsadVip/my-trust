'use client';

import { useState, useEffect } from 'react';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import { createClient } from '@/lib/supabase/client';
import { Loader } from 'lucide-react';

export default function TermsPage() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadContent() {
      try {
        const { data } = await supabase
          .from('cms_pages')
          .select('content')
          .eq('id', 'terms')
          .single();
        if (data) setContent(data.content);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadContent();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-bg-light dark:bg-bg-dark transition-colors duration-200">
      <PublicHeader />
      <main className="flex-grow max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-bold text-text-primary dark:text-white tracking-tight mb-8">Terms & Conditions</h1>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader className="animate-spin text-primary-500" size={24} />
          </div>
        ) : (
          <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-8 rounded-2xl shadow-sm">
            <div className="prose dark:prose-invert max-w-none text-text-secondary dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {content || 'Terms and Conditions will be displayed here.'}
            </div>
          </div>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
