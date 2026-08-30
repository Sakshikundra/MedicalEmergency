import { motion } from 'framer-motion';

const rows = [
    { label: 'Blood group', value: 'O negative', alert: false },
    { label: 'Allergies', value: 'Penicillin, latex', alert: true },
    { label: 'Conditions', value: 'Type 1 diabetes', alert: false },
    { label: 'Next of kin', value: 'A. Rao · +91 98••• ••21', alert: false },
];

export function EmergencyCard() {
    return (
        <motion.figure
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="w-full max-w-sm border border-ink bg-paper-card"
        >
            <div className="flex items-start justify-between border-b border-ink px-5 py-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-alert">Emergency record</p>
                <p className="font-mono text-[10px] text-ink-500">MX-4471-08</p>
            </div>

            <div className="flex items-start justify-between gap-4 px-5 pt-5">
                <div>
                    <p className="font-display text-2xl leading-none text-ink">Nikhil Raut</p>
                    <p className="mt-1.5 text-xs text-ink-500">34 years · Pune, IN</p>
                </div>
                <div aria-hidden="true" className="grid h-14 w-14 shrink-0 grid-cols-5 grid-rows-5 gap-px border border-ink p-1">
                    {Array.from({ length: 25 }).map((_, i) => (
                        <span key={i} className={i % 3 === 0 || i % 7 === 0 ? 'bg-ink' : 'bg-transparent'} />
                    ))}
                </div>
            </div>

            <dl className="mt-5 divide-y divide-ink-line border-t border-ink-line">
                {rows.map((row) => (
                    <div key={row.label} className="flex items-baseline gap-4 px-5 py-2.5">
                        <dt className="w-24 shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">{row.label}</dt>
                        <dd className={`text-sm ${row.alert ? 'font-medium text-alert' : 'text-ink'}`}>{row.value}</dd>
                    </div>
                ))}
            </dl>

            <div className="border-t border-ink-line px-5 py-3">
                <svg viewBox="0 0 300 40" className="h-8 w-full" role="img" aria-label="Heart rate trace">
                    <path
                        className="trace-line"
                        d="M0 26 H60 l8 -15 l8 28 l8 -18 H140 l8 -12 l8 24 l8 -14 H240 l8 -10 l8 20 l8 -10 H300"
                        fill="none"
                        stroke="#17191c"
                        strokeWidth="1.25"
                        strokeLinecap="round"
                    />
                </svg>
            </div>

            <figcaption className="border-t border-ink-line px-5 py-3 font-mono text-[10px] text-ink-500">
                Last opened — Ruby Hall ER, 14:02, by Dr. M. Iyer
            </figcaption>
        </motion.figure>
    );
}
