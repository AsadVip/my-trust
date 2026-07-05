'use client';

import { useState, useEffect } from 'react';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import { createClient } from '@/lib/supabase/client';
import { HelpCircle, Search, ChevronDown, ChevronUp, Loader } from 'lucide-react';

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export default function FaqPage() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [openId, setOpenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function loadFaqs() {
      try {
        const { data, error } = await supabase
          .from('faq')
          .select('*')
          .eq('is_visible', true)
          .order('order_index', { ascending: true });
        
        if (data) {
          setFaqs(data);
        }
      } catch (err) {
        console.error('Error loading FAQs:', err);
      } finally {
        setLoading(false);
      }
    }
    loadFaqs();
  }, []);

  const categories = ['All', 'Earning', 'Deposits', 'Withdrawals', 'Security'];

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || faq.category.toLowerCase() === activeCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen flex flex-col bg-bg-light dark:bg-bg-dark transition-colors duration-200">
      <PublicHeader />

      <main className="flex-grow max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary dark:text-white tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-text-secondary dark:text-slate-300 max-w-xl mx-auto">
            Find answers to common questions about rewards check-in rules, deposit verification, and withdrawal channels.
          </p>
        </div>

        {/* Search & Categories Bar */}
        <div className="space-y-6 mb-10">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-text-muted" size={18} />
            <input
              type="text"
              placeholder="Search questions or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-text-primary dark:text-white"
            />
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setActiveCategory(category);
                  setOpenId(null);
                }}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  activeCategory === category
                    ? 'bg-primary-600 text-white'
                    : 'bg-surface-light dark:bg-slate-800 text-text-secondary dark:text-slate-300 border border-border-light dark:border-border-dark hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-text-muted">
            <Loader className="animate-spin mb-3 text-primary-500" size={28} />
            <p className="text-sm">Loading questions...</p>
          </div>
        ) : (
          /* Accordion List */
          <div className="space-y-4">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq) => {
                const isOpen = openId === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl overflow-hidden shadow-sm"
                  >
                    <button
                      onClick={() => setOpenId(isOpen ? null : faq.id)}
                      className="w-full text-left px-6 py-5 flex items-center justify-between hover:bg-slate-50/55 dark:hover:bg-slate-800/30 transition-all cursor-pointer"
                    >
                      <div className="flex items-center space-x-3 pr-4">
                        <HelpCircle className="text-primary-500 shrink-0" size={20} />
                        <h3 className="font-semibold text-text-primary dark:text-white text-sm sm:text-base">
                          {faq.question}
                        </h3>
                      </div>
                      {isOpen ? (
                        <ChevronUp className="text-text-muted shrink-0" size={18} />
                      ) : (
                        <ChevronDown className="text-text-muted shrink-0" size={18} />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-6 pt-1 border-t border-divider-light dark:border-divider-dark animate-slideDown">
                        <p className="text-sm sm:text-base text-text-secondary dark:text-slate-300 leading-relaxed pl-8">
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 border border-dashed border-border-light dark:border-border-dark rounded-2xl bg-surface-light dark:bg-surface-dark">
                <HelpCircle className="mx-auto text-text-muted mb-3" size={32} />
                <h4 className="font-semibold text-text-primary dark:text-white mb-1">No questions found</h4>
                <p className="text-xs text-text-muted">Try adjusting your search filters.</p>
              </div>
            )}
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
