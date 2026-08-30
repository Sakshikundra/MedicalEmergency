import Link from 'next/link';

const groups = [
    {
        title: 'Product',
        links: [
            { label: 'Emergency card', href: '/#top' },
            { label: 'Records vault', href: '/records' },
            { label: 'Set up my card', href: '/register' },
            { label: 'Hospital scan', href: '/hospital/scan' },
        ],
    },
    {
        title: 'Access',
        links: [
            { label: 'Sign in', href: '/login' },
            { label: 'Create account', href: '/register' },
            { label: 'How it works', href: '/#how-it-works' },
            { label: 'Access & privacy', href: '/#security' },
        ],
    },
];

export function Footer() {
    return (
        <footer className="bg-paper py-14">
            <div className="mx-auto max-w-5xl px-6">
                <div className="grid gap-10 border-t border-ink pt-8 sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(2,1fr)]">
                    <div>
                        <p className="font-display text-2xl leading-none text-ink">Medix</p>
                        <p className="mt-3 max-w-[220px] text-sm leading-relaxed text-ink-500">
                            Medical records built for the moments you can&apos;t explain yourself.
                        </p>
                    </div>

                    {groups.map((group) => (
                        <nav key={group.title} aria-label={group.title}>
                            <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500">{group.title}</h2>
                            <ul className="mt-4 space-y-2">
                                {group.links.map((link) => (
                                    <li key={link.label}>
                                        <Link href={link.href} className="text-sm text-ink-700 transition-colors hover:text-alert">
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    ))}
                </div>

                <div className="mt-12 flex flex-col gap-2 border-t border-ink-line pt-5 font-mono text-[10px] text-ink-300 sm:flex-row sm:justify-between">
                    <p>© {new Date().getFullYear()} Medix Health Systems</p>
                    <p>Not a substitute for emergency services — call your local number first</p>
                </div>
            </div>
        </footer>
    );
}
