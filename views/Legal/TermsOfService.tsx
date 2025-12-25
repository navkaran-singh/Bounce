import React from 'react';
import { LegalLayout } from './LegalLayout';

export const TermsOfService: React.FC = () => {
    return (
        <LegalLayout title="Terms of Service" lastUpdated="December 24, 2025">
            <section className="mb-8">
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-6 mb-6">
                    <p className="text-gray-300">
                        Welcome to Bounce! We've written these terms to be clear and fair.
                        Our goal is simple: help you build better habits while keeping everyone safe and happy.
                    </p>
                </div>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">1. Welcome to Bounce</h2>
                <p className="text-gray-300 mb-4">
                    By using Bounce, you're agreeing to these terms. We've tried to keep them straightforward —
                    if anything is unclear, just ask us at hello.bouncelife@gmail.com.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">2. What Bounce Does</h2>
                <p className="text-gray-300 mb-4">
                    Bounce is a resilience-first habit tracker that helps you build and maintain positive habits.
                    We offer personalized recommendations, progress tracking, and weekly insights to keep you motivated.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">3. Your Account</h2>
                <p className="text-gray-300 mb-4">
                    To get the most out of Bounce, you'll create an account. Here's the deal:
                </p>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                    <li>Keep your login details secure (we recommend a strong password)</li>
                    <li>Let us know if you notice any suspicious activity on your account</li>
                    <li>One account per person keeps things fair for everyone</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">4. Free & Premium</h2>
                <p className="text-gray-300 mb-4">
                    Bounce offers both free and premium tiers. Premium unlocks smart daily habit adaptations,
                    personalized weekly reviews, and more. You can upgrade to premium or cancel anytime.
                </p>
                <p className="text-gray-300 mb-4">
                    Premium subscriptions renew monthly. You can cancel anytime with one click in Settings.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">5. Be Kind</h2>
                <p className="text-gray-300 mb-4">
                    We're building a positive community. Please don't:
                </p>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                    <li>Use Bounce for anything illegal</li>
                    <li>Try to break or hack our systems</li>
                    <li>Share your account with others</li>
                    <li>Use bots or automated tools to access Bounce</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">6. Our Content</h2>
                <p className="text-gray-300 mb-4">
                    The Bounce app, design, and AI-generated content are our creation. Feel free to share
                    your progress and screenshots, but please don't copy or redistribute our app or its code.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">7. A Note on Expectations</h2>
                <p className="text-gray-300 mb-4">
                    We work hard to keep Bounce running smoothly, but like any technology, occasional hiccups may happen.
                    We're not perfect, but we're always improving.
                </p>
                <p className="text-gray-300 mb-4">
                    Also, while Bounce supports your wellbeing journey, it's not a replacement for professional
                    medical or mental health advice. Please reach out to qualified professionals for health concerns.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">8. Updates to These Terms</h2>
                <p className="text-gray-300 mb-4">
                    We may update these terms occasionally. If we make significant changes, we'll let you know
                    via email or an in-app notification. Continuing to use Bounce means you accept any updates.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">9. Questions?</h2>
                <p className="text-gray-300 mb-4">
                    We're real people and we'd love to hear from you:
                </p>
                <p className="text-cyan-400">
                    <a href="mailto:hello.bouncelife@gmail.com">hello.bouncelife@gmail.com</a>
                </p>
            </section>
        </LegalLayout>
    );
};
