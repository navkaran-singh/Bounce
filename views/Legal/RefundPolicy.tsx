import React from 'react';
import { LegalLayout } from './LegalLayout';

export const RefundPolicy: React.FC = () => {
    return (
        <LegalLayout title="Refund Policy" lastUpdated="December 24, 2025">
            <section className="mb-8">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 mb-6">
                    <h2 className="text-xl font-semibold text-emerald-400 mb-3">💚 Our Promise to You</h2>
                    <p className="text-gray-300">
                        We want you to love Bounce. If Premium isn't the right fit within your first 7 days,
                        we'll give you a full refund — no questions asked.
                    </p>
                </div>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">1. 7-Day Satisfaction Guarantee</h2>
                <p className="text-gray-300 mb-4">
                    We believe in earning your trust. If you're not completely satisfied with Bounce Premium
                    within the first 7 days of your initial subscription, simply reach out and we'll process
                    a full refund. We'd love to hear what we could do better!
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">2. Subscription Cancellation</h2>
                <p className="text-gray-300 mb-4">
                    Life changes, and we get it. You can cancel your subscription anytime with no hassle. Here's what happens:
                </p>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                    <li>You'll keep Premium access until the end of your current billing period</li>
                    <li>No future charges will be made</li>
                    <li>Your progress and data are always yours to keep</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">3. How to Cancel</h2>
                <p className="text-gray-300 mb-4">
                    Canceling is simple and takes less than a minute:
                </p>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                    <li>Open Settings in the app and tap "Cancel Subscription"</li>
                    <li>Or email us at <a href="mailto:hello.bouncelife@gmail.com" className="text-cyan-400 hover:underline">hello.bouncelife@gmail.com</a></li>
                </ul>
                <p className="text-gray-300">
                    You'll see a confirmation in the app once your cancellation is processed.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">4. Special Circumstances</h2>
                <p className="text-gray-300 mb-4">
                    We're humans too, and we understand things happen. We're happy to work with you on:
                </p>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                    <li>Accidental duplicate charges</li>
                    <li>Unauthorized transactions</li>
                    <li>Technical issues that prevented you from using Premium features</li>
                </ul>
                <p className="text-gray-300">
                    Just reach out with your account details and we'll make it right.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">5. Try Before You Buy</h2>
                <p className="text-gray-300 mb-4">
                    Not sure if Premium is for you? No pressure! Our free tier has everything you need
                    to start building habits. Take your time exploring before upgrading.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">6. Questions?</h2>
                <p className="text-gray-300 mb-4">
                    We're here to help. Reach out anytime:
                </p>
                <p className="text-cyan-400 text-lg">
                    <a href="mailto:hello.bouncelife@gmail.com">hello.bouncelife@gmail.com</a>
                </p>
            </section>
        </LegalLayout>
    );
};
