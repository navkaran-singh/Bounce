import React from 'react';
import { LegalLayout } from './LegalLayout';

export const PrivacyPolicy: React.FC = () => {
    return (
        <LegalLayout title="Privacy Policy" lastUpdated="December 6, 2025">
            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">1. Introduction</h2>
                <p className="text-gray-300 mb-4">
                    Welcome to Bounce. We are committed to protecting your privacy
                    and ensuring the security of your personal information. This Privacy Policy explains
                    how we collect, use, disclose, and safeguard your information when you use our
                    mobile application and website (collectively, the "Service").
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">2. Information We Collect</h2>
                <h3 className="text-lg font-medium mb-2 text-gray-200">2.1 Information You Provide</h3>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                    <li>Email address (for account creation and authentication)</li>
                    <li>Your identity statement and personal goals</li>
                    <li>Habit tracking data and progress information</li>
                    <li>Energy level selections and preferences</li>
                </ul>

                <h3 className="text-lg font-medium mb-2 text-gray-200">2.2 Automatically Collected Information</h3>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                    <li>Device information (device type, operating system)</li>
                    <li>Usage data (features used, habits completed)</li>
                    <li>Log data and error reports</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">3. How We Use Your Information</h2>
                <p className="text-gray-300 mb-4">We use the information we collect to:</p>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                    <li>Provide, maintain, and improve our Service</li>
                    <li>Personalize your experience with AI-powered habit recommendations</li>
                    <li>Process your transactions and manage your subscription</li>
                    <li>Send you updates and promotional communications (with your consent)</li>
                    <li>Analyze usage patterns to improve our Service</li>
                    <li>Comply with legal obligations</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">4. Third-Party Services</h2>
                <p className="text-gray-300 mb-4">We use the following third-party services:</p>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                    <li><strong className="text-white">Firebase (Google):</strong> Authentication, database, and analytics</li>
                    <li><strong className="text-white">Google Gemini (AI Service):</strong> We use Google's Generative AI to process your habit data and identity to generate personalized recommendations. Data processed by the API is subject to Google's Cloud Data Processing Addendum.</li>
                    <li><strong className="text-white">Dodo Payments:</strong> Secure payment processing</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">5. Data Security</h2>
                <p className="text-gray-300 mb-4">
                    We implement appropriate technical and organizational security measures to protect
                    your personal information. However, no method of transmission over the Internet or
                    electronic storage is 100% secure.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">6. Data Retention</h2>
                <p className="text-gray-300 mb-4">
                    We retain your personal information for as long as your account is active or as
                    needed to provide you with our Service. You may request deletion of your account
                    and associated data at any time by contacting us.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">7. Your Rights</h2>
                <p className="text-gray-300 mb-4">Depending on your location, you may have the right to:</p>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                    <li>Access your personal data</li>
                    <li>Correct inaccurate data</li>
                    <li>Delete your data</li>
                    <li>Export your data</li>
                    <li>Opt-out of marketing communications</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">8. Children's Privacy</h2>
                <p className="text-gray-300 mb-4">
                    Our Service is not intended for children under 13. We do not knowingly collect
                    personal information from children under 13.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">9. Contact Us</h2>
                <p className="text-gray-300 mb-4">
                    If you have questions about this Privacy Policy, please contact us at:
                </p>
                <p className="text-cyan-400">
                    <a href="mailto:hello.bouncelife@gmail.com">hello.bouncelife@gmail.com</a>
                </p>
            </section>
        </LegalLayout>
    );
};
