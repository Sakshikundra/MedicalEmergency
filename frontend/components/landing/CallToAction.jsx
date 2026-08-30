import { useState } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';

export function CallToAction() {
    const router = useRouter();
    const [email, setEmail] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        const query = email ? `?email=${encodeURIComponent(email)}` : '';
        router.push(`/register${query}`);
    };

    return (
        <section id="get-started" className="border-t border-ink bg-ink py-20 text-paper">
            <motion.div
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.5 }}
                className="mx-auto max-w-5xl px-6"
            >
                <div className="grid gap-10 lg:grid-cols-[1fr_400px] lg:items-end">
                    <div>
                        <h2 className="max-w-lg font-display text-4xl leading-[1.05] tracking-tight sm:text-5xl">
                            Five minutes now, for the day nobody plans for.
                        </h2>
                        <p className="mt-5 max-w-md text-sm leading-relaxed text-paper/60">
                            Free for individuals, permanently. You only pay if a clinic or a
                            family needs shared management.
                        </p>
                    </div>

                    <form className="w-full" onSubmit={handleSubmit} aria-label="Get started">
                        <label htmlFor="cta-email" className="font-mono text-[10px] uppercase tracking-[0.24em] text-paper/50">
                            Email address
                        </label>
                        <div className="mt-2 flex border-b border-paper/40 focus-within:border-paper">
                            <input
                                id="cta-email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@email.com"
                                className="w-full bg-transparent py-2.5 text-sm text-paper placeholder:text-paper/35 focus:outline-none"
                            />
                            <button type="submit" className="shrink-0 px-3 text-sm font-medium text-paper transition-colors hover:text-alert">
                                Start →
                            </button>
                        </div>
                        <p className="mt-3 text-[11px] text-paper/45">No card required. Delete your record at any time.</p>
                    </form>
                </div>
            </motion.div>
        </section>
    );
}
