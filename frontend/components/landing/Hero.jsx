import { motion } from 'framer-motion';
import Link from 'next/link';
import { Camera as CameraIcon } from 'lucide-react';
import { RecordDiagram } from './RecordDiagram';
import { EmergencyCard } from './EmergencyCard';
import { stats } from '../../data/homeContent';

const fadeUp = {
    hidden: { opacity: 0, y: 14 },
    show: (i) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.55, delay: i * 0.08, ease: 'easeOut' },
    }),
};

export function Hero() {
    return (
        <section id="top" className="relative overflow-hidden pt-24 sm:pt-28">
            <div className="pointer-events-none absolute inset-0">
                <div className="ruled absolute inset-0" />
                <div className="absolute right-[-14%] top-4 h-[680px] w-[680px] opacity-90 lg:right-[-6%]">
                    <RecordDiagram />
                </div>
            </div>

            <div className="relative mx-auto max-w-5xl px-6">
                <motion.p
                    custom={0}
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    className="font-mono text-[10px] uppercase tracking-[0.24em] text-ink-500"
                >
                    Digital medical records — India, since 2019
                </motion.p>

                <motion.h1
                    custom={1}
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    className="mt-6 max-w-3xl font-display text-5xl leading-[1.02] tracking-tight text-ink sm:text-6xl lg:text-7xl"
                >
                    When you can&apos;t answer their questions,
                    <em className="italic text-alert"> your record can.</em>
                </motion.h1>

                <motion.p
                    custom={2}
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    className="mt-7 max-w-xl text-base leading-relaxed text-ink-700"
                >
                    Medix holds your medical history encrypted on your phone. In an
                    emergency, a responder scans one code and reads the four things that
                    change treatment — blood group, allergies, conditions, contacts.
                </motion.p>

                <motion.div
                    custom={3}
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3"
                >
                    <Link href="/register" className="bg-ink px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-alert">
                        Set up my card — free
                    </Link>
                    <a
                        href="#how-it-works"
                        className="border-b border-ink pb-0.5 text-sm text-ink transition-colors hover:border-alert hover:text-alert"
                    >
                        How access works
                    </a>
                    <Link
                        href="/hospital/scan"
                        className="inline-flex items-center gap-2 border-b border-ink-line pb-0.5 text-sm text-ink-700 transition-colors hover:border-alert hover:text-alert"
                    >
                        <CameraIcon className="h-4 w-4" />
                        I&apos;m a responder — scan a code
                    </Link>
                </motion.div>

                <div className="mt-16 grid gap-12 pb-16 lg:grid-cols-[1fr_auto] lg:items-end">
                    <motion.dl
                        custom={4}
                        variants={fadeUp}
                        initial="hidden"
                        animate="show"
                        className="grid max-w-xl grid-cols-2 border-t border-ink sm:grid-cols-4"
                    >
                        {stats.map((stat) => (
                            <div key={stat.label} className="border-b border-r border-ink-line px-4 py-4 first:pl-0 sm:border-b-0">
                                <dt className="font-display text-3xl leading-none text-ink">{stat.value}</dt>
                                <dd className="mt-2 text-[11px] leading-snug text-ink-500">{stat.label}</dd>
                            </div>
                        ))}
                    </motion.dl>

                    <div className="flex justify-start lg:justify-end">
                        <EmergencyCard />
                    </div>
                </div>
            </div>
        </section>
    );
}
