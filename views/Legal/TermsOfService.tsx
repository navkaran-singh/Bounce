import React from 'react';
import { LegalLayout } from './LegalLayout';

export const TermsOfService: React.FC = () => {
    return (
        <LegalLayout title="Terms of Service" lastUpdated="December 6, 2025">
            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">1. Acceptance of Terms</h2>
                <p className="text-gray-300 mb-4">
                    By accessing or using Bounce ("the Service"), you agree to be bound by these Terms
                    of Service. If you do not agree to these terms, please do not use our Service.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">2. Description of Service</h2>
                <p className="text-gray-300 mb-4">
                    Bounce is an AI-powered habit tracking application designed to help users build
                    and maintain healthy habits. The Service includes features such as personalized
                    habit recommendations, progress tracking, and weekly reviews.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">3. User Accounts</h2>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                    <li>You must provide accurate and complete information when creating an account</li>
                    <li>You are responsible for maintaining the security of your account credentials</li>
                    <li>You are responsible for all activities that occur under your account</li>
                    <li>You must notify us immediately of any unauthorized use of your account</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">4. Subscription and Billing</h2>
                <h3 className="text-lg font-medium mb-2 text-gray-200">4.1 Free and Premium Tiers</h3>
                <p className="text-gray-300 mb-4">
                    Bounce offers both free and premium subscription tiers. Premium features include
                    AI-powered daily habit adjustments, weekly reviews, and priority support.
                </p>

                <h3 className="text-lg font-medium mb-2 text-gray-200">4.2 Billing</h3>
                <p className="text-gray-300 mb-4">
                    Premium subscriptions are billed monthly. By subscribing, you authorize us to
                    charge your payment method on a recurring basis until you cancel.
                </p>

                <h3 className="text-lg font-medium mb-2 text-gray-200">4.3 Cancellation</h3>
                <p className="text-gray-300 mb-4">
                    You may cancel your subscription at any time. Upon cancellation, you will retain
                    access to premium features until the end of your current billing period.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">5. User Conduct</h2>
                <p className="text-gray-300 mb-4">You agree not to:</p>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                    <li>Use the Service for any illegal purpose</li>
                    <li>Attempt to gain unauthorized access to our systems</li>
                    <li>Interfere with or disrupt the Service</li>
                    <li>Share your account credentials with others</li>
                    <li>Use automated systems to access the Service without permission</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">6. Intellectual Property</h2>
                <p className="text-gray-300 mb-4">
                    All content, features, and functionality of the Service are owned by Bounce and
                    are protected by international copyright, trademark, and other intellectual
                    property laws.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">7. Disclaimer of Warranties</h2>
                <p className="text-gray-300 mb-4">
                    THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
                    EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED,
                    SECURE, OR ERROR-FREE.
                </p>
                <p className="text-gray-300 mb-4">
                    BOUNCE IS NOT A SUBSTITUTE FOR PROFESSIONAL MEDICAL OR MENTAL HEALTH ADVICE.
                    ALWAYS CONSULT WITH A QUALIFIED HEALTHCARE PROVIDER FOR MEDICAL CONCERNS.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">8. Limitation of Liability</h2>
                <p className="text-gray-300 mb-4">
                    TO THE MAXIMUM EXTENT PERMITTED BY LAW, BOUNCE SHALL NOT BE LIABLE FOR ANY
                    INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT
                    OF OR RELATED TO YOUR USE OF THE SERVICE.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">9. Changes to Terms</h2>
                <p className="text-gray-300 mb-4">
                    We reserve the right to modify these terms at any time. We will notify users of
                    significant changes via email or through the Service. Your continued use of the
                    Service after changes constitutes acceptance of the new terms.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">10. Governing Law</h2>
                <p className="text-gray-300 mb-4">
                    These Terms shall be governed by and construed in accordance with applicable laws,
                    without regard to conflict of law principles.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">11. Contact</h2>
                <p className="text-gray-300 mb-4">
                    For questions about these Terms, please contact us at:
                </p>
                <p className="text-cyan-400">
                    <a href="mailto:navkaransingh3110@gmail.com">navkaransingh3110@gmail.com</a>
                </p>
            </section>
        </LegalLayout>
    );
};
