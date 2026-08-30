import Head from 'next/head';
import { Navbar } from '../components/landing/Navbar';
import { Hero } from '../components/landing/Hero';
import { HowItWorks } from '../components/landing/HowItWorks';
import { Features } from '../components/landing/Features';
import { Security } from '../components/landing/Security';
import { CallToAction } from '../components/landing/CallToAction';
import { Footer } from '../components/landing/Footer';

export default function Home() {
    return (
        <>
            <Head>
                <title>MEDIX - Your Medical Records, Secure & Accessible</title>
                <meta
                    name="description"
                    content="Patient-owned digital medical records with AI-powered insights and instant emergency access"
                />
            </Head>

            <div className="min-h-screen w-full bg-paper font-sans text-ink antialiased">
                <Navbar />
                <main>
                    <Hero />
                    <HowItWorks />
                    <Features />
                    <Security />
                    <CallToAction />
                </main>
                <Footer />
            </div>
        </>
    );
}
