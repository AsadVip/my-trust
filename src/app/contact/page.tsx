'use client';

import { useState } from 'react';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import { Mail, Clock, Send, MessageSquare, CheckCircle, Info } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate sending support email/ticket
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    }, 1200);
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg-light dark:bg-bg-dark transition-colors duration-200">
      <PublicHeader />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center space-y-4 mb-16">
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary dark:text-white tracking-tight">
            Contact Support
          </h1>
          <p className="text-text-secondary dark:text-slate-300 max-w-xl mx-auto">
            Have questions about your wallet, check-in streak, or payment approvals? Get in touch with our operations team.
          </p>
        </div>

        <div className="grid md:grid-cols-12 gap-12 max-w-5xl mx-auto items-start">
          {/* Info Side */}
          <div className="md:col-span-5 space-y-8">
            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-8 rounded-2xl shadow-sm">
              <h3 className="font-bold text-text-primary dark:text-white text-lg mb-6 flex items-center gap-2">
                <Info className="text-primary-500" size={20} /> Support Info
              </h3>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 rounded-xl flex items-center justify-center shrink-0">
                    <Mail size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary dark:text-white">Email Address</h4>
                    <p className="text-sm text-text-secondary dark:text-slate-300 mt-0.5">support@mytrust.com</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 rounded-xl flex items-center justify-center shrink-0">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary dark:text-white">Operating Hours</h4>
                    <p className="text-sm text-text-secondary dark:text-slate-300 mt-0.5">Monday – Friday: 9 AM to 6 PM UTC</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 rounded-xl flex items-center justify-center shrink-0">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary dark:text-white">Response Expectation</h4>
                    <p className="text-sm text-text-secondary dark:text-slate-300 mt-0.5">We respond to all tickets within 12-24 hours.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Side */}
          <div className="md:col-span-7">
            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-8 rounded-2xl shadow-sm">
              <h3 className="font-bold text-text-primary dark:text-white text-lg mb-6">Send Support Message</h3>

              {success ? (
                <div className="p-6 bg-success-50 dark:bg-success-950/30 border border-success-200 dark:border-success-800/40 rounded-xl text-center space-y-3">
                  <CheckCircle className="mx-auto text-success-500" size={36} />
                  <h4 className="font-bold text-success-700 dark:text-success-400">Message Sent Successfully!</h4>
                  <p className="text-xs sm:text-sm text-success-600 dark:text-success-500">
                    Thank you. Your message has been received, and our support team will contact you shortly.
                  </p>
                  <button
                    onClick={() => setSuccess(false)}
                    className="mt-2 text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-text-secondary dark:text-slate-300">Name</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-border-light dark:border-border-dark rounded-xl text-sm focus:outline-none focus:border-primary-500 text-text-primary dark:text-white"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-text-secondary dark:text-slate-300">Email Address</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-border-light dark:border-border-dark rounded-xl text-sm focus:outline-none focus:border-primary-500 text-text-primary dark:text-white"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-secondary dark:text-slate-300">Subject</label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-border-light dark:border-border-dark rounded-xl text-sm focus:outline-none focus:border-primary-500 text-text-primary dark:text-white"
                      placeholder="Deposit delay / Streak reset question"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-secondary dark:text-slate-300">Message</label>
                    <textarea
                      required
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-border-light dark:border-border-dark rounded-xl text-sm focus:outline-none focus:border-primary-500 text-text-primary dark:text-white resize-none"
                      placeholder="Please explain your question or issue in detail..."
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold text-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Send Message'} <Send size={16} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
