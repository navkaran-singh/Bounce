import React from 'react';
import { LegalLayout } from './LegalLayout';
import { Mail, MapPin, MessageCircle } from 'lucide-react';

export const Contact: React.FC = () => {
    return (
        <LegalLayout title="Contact Us" lastUpdated="December 6, 2025">
            <section className="mb-8">
                <p className="text-gray-300 mb-8 text-lg">
                    We're here to help! If you have any questions, concerns, or feedback about Bounce,
                    please don't hesitate to reach out.
                </p>

                <div className="grid gap-6">
                    {/* Email */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                                <Mail className="w-6 h-6 text-cyan-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">Email Support</h3>
                                <p className="text-gray-400 mb-3">
                                    For general inquiries, technical support, or billing questions.
                                </p>
                                <a
                                    href="mailto:navkaransingh3110@gmail.com"
                                    className="text-cyan-400 hover:text-cyan-300 transition-colors text-lg font-medium"
                                >
                                    navkaransingh3110@gmail.com
                                </a>
                                <p className="text-gray-500 text-sm mt-2">
                                    We typically respond within 24-48 hours.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Response Time */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                                <MessageCircle className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">What to Include</h3>
                                <p className="text-gray-400 mb-3">
                                    To help us assist you faster, please include:
                                </p>
                                <ul className="list-disc list-inside text-gray-400 space-y-1">
                                    <li>Your account email</li>
                                    <li>Description of your issue or question</li>
                                    <li>Device and browser/app version (if technical issue)</li>
                                    <li>Screenshots (if applicable)</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Physical Address */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                                <MapPin className="w-6 h-6 text-pink-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">Business Address</h3>
                                <p className="text-gray-400 mb-3">
                                    For official correspondence:
                                </p>
                                <address className="text-gray-300 not-italic">
                                    Bounce (Operated by Navkaran Singh)<br />
                                    House No 2890, Sector 38C, 160014<br />
                                    Chandigarh, India<br />
                                    {/* India */}
                                </address>
                                <p className="text-gray-500 text-sm mt-3">
                                    Please note: For faster support, we recommend contacting us via email.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* <section className="mt-12 text-center">
                <div className="inline-block bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-white/10 rounded-2xl p-8">
                    <h3 className="text-xl font-semibold text-white mb-2">Premium Support</h3>
                    <p className="text-gray-400 mb-4">
                        Premium subscribers receive priority support with faster response times.
                    </p>
                    <a
                        href="/app"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full text-white font-medium hover:opacity-90 transition-opacity"
                    >
                        Upgrade to Premium
                    </a>
                </div>
            </section> */}
        </LegalLayout>
    );
};
