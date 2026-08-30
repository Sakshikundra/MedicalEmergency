import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu as MenuIcon, X as XIcon } from 'lucide-react';

const links = [
    { label: 'How it works', href: '#how-it-works' },
    { label: 'What it holds', href: '#features' },
    { label: 'Access & privacy', href: '#security' },
];

export function Navbar() {
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <header
            className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-200 ${scrolled ? 'border-primary-100 bg-white/90 backdrop-blur-sm' : 'border-transparent bg-transparent'
                }`}
        >
            <nav aria-label="Main" className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
                <a href="#top" className="flex items-baseline gap-2">
                    <span className="font-display text-2xl leading-none tracking-tight text-ink">Medix</span>
                    <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500 sm:inline">
                        Emergency record
                    </span>
                </a>

                <ul className="hidden items-center gap-7 md:flex">
                    {links.map((link) => (
                        <li key={link.href}>
                            <a
                                href={link.href}
                                className="border-b border-transparent pb-0.5 text-sm text-ink-700 transition-colors hover:border-primary-600 hover:text-primary-700"
                            >
                                {link.label}
                            </a>
                        </li>
                    ))}
                    <li>
                        <Link
                            href="/login"
                            className="border-b border-transparent pb-0.5 text-sm text-ink-700 transition-colors hover:border-primary-600 hover:text-primary-700"
                        >
                            Sign in
                        </Link>
                    </li>
                    <li>
                        <Link
                            href="/register"
                            className="border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-600 hover:text-white"
                        >
                            Set up my card
                        </Link>
                    </li>
                </ul>

                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    aria-expanded={open}
                    aria-label={open ? 'Close menu' : 'Open menu'}
                    className="border border-ink-line p-2 text-ink md:hidden"
                >
                    {open ? <XIcon className="h-4 w-4" /> : <MenuIcon className="h-4 w-4" />}
                </button>
            </nav>

            {open && (
                <div className="border-t border-ink-line bg-paper px-6 py-4 md:hidden">
                    <ul className="divide-y divide-ink-line">
                        {links.map((link) => (
                            <li key={link.href}>
                                <a href={link.href} onClick={() => setOpen(false)} className="block py-3 text-sm text-ink-700">
                                    {link.label}
                                </a>
                            </li>
                        ))}
                        <li>
                            <Link href="/login" onClick={() => setOpen(false)} className="block py-3 text-sm text-ink-700">
                                Sign in
                            </Link>
                        </li>
                    </ul>
                    <Link
                        href="/register"
                        onClick={() => setOpen(false)}
                        className="mt-4 block border border-ink px-4 py-2.5 text-center text-sm font-medium text-ink"
                    >
                        Set up my card
                    </Link>
                </div>
            )}
        </header>
    );
}
