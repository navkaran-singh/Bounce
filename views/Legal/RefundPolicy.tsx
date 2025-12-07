import React from 'react';
import { LegalLayout } from './LegalLayout';

export const RefundPolicy: React.FC = () => {
    return (
        <LegalLayout title="Refund Policy" lastUpdated="December 6, 2024">
            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">1. Overview</h2>
                <p className="text-gray-300 mb-4">
                    At Bounce, we want you to be completely satisfied with your subscription. This
                    Refund Policy outlines our practices regarding cancellations and refunds for our
                    premium subscription service.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">2. Subscription Cancellation</h2>
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4 mb-4">
                    <p className="text-cyan-300 font-medium">
                        Monthly subscriptions can be cancelled anytime.
                    </p>
                </div>
                <p className="text-gray-300 mb-4">
                    You may cancel your premium subscription at any time through your account settings
                    or by contacting our support team. Upon cancellation:
                </p>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                    <li>Your subscription will remain active until the end of the current billing period</li>
                    <li>You will not be charged for subsequent billing periods</li>
                    <li>You will retain access to all premium features until your subscription expires</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">3. Refund Eligibility</h2>
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
                    <p className="text-green-300 font-medium">
                        Refunds are processed within 7 days of receiving your complaint.
                    </p>
                </div>
                <p className="text-gray-300 mb-4">
                    You may be eligible for a refund if:
                </p>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                    <li>You experienced technical issues that prevented you from using the Service</li>
                    <li>You were charged incorrectly or multiple times</li>
                    <li>You request a refund within 7 days of your initial subscription purchase</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">4. How to Request a Refund</h2>
                <p className="text-gray-300 mb-4">
                    To request a refund, please contact our support team with:
                </p>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                    <li>Your account email address</li>
                    <li>Date of the charge</li>
                    <li>Reason for the refund request</li>
                    <li>Any relevant screenshots or documentation</li>
                </ul>
                <p className="text-gray-300 mb-4">
                    Send your request to:
                </p>
                <p className="text-cyan-400 text-lg">
                    <a href="mailto:support@bouncelife.me">support@bouncelife.me</a>
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">5. Refund Processing</h2>
                <p className="text-gray-300 mb-4">
                    Once your refund request is approved:
                </p>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                    <li>Refunds will be processed within 7 business days</li>
                    <li>The refund will be credited to your original payment method</li>
                    <li>It may take 5-10 additional business days for the refund to appear, depending on your payment provider</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">6. Non-Refundable Situations</h2>
                <p className="text-gray-300 mb-4">
                    Refunds may not be available if:
                </p>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                    <li>The refund request is made more than 30 days after the charge</li>
                    <li>You have previously received a refund for the same subscription</li>
                    <li>There is evidence of fraud or abuse of our refund policy</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">7. Contact Us</h2>
                <p className="text-gray-300 mb-4">
                    If you have any questions about our Refund Policy, please don't hesitate to reach out:
                </p>
                <p className="text-cyan-400">
                    <a href="mailto:support@bouncelife.me">support@bouncelife.me</a>
                </p>
            </section>
        </LegalLayout>
    );
};
