'use client';

import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, TrendingUp, Users, Calendar, Award, Lock, Gift, HelpCircle } from 'lucide-react';

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      },
    },
  };

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'My Trust Earn',
    alternateName: 'My Trust',
    url: 'https://mytrustearn.online',
    description: 'Earn daily rewards by checking in, building streaks, and managing payouts via JazzCash & EasyPaisa on My Trust Earn.',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://mytrustearn.online/faq?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'My Trust Earn',
    alternateName: 'My Trust',
    url: 'https://mytrustearn.online',
    logo: 'https://mytrustearn.online/images/og-image.png',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'support@mytrust.com',
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg-light dark:bg-bg-dark transition-colors duration-200">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <PublicHeader />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-20 pb-28 md:pt-28 md:pb-36">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-12 gap-12 items-center">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="md:col-span-7 space-y-6 text-center md:text-left"
              >
                <motion.span
                  variants={itemVariants}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400"
                >
                  <Award size={14} /> Earn Rewards Daily
                </motion.span>
                <motion.h1
                  variants={itemVariants}
                  className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-text-primary dark:text-white leading-[1.1]"
                >
                  Build Consistent Habits. <br />
                  <span className="text-primary-600 dark:text-primary-400">Earn Daily with My Trust Earn.</span>
                </motion.h1>
                <motion.p
                  variants={itemVariants}
                  className="text-lg text-text-secondary dark:text-slate-300 max-w-2xl"
                >
                  Welcome to My Trust Earn, the premier online rewards platform. Simply check in once every 24 hours to claim your daily check-in rewards, build consecutive day streaks for bonus multipliers, and securely manage your earnings in our transparent wallet ledger.
                </motion.p>
                <motion.div
                  variants={itemVariants}
                  className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-2"
                >
                  <Link
                    href="/register"
                    className="flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-lg shadow-primary-500/10 hover:shadow-primary-500/20 active:translate-y-0.5 transition-all cursor-pointer"
                  >
                    Start Earning Now <ArrowRight size={18} />
                  </Link>
                  <Link
                    href="/faq"
                    className="flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold bg-surface-light dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-text-secondary dark:text-white border border-border-light dark:border-border-dark rounded-xl active:translate-y-0.5 transition-all cursor-pointer"
                  >
                    Learn How it Works
                  </Link>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="md:col-span-5 flex justify-center"
              >
                {/* Hero Feature Illustration Card */}
                <div className="relative w-full max-w-md bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-8 rounded-2xl shadow-xl">
                  {/* Glassmorphism Background Accent */}
                  <div className="absolute -top-12 -right-12 w-64 h-64 bg-primary-400/10 dark:bg-primary-500/5 rounded-full blur-3xl -z-10"></div>
                  <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-success-400/10 dark:bg-success-500/5 rounded-full blur-3xl -z-10"></div>
                  
                  <div className="flex items-center justify-between border-b border-divider-light dark:border-divider-dark pb-6 mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                        <Calendar size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-text-muted">Habit Counter</p>
                        <h4 className="font-semibold text-text-primary dark:text-white text-sm">Daily Check-in</h4>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400 flex items-center gap-1">
                      Active Streak
                    </span>
                  </div>

                  <div className="space-y-6">
                    <div className="text-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-divider-light dark:border-border-dark">
                      <p className="text-xs text-text-muted mb-1">Estimated Reward Today</p>
                      <h3 className="text-4xl font-bold tracking-tight text-text-primary dark:text-white financial-nums">
                        18.00 <span className="text-sm font-normal text-text-muted">Credits</span>
                      </h3>
                      <p className="text-xs text-success-600 dark:text-success-400 font-medium mt-2 flex items-center justify-center gap-1">
                        Base 10.00 + Streak Bonus 8.00
                      </p>
                    </div>

                    <div className="flex justify-between items-center text-sm px-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-success-500" />
                        <span className="text-text-secondary dark:text-slate-300">Streak: 5 Days</span>
                      </div>
                      <span className="text-text-muted text-xs">Next Reward Cooldown</span>
                    </div>

                    <button className="w-full py-3.5 text-center text-sm font-semibold bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-md transition-all cursor-not-allowed opacity-90 animate-pulse-glow">
                      Perform Check-in
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <section className="bg-surface-light dark:bg-surface-dark border-y border-border-light dark:border-border-dark py-12 transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="space-y-1">
                <p className="text-xs font-semibold tracking-wider text-text-muted uppercase">Total Members</p>
                <p className="text-3xl font-bold text-text-primary dark:text-white">12,500+</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold tracking-wider text-text-muted uppercase">Daily Check-ins</p>
                <p className="text-3xl font-bold text-text-primary dark:text-white">8,400+</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold tracking-wider text-text-muted uppercase">Rewards Credited</p>
                <p className="text-3xl font-bold text-text-primary dark:text-white">250K+</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold tracking-wider text-text-muted uppercase">Withdrawals Completed</p>
                <p className="text-3xl font-bold text-text-primary dark:text-white">99.9%</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-text-primary dark:text-white">How It Works</h2>
            <p className="text-text-secondary dark:text-slate-300">
              Start earning consistently in just three simple steps. We provide complete wallet transparency and secure withdrawal channels.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-8 rounded-2xl hover:-translate-y-1 transition-all duration-200">
              <div className="w-12 h-12 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 rounded-xl flex items-center justify-center mb-6">
                <Users size={24} />
              </div>
              <h3 className="text-xl font-bold text-text-primary dark:text-white mb-2">1. Register Account</h3>
              <p className="text-sm text-text-secondary dark:text-slate-300">
                Sign up with your email and password. Verify your email to secure your account and unlock direct withdrawal privileges.
              </p>
            </div>

            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-8 rounded-2xl hover:-translate-y-1 transition-all duration-200">
              <div className="w-12 h-12 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 rounded-xl flex items-center justify-center mb-6">
                <Calendar size={24} />
              </div>
              <h3 className="text-xl font-bold text-text-primary dark:text-white mb-2">2. Daily Check-in</h3>
              <p className="text-sm text-text-secondary dark:text-slate-300">
                Click "Check-in" once every 24 hours to claim rewards. Accumulate consecutive days to multiply your streak bonus.
              </p>
            </div>

            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-8 rounded-2xl hover:-translate-y-1 transition-all duration-200">
              <div className="w-12 h-12 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 rounded-xl flex items-center justify-center mb-6">
                <Lock size={24} />
              </div>
              <h3 className="text-xl font-bold text-text-primary dark:text-white mb-2">3. Withdraw Wallet Funds</h3>
              <p className="text-sm text-text-secondary dark:text-slate-300">
                Once eligible, submit withdrawal requests to your JazzCash or EasyPaisa accounts. Fast manual administrative approvals.
              </p>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="bg-slate-50 dark:bg-slate-900/50 py-24 border-y border-border-light dark:border-border-dark transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-text-primary dark:text-white">Why Choose My Trust</h2>
              <p className="text-text-secondary dark:text-slate-300">
                A premium Fintech platform built on honesty, security, and consistent delivery.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="flex gap-4">
                <div className="mt-1 w-8 h-8 rounded-lg bg-success-50 dark:bg-success-950/30 text-success-600 dark:text-success-400 flex items-center justify-center shrink-0">
                  <CheckCircle size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-text-primary dark:text-white mb-1">Centralized Ledger</h4>
                  <p className="text-sm text-text-secondary dark:text-slate-300">Every reward, streak bonus, deposit, and withdrawal creates an immutable ledger entry.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="mt-1 w-8 h-8 rounded-lg bg-success-50 dark:bg-success-950/30 text-success-600 dark:text-success-400 flex items-center justify-center shrink-0">
                  <CheckCircle size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-text-primary dark:text-white mb-1">Local Payments</h4>
                  <p className="text-sm text-text-secondary dark:text-slate-300">Fully integrated with JazzCash and EasyPaisa for easy deposits and cash outs.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="mt-1 w-8 h-8 rounded-lg bg-success-50 dark:bg-success-950/30 text-success-600 dark:text-success-400 flex items-center justify-center shrink-0">
                  <CheckCircle size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-text-primary dark:text-white mb-1">Anti-Cheat Enforcement</h4>
                  <p className="text-sm text-text-secondary dark:text-slate-300">Secure server-side time verification prevents timestamp manipulation or duplicate checks.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="mt-1 w-8 h-8 rounded-lg bg-success-50 dark:bg-success-950/30 text-success-600 dark:text-success-400 flex items-center justify-center shrink-0">
                  <CheckCircle size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-text-primary dark:text-white mb-1">Streak Bonuses</h4>
                  <p className="text-sm text-text-secondary dark:text-slate-300">Maintain your check-in habit to unlock milestone rewards on Day 7, 15, and 30.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="mt-1 w-8 h-8 rounded-lg bg-success-50 dark:bg-success-950/30 text-success-600 dark:text-success-400 flex items-center justify-center shrink-0">
                  <CheckCircle size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-text-primary dark:text-white mb-1">Responsive Interface</h4>
                  <p className="text-sm text-text-secondary dark:text-slate-300">A smooth, mobile-first web app that flows perfectly on phones, tablets, and desktops.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="mt-1 w-8 h-8 rounded-lg bg-success-50 dark:bg-success-950/30 text-success-600 dark:text-success-400 flex items-center justify-center shrink-0">
                  <CheckCircle size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-text-primary dark:text-white mb-1">Support Management</h4>
                  <p className="text-sm text-text-secondary dark:text-slate-300">Integrated support ticket system ensuring questions are reviewed and resolved quickly.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-text-primary dark:text-white">Frequently Asked Questions</h2>
            <p className="text-text-secondary dark:text-slate-300">Quick answers to common questions about rewards and wallet operations.</p>
          </div>

          <div className="space-y-6">
            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 rounded-xl">
              <h4 className="font-bold text-text-primary dark:text-white mb-2 flex items-center gap-2">
                <HelpCircle size={18} className="text-primary-500" />
                How much is the minimum withdrawal?
              </h4>
              <p className="text-sm text-text-secondary dark:text-slate-300 pl-7">
                The minimum withdrawal limit is Rs. 70. Withdrawals are processed manually via JazzCash or EasyPaisa after verification.

              </p>
            </div>

            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 rounded-xl">
              <h4 className="font-bold text-text-primary dark:text-white mb-2 flex items-center gap-2">
                <HelpCircle size={18} className="text-primary-500" />
                How often can I check in?
              </h4>
              <p className="text-sm text-text-secondary dark:text-slate-300 pl-7">
                You can perform one check-in every 24-hour rolling period. A real-time countdown timer on your dashboard shows when you are next eligible.
              </p>
            </div>

            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 rounded-xl">
              <h4 className="font-bold text-text-primary dark:text-white mb-2 flex items-center gap-2">
                <HelpCircle size={18} className="text-primary-500" />
                What happens if I miss a day?
              </h4>
              <p className="text-sm text-text-secondary dark:text-slate-300 pl-7">
                If you do not check in within 48 hours of your last check-in, your streak counter resets to 0 and your daily reward resets to the base value.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              href="/faq"
              className="text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center justify-center gap-1"
            >
              View all FAQs <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
