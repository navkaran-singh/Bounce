import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Shield, Calendar, Brain, Zap, ArrowRight, Star } from 'lucide-react';
import { Particles } from '../components/Particles';

export const LandingPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#0F0F10] text-white overflow-x-hidden relative">
            <Particles />

            {/* Navigation */}
            <nav className="relative z-10 px-6 py-4 flex justify-between items-center max-w-6xl mx-auto">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                        Bounce
                    </span>
                </div>
                <Link
                    to="/app"
                    className="px-5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-sm font-medium transition-all duration-300"
                >
                    Open App
                </Link>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 px-6 pt-16 pb-24 max-w-4xl mx-auto text-center">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm text-gray-300">AI-Powered Habit System</span>
                </div>

                {/* Main Headline */}
                <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                    Your AI{' '}
                    <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Executive Function
                    </span>{' '}
                    Coach
                </h1>

                {/* Subheadline */}
                <p className="text-xl md:text-2xl text-gray-400 mb-4 max-w-2xl mx-auto">
                    Stop the shame spiral. Build micro-habits that actually stick.
                </p>
                <p className="text-lg text-gray-500 mb-12 max-w-xl mx-auto">
                    ADHD-friendly habit tracking with AI that adapts to your energy levels.
                </p>

                {/* CTA Button */}
                <Link
                    to="/app"
                    className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full text-lg font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 hover:scale-105"
                >
                    Launch App
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>

                {/* Trust badges */}
                <div className="flex items-center justify-center gap-6 mt-8 text-sm text-gray-500">
                    <span className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-green-400" />
                        Secure & Private
                    </span>
                    <span className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        Works Offline
                    </span>
                </div>
            </section>

            {/* Features Section */}
            <section className="relative z-10 px-6 py-20 max-w-6xl mx-auto">
                <h2 className="text-3xl font-bold text-center mb-4">
                    Built for the{' '}
                    <span className="text-cyan-400">ADHD Brain</span>
                </h2>
                <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
                    Forget punishing streaks. Bounce uses compassionate AI to keep you moving forward.
                </p>

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Feature 1 */}
                    <div className="group p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:border-cyan-500/50 transition-all duration-300">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 flex items-center justify-center mb-4">
                            <Shield className="w-6 h-6 text-cyan-400" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Recovery Mode</h3>
                        <p className="text-gray-400">
                            Missed a day? No shame. Get gentle options to restart without losing your momentum.
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="group p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:border-purple-500/50 transition-all duration-300">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center mb-4">
                            <Calendar className="w-6 h-6 text-purple-400" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Sunday Ritual</h3>
                        <p className="text-gray-400">
                            Weekly review with your AI coach. Celebrate wins and plan the week ahead.
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="group p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:border-pink-500/50 transition-all duration-300">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-pink-500/5 flex items-center justify-center mb-4">
                            <Brain className="w-6 h-6 text-pink-400" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">AI Adjustments</h3>
                        <p className="text-gray-400">
                            Low energy? High energy? AI adapts your daily habits to match your current state.
                        </p>
                    </div>
                </div>
            </section>

            {/* Social Proof */}
            <section className="relative z-10 px-6 py-16 max-w-4xl mx-auto text-center">
                <div className="p-8 bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-3xl">
                    <p className="text-xl md:text-2xl text-gray-300 italic mb-6">
                        "Finally, an app that doesn't make me feel like garbage when I miss a day.
                        The AI actually gets it."
                    </p>
                    <div className="text-gray-500">
                        — ADHD user, after 3 weeks
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="relative z-10 px-6 py-20 max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold text-center mb-4">
                    Simple, Transparent Pricing
                </h2>
                <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
                    Start free, upgrade when you're ready for AI superpowers.
                </p>

                <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                    {/* Free Plan */}
                    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                        <h3 className="text-xl font-semibold mb-2">Free</h3>
                        <div className="text-3xl font-bold mb-4">$0<span className="text-lg text-gray-400 font-normal">/month</span></div>
                        <ul className="space-y-3 text-gray-300 mb-6">
                            <li className="flex items-center gap-2">
                                <span className="text-green-400">✓</span> Basic habit tracking
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-green-400">✓</span> Recovery Mode
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-green-400">✓</span> Energy level selection
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-green-400">✓</span> Progress stats
                            </li>
                        </ul>
                        <Link
                            to="/app"
                            className="block w-full py-3 text-center border border-white/20 rounded-full font-medium hover:bg-white/10 transition-colors"
                        >
                            Get Started
                        </Link>
                    </div>

                    {/* Premium Plan */}
                    <div className="p-6 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-2xl relative">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full text-xs font-semibold">
                            RECOMMENDED
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Premium</h3>
                        <div className="text-3xl font-bold mb-4">$5<span className="text-lg text-gray-400 font-normal">/month</span></div>
                        <ul className="space-y-3 text-gray-300 mb-6">
                            <li className="flex items-center gap-2">
                                <span className="text-cyan-400">✓</span> Everything in Free
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-cyan-400">✓</span> <strong>AI Daily Adjustments</strong>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-cyan-400">✓</span> <strong>Sunday Ritual Review</strong>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-cyan-400">✓</span> Smart habit generation
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-cyan-400">✓</span> Priority support
                            </li>
                        </ul>
                        <Link
                            to="/app"
                            className="block w-full py-3 text-center bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full font-semibold hover:opacity-90 transition-opacity"
                        >
                            Start Now
                        </Link>
                    </div>
                </div>

                <p className="text-center text-gray-500 text-sm mt-6">
                    Cancel anytime. No questions asked.
                </p>
            </section>

            {/* Final CTA */}
            <section className="relative z-10 px-6 py-20 max-w-4xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                    Ready to break the cycle?
                </h2>
                <Link
                    to="/app"
                    className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full text-lg font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 hover:scale-105"
                >
                    Get Started Free
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <p className="text-gray-500 mt-4 text-sm">
                    No credit card required. Cancel anytime.
                </p>
            </section>

            {/* Footer */}
            <footer className="relative z-10 px-6 py-12 border-t border-white/10">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold">Bounce</span>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
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

                    <div className="text-sm text-gray-500">
                        © {new Date().getFullYear()} Bounce. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
};
