import { motion } from 'framer-motion';
import { steps } from '../../data/homeContent';

export function HowItWorks() {
    return (
        <section id="how-it-works" className="border-t border-ink bg-paper-deep py-20">
            <div className="mx-auto max-w-5xl px-6">
                <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
                    <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-ink-500">How it works</p>
                        <h2 className="mt-4 font-display text-4xl leading-[1.05] tracking-tight text-ink">
                            Three steps, then you can forget about it
                        </h2>
                    </div>

                    <ol className="divide-y divide-ink-line border-y border-ink-line">
                        {steps.map((step, i) => (
                            <motion.li
                                key={step.index}
                                initial={{ opacity: 0, y: 12 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-60px' }}
                                transition={{ duration: 0.45, delay: i * 0.08 }}
                                className="grid grid-cols-[48px_1fr] gap-4 py-6"
                            >
                                <span className="font-mono text-xs text-alert">{step.index}</span>
                                <div>
                                    <h3 className="font-display text-2xl leading-none text-ink">{step.title}</h3>
                                    <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink-700">{step.description}</p>
                                </div>
                            </motion.li>
                        ))}
                    </ol>
                </div>
            </div>
        </section>
    );
}
