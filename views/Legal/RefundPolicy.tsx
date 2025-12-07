import React from 'react';
import { LegalLayout } from './LegalLayout';

export const RefundPolicy: React.FC = () => {
    return (
        <LegalLayout title="Refund Policy" lastUpdated="December 6, 2025">
            <section className="mb-8">
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 mb-6">
                    <h2 className="text-xl font-semibold text-amber-400 mb-3">Important Notice</h2>
                    <p className="text-gray-300">
                        Bounce is a digital service providing instant access to AI-powered habit coaching.
                        Please read this policy carefully before subscribing.
                    </p>
                </div>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">1. Digital Goods Policy</h2>
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
                    <p className="text-red-300 font-medium">
                        All sales are final. No refunds for digital access.
                    </p>
                </div>
                <p className="text-gray-300 mb-4">
                    Due to the nature of digital goods and services, once you subscribe to Bounce Premium,
                    you immediately receive access to all premium features. This instant delivery of digital
                    content means that we cannot offer refunds for completed transactions.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">2. Subscription Cancellation</h2>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4">
                    <p className="text-yellow-300 font-medium">
                        Cancellations stop future billing but do not refund past months.
                    </p>
                </div>
                <p className="text-gray-300 mb-4">
                    You may cancel your subscription at any time. When you cancel:
                </p>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                    <li>Your subscription will remain active until the end of your current billing period</li>
                    <li>You will not be charged for any future billing periods</li>
                    <li>No refunds will be issued for the current or any previous billing periods</li>
                    <li>You retain access to premium features until your paid period ends</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">3. How to Cancel</h2>
                <p className="text-gray-300 mb-4">
                    You can cancel your subscription at any time through:
                </p>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                    <li>Your account settings within the app</li>
                    <li>Contacting our support team at <a href="mailto:navkaransingh3110@gmail.com" className="text-cyan-400 hover:underline">navkaransingh3110@gmail.com</a></li>
                </ul>
                <p className="text-gray-300">
                    Cancellation requests are processed immediately, and you will receive a confirmation email.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">4. Exceptions</h2>
                <p className="text-gray-300 mb-4">
                    In exceptional circumstances, we may consider refunds on a case-by-case basis for:
                </p>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                    <li>Duplicate charges due to technical errors</li>
                    <li>Unauthorized transactions (with proper documentation)</li>
                    <li>Extended service outages preventing access to paid features</li>
                </ul>
                <p className="text-gray-300">
                    To request a review, please contact us with your account email, transaction details,
                    and a description of the issue.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">5. Free Trial</h2>
                <p className="text-gray-300 mb-4">
                    We encourage you to fully explore Bounce's free features before subscribing to Premium.
                    The free tier allows you to experience the core habit tracking functionality to ensure
                    the app meets your needs.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">6. Contact Us</h2>
                <p className="text-gray-300 mb-4">
                    If you have any questions about this Refund Policy, please contact us:
                </p>
                <p className="text-cyan-400 text-lg">
                    <a href="mailto:navkaransingh3110@gmail.com">navkaransingh3110@gmail.com</a>
                </p>
            </section>
        </LegalLayout>
    );
};
