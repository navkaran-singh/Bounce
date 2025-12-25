import React from 'react';
import { LegalLayout } from './LegalLayout';

export const PrivacyPolicy: React.FC = () => {
    return (
        <LegalLayout title="Privacy Policy" lastUpdated="December 24, 2025">
            <section className="mb-8">
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6 mb-6">
                    <p className="text-gray-300">
                        Your privacy matters to us. This policy explains what data we collect,
                        why we need it, and how we keep it safe. TL;DR: We only collect what's
                        necessary to make Bounce work for you, and we never sell your data.
                    </p>
                </div>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">1. What We Collect</h2>

                <h3 className="text-lg font-medium mb-2 text-gray-200">Things you share with us:</h3>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                    <li>Your email (so you can sign in and we can reach you)</li>
                    <li>Your identity statement and goals (to personalize your habits)</li>
                    <li>Habit completions and progress (to track your journey)</li>
                    <li>Energy level preferences (to adapt habits to how you feel)</li>
                </ul>

                <h3 className="text-lg font-medium mb-2 text-gray-200">Things we collect automatically:</h3>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                    <li>Device type and OS (to make sure the app works on your device)</li>
                    <li>App usage patterns (to improve features you use most)</li>
                    <li>Crash reports (to fix bugs quickly)</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">2. How We Use Your Data</h2>
                <p className="text-gray-300 mb-4">We use your information to:</p>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                    <li>Make Bounce work (syncing your habits across devices)</li>
                    <li>Personalize AI recommendations based on your goals</li>
                    <li>Process payments and manage your subscription</li>
                    <li>Send you updates (only with your permission)</li>
                    <li>Improve the app based on how people use it</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">3. Services We Use</h2>
                <p className="text-gray-300 mb-4">Bounce works with trusted partners:</p>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                    <li><strong className="text-white">Firebase (Google):</strong> Keeps your data synced and secure</li>
                    <li><strong className="text-white">Google Gemini AI:</strong> Powers personalized habit recommendations</li>
                    <li><strong className="text-white">Dodo Payments:</strong> Handles payments securely (we never see your card details)</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">4. Keeping Your Data Safe</h2>
                <p className="text-gray-300 mb-4">
                    We use industry-standard security measures to protect your information.
                    Your data is encrypted in transit and at rest. That said, no system is 100% foolproof —
                    we're always working to stay ahead of potential threats.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">5. Your Data, Your Control</h2>
                <p className="text-gray-300 mb-4">You're in charge of your data. You can:</p>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                    <li>Access all your data anytime in the app</li>
                    <li>View your complete habit history and progress</li>
                    <li>Request account deletion by contacting us</li>
                </ul>
                <p className="text-gray-300">
                    For any data requests, email us at hello.bouncelife@gmail.com.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">6. Data Retention</h2>
                <p className="text-gray-300 mb-4">
                    We keep your data as long as you're using Bounce. If you request account deletion,
                    we'll remove your personal data within 30 days of your request.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">7. A Note for Parents</h2>
                <p className="text-gray-300 mb-4">
                    Bounce is designed for users 13 and older. We don't knowingly collect data from children
                    under 13. If you believe a child has signed up, please contact us and we'll remove their account.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">8. Questions?</h2>
                <p className="text-gray-300 mb-4">
                    Privacy questions? We're happy to explain anything:
                </p>
                <p className="text-cyan-400">
                    <a href="mailto:hello.bouncelife@gmail.com">hello.bouncelife@gmail.com</a>
                </p>
            </section>
        </LegalLayout>
    );
};
