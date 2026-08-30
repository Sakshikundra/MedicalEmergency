import { motion } from 'framer-motion';
import { features } from '../../data/homeContent';

export function Features() {
    return (
        <section id="features" className="border-t border-ink py-20">
            <div className="mx-auto max-w-5xl px-6">
                <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink pb-5">
                    <h2 className="max-w-xl font-display text-4xl leading-[1.05] tracking-tight text-ink">
                        What the record actually holds
                    </h2>
                    <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-ink-500">Six of them</p>
                </div>

                <ul className="grid sm:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature, i) => (
                        <motion.li
                            key={feature.id}
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-60px' }}
                            transition={{ duration: 0.45, delay: (i % 3) * 0.07 }}
                            className="border-b border-r border-ink-line py-7 pr-6 sm:odd:pl-0 lg:[&:nth-child(3n+1)]:pl-0 lg:[&:nth-child(3n)]:border-r-0"
                        >
                            <span className="font-mono text-[10px] text-ink-300">{String(i + 1).padStart(2, '0')}</span>
                            <h3 className="mt-3 font-display text-xl leading-tight text-ink">{feature.title}</h3>
                            <p className="mt-2.5 max-w-xs text-sm leading-relaxed text-ink-700">{feature.description}</p>
                        </motion.li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
