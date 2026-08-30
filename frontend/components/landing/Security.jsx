import { motion } from 'framer-motion';

const guarantees = [
    {
        title: 'Sealed on your device',
        text: 'AES-256, with keys that never leave your phone.',
    },
    {
        title: 'Minimum necessary',
        text: 'Responders see the critical layer. History stays closed.',
    },
    {
        title: 'Audited every year',
        text: 'HIPAA and DPDP aligned, with reports you can actually read.',
    },
    {
        title: 'You are told',
        text: 'Each access sends an alert naming the facility and clinician.',
    },
];

const logLines = [
    { key: 'grant', value: 'incident #4471 · scope: critical layer' },
    { key: 'actor', value: 'Ruby Hall ER · verified badge #221' },
    { key: 'expires', value: '60 minutes · auto-revoke', alert: true },
    { key: 'notified', value: 'owner + next of kin, 14:02' },
];

export function Security() {
    return (
        <section id="security" className="border-t border-ink bg-paper-deep py-20">
            <div className="mx-auto max-w-5xl px-6">
                <div className="grid gap-12 lg:grid-cols-2">
                    <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-ink-500">Access & privacy</p>
                        <h2 className="mt-4 max-w-md font-display text-4xl leading-[1.05] tracking-tight text-ink">
                            Break-glass access, not open access
                        </h2>
                        <p className="mt-5 max-w-md text-sm leading-relaxed text-ink-700">
                            Emergency access is granted for one incident and expires with it.
                            Nobody — including us — can read the rest of your record outside a
                            window you authorise.
                        </p>

                        <dl className="mt-8 border border-ink bg-paper-card">
                            {logLines.map((line, i) => (
                                <div
                                    key={line.key}
                                    className={`flex gap-4 px-4 py-2.5 font-mono text-[11px] ${i > 0 ? 'border-t border-ink-line' : ''}`}
                                >
                                    <dt className={`w-20 shrink-0 ${line.alert ? 'text-alert' : 'text-ink-500'}`}>{line.key}</dt>
                                    <dd className="text-ink-700">{line.value}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>

                    <ul className="grid gap-px self-start border border-ink-line bg-ink-line sm:grid-cols-2">
                        {guarantees.map((item, i) => (
                            <motion.li
                                key={item.title}
                                initial={{ opacity: 0, y: 12 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-60px' }}
                                transition={{ duration: 0.45, delay: i * 0.06 }}
                                className="bg-paper-deep p-6"
                            >
                                <h3 className="font-display text-xl leading-tight text-ink">{item.title}</h3>
                                <p className="mt-2.5 text-sm leading-relaxed text-ink-700">{item.text}</p>
                            </motion.li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
}
