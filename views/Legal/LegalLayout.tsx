import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowLeft } from 'lucide-react';

interface LegalLayoutProps {
    title: string;
    lastUpdated: string;
    children: React.ReactNode;
}

export const LegalLayout: React.FC<LegalLayoutProps> = ({ title, lastUpdated, children }) => {
    return (
        <div className="min-h-screen bg-[#0F0F10] text-white">
            {/* Header */}
            <header className="px-6 py-4 border-b border-white/10">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold">Bounce</span>
                    </Link>
                    <Link
                        to="/"
                        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                </div>
            </header>

            {/* Content */}
            <main className="px-6 py-12">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-3xl font-bold mb-2">{title}</h1>
                    <p className="text-gray-500 text-sm mb-8">Last updated: {lastUpdated}</p>

                    <div className="prose prose-invert prose-gray max-w-none">
                        {children}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="px-6 py-8 border-t border-white/10 mt-12">
                <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
                    <Link to="/privacy" className="hover:text-white transition-colors">
                        Privacy Policy
                    </Link>
                    <Link to="/terms" className="hover:text-white transition-colors">
                        Terms of Service
                    </Link>
                    <Link to="/refund" className="hover:text-white transition-colors">
                        Refund Policy
                    </Link>
                    <Link to="/contact" className="hover:text-white transition-colors">
                        Contact
                    </Link>
                </div>
                <div className="text-center text-sm text-gray-500 mt-4">
                    © {new Date().getFullYear()} Bounce. All rights reserved.
                </div>
            </footer>
        </div>
    );
};
