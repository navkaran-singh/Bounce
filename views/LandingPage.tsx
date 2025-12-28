import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Shield, Zap, ArrowRight, Anchor, RefreshCw, Activity, Brain, Check, Info, X, RotateCcw, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Particles } from '../components/Particles';
import ScrollStory from './ScrollStory';

// --- 1. THE ORB COMPONENT (Matched to your Orb.tsx) ---
interface OrbProps {
    state: 'frozen' | 'healing' | 'success';
    size?: number;
    isFractured?: boolean;
}

const IntegratedOrb: React.FC<OrbProps> = ({ state, size = 300, isFractured = false }) => {
    // Exact colors from your Orb.tsx file
    const getColors = () => {
        switch (state) {
            case 'frozen':
                return ['#a5f3fc', '#67e8f9', '#0e7490']; // Icy blue-white
            case 'healing':
                return ['#6366f1', '#8b5cf6', '#4f46e5']; // Purple/Indigo
            case 'success':
                return ['#E0F2FE', '#0EA5E9', '#0284C7']; // White/Bright Blue (Corrected)
            default:
                return ['#0dccf2', '#00BFFF', '#7F00FF'];
        }
    };

    const colors = getColors();

    // Loop Animations (The "Breathing")
    const variants: Variants = {
        frozen: { scale: [1, 0.99, 1], filter: "brightness(0.9) saturate(0.6)", opacity: 0.9, transition: { duration: 6, repeat: Infinity, ease: "easeInOut" } },
        healing: { scale: [1, 1.02, 1], filter: "brightness(1) saturate(1.1)", opacity: 1, transition: { duration: 5, repeat: Infinity, ease: "easeInOut" } },
        success: { scale: [1, 1.03, 1], filter: "brightness(1.1) saturate(1.2)", opacity: 1, transition: { duration: 4, repeat: Infinity, ease: "easeInOut" } }
    };

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>

            {/* 1. The Ripple Effect (Announcement of change) 
                "Key" ensures this remounts and replays whenever state changes.
                This is the "Lighter" creative touch.
            */}
            <motion.div
                key={state + '_ripple'}
                className="absolute inset-0 rounded-full border border-white/10"
                style={{ borderColor: colors[1] + '40' }} // Subtle tint using hex+alpha
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1.4, opacity: 0 }}
                transition={{ duration: 2, ease: "easeOut" }}
            />

            {/* 2. Dynamic Background Glow (Slow Drift) */}
            <motion.div
                className="absolute inset-0 rounded-full blur-[80px] z-0"
                animate={{
                    background: `radial-gradient(circle, ${colors[1]}40 0%, ${colors[2]}10 70%, transparent 100%)`,
                    opacity: 0.6
                }}
                transition={{ duration: 2, ease: "easeInOut" }}
            />

            {/* 3. The Main Orb (Stable Container, Smooth Morph) */}
            <motion.div
                className="w-full h-full rounded-full relative overflow-hidden backdrop-blur-sm z-10"
                style={{
                    background: `linear-gradient(135deg, ${colors[0]}20, ${colors[1]}40)`,
                    boxShadow: `inset -10px -10px 40px ${colors[2]}40, inset 10px 10px 40px ${colors[0]}60`,
                    border: isFractured ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.15)',
                    // CSS transitions handle the smooth color morphing between states
                    transition: 'background 2s ease-in-out, box-shadow 2s ease-in-out, border 2s ease-in-out'
                }}
                variants={variants}
                animate={state}
            >
                {/* Fractures for Frozen State */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isFractured && state !== 'success' ? 0.6 : 0 }}
                    transition={{ duration: 1.5 }}
                    className="absolute inset-0 pointer-events-none z-20"
                >
                    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
                        <path d="M55,0 L52,15 L58,30 L45,50 L52,75 L48,100" stroke="white" strokeWidth="0.5" fill="none" />
                        <path d="M45,50 L20,45 L5,60 M58,30 L80,35" stroke="white" strokeWidth="0.3" fill="none" />
                    </svg>
                </motion.div>

                {/* Noise Texture */}
                <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-cover" />

                {/* Core Pulse (Inner Soul) */}
                <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
                    style={{ background: colors[0] }}
                    animate={{
                        opacity: [0.3, 0.5, 0.3],
                        scale: [0.9, 1.1, 0.9],
                        width: '66%', height: '66%'
                    }}
                    transition={{
                        // The background color transition is implicit via re-render of style prop + React reconciliation, 
                        // or we can add explicit transition. FM handles style prop changes nicely.
                        // But let's sync the pulse to the state.
                        duration: 4, repeat: Infinity, ease: 'easeInOut'
                    }}
                />
            </motion.div>
        </div>
    );
};

// --- 2. BACKGROUND & GRID COMPONENT ---
const BackgroundEnvironment = () => (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* The Grid Pattern (Referencing your screenshot) */}
        <div
            className="absolute inset-0 opacity-[0.15]"
            style={{
                backgroundImage: `linear-gradient(to right, #808080 1px, transparent 1px),
                                  linear-gradient(to bottom, #808080 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
                maskImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, black 40%, transparent 100%)'
            }}
        />

        {/* Deep Atmospheric Glows */}
        <div className="absolute top-[-20%] left-[20%] w-[800px] h-[800px] bg-purple-900/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-cyan-900/10 blur-[100px] rounded-full mix-blend-screen" />
    </div>
);

const FeatureVisual = ({ type }: { type: 'safety' | 'energy' | 'identity' | 'friction' }) => {
    // 1. Safety: A graph line that dips and bounces back
    if (type === 'safety') {
        return (
            <div className="relative w-full h-32 bg-white/5 rounded-lg border border-white/5 overflow-hidden flex items-end px-4 pb-4">
                {/* Grid lines */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]" />

                {/* The Bounce Line */}
                <svg className="w-full h-full absolute inset-0 visible overflow-visible" preserveAspectRatio="none">
                    <motion.path
                        d="M0,50 Q40,50 60,80 Q80,110 100,60 T200,30"
                        fill="none"
                        stroke="#22d3ee"
                        strokeWidth="3"
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        whileInView={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 2, ease: "easeInOut", repeat: Infinity, repeatDelay: 3 }}
                    />
                    {/* The "Crash" Point */}
                    <motion.circle cx="80" cy="95" r="4" fill="#ef4444"
                        initial={{ scale: 0 }} whileInView={{ scale: 1 }} transition={{ delay: 1 }}
                    />
                    {/* The "Bounce" Point */}
                    <motion.circle cx="160" cy="45" r="4" fill="#22d3ee"
                        initial={{ scale: 0 }} whileInView={{ scale: 1 }} transition={{ delay: 1.5 }}
                    />
                </svg>
                <div className="absolute top-2 right-2 text-[10px] font-mono text-cyan-400 bg-cyan-900/30 px-2 py-0.5 rounded">RESILIENCE DETECTED</div>
            </div>
        );
    }

    // 2. Energy: A battery or slider changing levels
    if (type === 'energy') {
        return (
            <div className="relative w-full h-32 flex flex-col justify-center items-center gap-3 bg-white/5 rounded-lg border border-white/5">
                {['High Energy', 'Medium Energy', 'Low Energy'].map((level, i) => (
                    <motion.div
                        key={i}
                        className={`w-3/4 h-6 rounded-full border border-white/10 flex items-center px-2 relative overflow-hidden`}
                        initial={{ opacity: 0.3 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ delay: i * 0.5, duration: 0.5 }}
                    >
                        <motion.div
                            className={`absolute inset-0 ${i === 0 ? 'bg-green-500/20' : i === 1 ? 'bg-yellow-500/20' : 'bg-red-500/20'}`}
                            animate={{ width: ['0%', '100%'] }}
                            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
                        />
                        <span className="relative z-10 text-[10px] uppercase font-bold text-white/70">{level}</span>
                    </motion.div>
                ))}
            </div>
        );
    }

    // 3. Identity: An evolving badge
    if (type === 'identity') {
        return (
            <div className="relative w-full h-32 flex items-center justify-center bg-white/5 rounded-lg border border-white/5">
                <div className="relative">
                    <motion.div
                        className="absolute inset-0 bg-purple-500/30 blur-xl rounded-full"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 3, repeat: Infinity }}
                    />
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg border border-white/20 relative z-10">
                        <Brain className="text-white" size={32} />
                    </div>
                    {/* Floating badges */}
                    <motion.div animate={{ y: [-5, 5, -5] }} transition={{ duration: 4, repeat: Infinity }} className="absolute -right-8 -top-4 bg-black/80 border border-purple-500/50 px-2 py-1 rounded text-[10px] text-purple-200 backdrop-blur-md">
                        Initiation
                    </motion.div>
                    <motion.div animate={{ y: [5, -5, 5] }} transition={{ duration: 5, repeat: Infinity }} className="absolute -left-8 -bottom-4 bg-black/80 border border-purple-500/50 px-2 py-1 rounded text-[10px] text-purple-200 backdrop-blur-md">
                        Expansion
                    </motion.div>
                </div>
            </div>
        );
    }

    // 4. Friction: Voice wave
    if (type === 'friction') {
        return (
            <div className="relative w-full h-32 flex items-center justify-center bg-white/5 rounded-lg border border-white/5 gap-1">
                {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((h, i) => (
                    <motion.div
                        key={i}
                        className="w-2 rounded-full bg-emerald-400"
                        animate={{ height: [10, h * 8, 10] }}
                        transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
                    />
                ))}
                <div className="absolute bottom-2 text-[10px] text-emerald-400/70 font-mono tracking-widest">VOCAL LOGGING ACTIVE</div>
            </div>
        );
    }
    return null;
}

// --- FAQ ITEM COMPONENT ---
const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <motion.div
            initial={false}
            className="border border-white/10 rounded-2xl overflow-hidden bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-5 flex items-center justify-between text-left"
            >
                <span className="font-medium text-white pr-4">{question}</span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                        <path d="M6 9l6 6 6-6" />
                    </svg>
                </motion.div>
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="px-6 pb-5 text-gray-400 leading-relaxed">
                            {answer}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// --- MOBILE NAVIGATION SIDEBAR ---
const MobileNav: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const sections = [
        { id: 'hero', label: 'Home' },
        { id: 'comparison', label: 'Why Bounce' },
        { id: 'how-it-works', label: 'How It Works' },
        { id: 'pricing', label: 'Pricing' },
        { id: 'faq', label: 'FAQ' },
    ];

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    />
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed left-0 top-0 bottom-0 w-64 bg-[#0A0A0C] border-r border-white/10 z-50 md:hidden"
                    >
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-2">
                                    <img src="/pwa-192x192.png" alt="Bounce" className="w-8 h-8 rounded-lg" />
                                    <span className="font-bold text-white">Bounce</span>
                                </div>
                                <button onClick={onClose} className="p-2 text-gray-400 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>
                            <nav className="space-y-2">
                                {sections.map((section) => (
                                    <button
                                        key={section.id}
                                        onClick={() => scrollToSection(section.id)}
                                        className="w-full text-left px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                                    >
                                        {section.label}
                                    </button>
                                ))}
                            </nav>
                            <div className="mt-8 pt-8 border-t border-white/10">
                                <Link
                                    to="/app"
                                    className="block w-full text-center px-4 py-3 bg-white text-black rounded-xl font-semibold hover:bg-gray-100 transition-colors"
                                >
                                    Get Started
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};


// --- 3. MAIN PAGE ---

export const LandingPage: React.FC = () => {
    const [orbState, setOrbState] = useState<'frozen' | 'healing' | 'success'>('frozen');
    const [showInfoTooltip, setShowInfoTooltip] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    // Cycle through states to tell the story visually
    useEffect(() => {
        const cycle = [
            { state: 'frozen', duration: 5000 },
            { state: 'healing', duration: 5000 },
            { state: 'success', duration: 5000 }
        ];
        let index = 0;
        const interval = setInterval(() => {
            index = (index + 1) % cycle.length;
            setOrbState(cycle[index].state as any);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const fadeInUp = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
    };

    return (
        <div className="min-h-screen bg-[#050507] text-white overflow-x-hidden font-sans selection:bg-purple-500/30">
            <Particles />
            <BackgroundEnvironment />
            <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

            {/* Nav */}
            <nav
                className={`fixed top-0 w-full z-50 border-b border-white/5 bg-[#050507]/80 backdrop-blur-md transition-transform duration-300`}
            >
                <div className="px-6 py-4 flex justify-between items-center max-w-7xl mx-auto">
                    <div className="flex items-center gap-3">
                        {/* Mobile hamburger */}
                        <button
                            onClick={() => setMobileNavOpen(true)}
                            className="md:hidden p-2 -ml-2 text-gray-400 hover:text-white"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 12h18M3 6h18M3 18h18" />
                            </svg>
                        </button>
                        <img src="/pwa-192x192.png" alt="Bounce" className="w-8 h-8 rounded-lg" />
                        <span className="font-bold tracking-tight text-gray-200">Bounce</span>
                    </div>
                    <Link to="/app" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Open App</Link>
                </div>
            </nav>

            {/* HERO SECTION */}
            <section id="hero" className="relative z-10 pt-32 pb-12 px-6 max-w-7xl mx-auto md:min-h-screen md:flex md:items-center">
                <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center w-full">

                    {/* LEFT COLUMN: Text */}
                    <div className="text-center md:text-left w-full md:w-1/2 relative z-20 order-1">
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={fadeInUp}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-6 backdrop-blur-sm"
                        >
                            <Sparkles className="w-3 h-3 text-cyan-400" />
                            <span className="text-xs font-medium text-gray-300 tracking-wide uppercase">Built for ADHD. Works for everyone.</span>
                        </motion.div>

                        <motion.h1
                            initial="hidden"
                            animate="visible"
                            variants={fadeInUp}
                            className="text-5xl lg:text-7xl font-bold mb-6 tracking-tight leading-[1.1]"
                        >
                            Building habits is easy. <br />
                            <span className="bg-gradient-to-r from-cyan-200 via-white to-purple-200 bg-clip-text text-transparent">
                                Until you miss a day.
                            </span>
                        </motion.h1>

                        <motion.p
                            initial="hidden"
                            animate="visible"
                            variants={fadeInUp}
                            className="text-xl text-gray-400 mb-8 max-w-xl mx-auto md:mx-0 leading-relaxed"
                        >
                            Most apps treat a slip-up like a failure. <br className="hidden md:block" />
                            Bounce treats it like data.
                        </motion.p>

                        {/* DESKTOP BUTTON */}
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={fadeInUp}
                            className="hidden md:flex flex-col sm:flex-row items-center md:items-start gap-4"
                        >
                            <Link
                                to="/app"
                                className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full text-white font-bold text-lg shadow-[0_0_50px_-10px_rgba(139,92,246,0.3)] hover:shadow-[0_0_50px_-5px_rgba(6,182,212,0.4)] transition-all transform hover:scale-105"
                            >
                                Try It Free
                            </Link>
                            <div className="flex items-center gap-2 px-4 py-4 text-sm text-gray-500">
                                <Check size={16} className="text-emerald-500" />
                                <span>No credit card required</span>
                            </div>
                        </motion.div>
                    </div>

                    {/* RIGHT COLUMN: Orb (Middle on Mobile) */}
                    <div className="w-full md:w-1/2 flex flex-col items-center justify-center relative z-10 order-2">
                        {/* Layout Adjustment: 
                           On Mobile: Negative margins pull it closer to text above and button below.
                           On Desktop: Standard padding.
                        */}
                        <div className="relative scale-90 md:scale-100 lg:scale-110 -my-4 md:my-0">
                            <IntegratedOrb
                                state={orbState}
                                isFractured={orbState === 'frozen'}
                                size={window.innerWidth < 768 ? 260 : 400}
                            />

                            {/* Status Pill */}
                            <div className="absolute -bottom-14 md:-bottom-12 left-0 right-0 flex justify-center z-20">
                                <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-white/10 bg-black/40 backdrop-blur-md shadow-2xl">
                                    <div className="relative w-2 h-2">
                                        <AnimatePresence mode="wait">
                                            {orbState === 'frozen' && <motion.div key="f" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute inset-0 rounded-full bg-cyan-200 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />}
                                            {orbState === 'healing' && <motion.div key="h" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute inset-0 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.8)]" />}
                                            {orbState === 'success' && <motion.div key="s" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute inset-0 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]" />}
                                        </AnimatePresence>
                                    </div>

                                    <div className="h-4 overflow-hidden relative w-32 flex items-center justify-start">
                                        <AnimatePresence mode="wait">
                                            <motion.span
                                                key={orbState}
                                                initial={{ y: 20, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                exit={{ y: -20, opacity: 0 }}
                                                transition={{ duration: 0.4, ease: "backOut" }}
                                                className="text-xs font-mono tracking-widest uppercase text-gray-300 absolute left-0"
                                            >
                                                State: {orbState}
                                            </motion.span>
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* MOBILE BUTTON (Visible only on Mobile, below Orb) */}
                    <div className="w-full md:hidden order-3 mt-10 flex justify-center pb-8 relative z-30">
                        <Link
                            to="/app"
                            className="w-full max-w-xs px-10 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full text-white font-bold text-lg shadow-[0_0_40px_-10px_rgba(139,92,246,0.4)] text-center"
                        >
                            Try It Free
                        </Link>
                    </div>

                </div>
            </section>

            {/* COMPARISON SECTION */}
            <section id="comparison" className="relative z-10 py-16 md:py-24 px-6 bg-[#050507]/50">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12 md:mb-20">
                        <h2 className="text-3xl font-bold mb-4">If habit apps haven't worked for you, you're not alone.</h2>
                        <p className="text-gray-400">Most were designed for consistency — not fluctuation.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
                        {/* THE BAD SIDE */}
                        <div className="relative group">
                            <div className="absolute inset-0 bg-red-500/5 blur-2xl group-hover:bg-red-500/10 transition-colors" />
                            <div className="relative p-6 md:p-8 rounded-3xl border border-red-500/20 bg-[#0A0505] backdrop-blur-xl h-full flex flex-col">
                                <div className="flex items-center justify-between mb-8 pb-4 border-b border-red-500/20">
                                    <div className="flex items-center gap-2 text-red-400 font-mono text-sm">
                                        <Activity size={16} /> SYSTEM FAILURE
                                    </div>
                                    <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">The Streak Method</h3>
                                <p className="text-red-300/60 mb-8 text-sm">Works for some, breaks for others</p>
                                <div className="space-y-4 flex-1">
                                    {['"I missed yesterday, so why even try today?"', 'Opening the app after a bad week feels heavy', 'Tracking can start to feel like evidence against you'].map((item, i) => (
                                        <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-red-900/10 border border-red-500/10">
                                            <X size={18} className="text-red-500 shrink-0" />
                                            <span className="text-gray-400 text-sm">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* THE GOOD SIDE */}
                        <div className="relative group">
                            <div className="absolute inset-0 bg-cyan-500/20 blur-3xl group-hover:bg-cyan-500/30 transition-colors" />
                            <div className="relative p-6 md:p-8 rounded-3xl border border-cyan-500/40 bg-[#050A0F] backdrop-blur-xl h-full flex flex-col shadow-2xl shadow-cyan-900/20">
                                <div className="flex items-center justify-between mb-8 pb-4 border-b border-cyan-500/20">
                                    <div className="flex items-center gap-2 text-cyan-400 font-mono text-sm">
                                        <Shield size={16} /> SYSTEM OPTIMAL
                                    </div>
                                    <div className="flex gap-1">
                                        <div className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                                        <div className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                                        <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">The Resilience Method</h3>
                                <p className="text-cyan-300/60 mb-8 text-sm">Bounce</p>
                                <div className="space-y-4 flex-1">
                                    {[
                                        { text: 'Missing a day opens a gentle restart flow', icon: RefreshCw },
                                        { text: 'On harder days, the app quietly asks less', icon: Zap },
                                        { text: '"I\'m becoming someone who does this."', icon: Anchor }
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-cyan-900/20 border border-cyan-500/20 group-hover:border-cyan-500/40 transition-colors">
                                            <div className="p-1 rounded bg-cyan-500/20 text-cyan-400">
                                                <item.icon size={14} />
                                            </div>
                                            <span className="text-white text-sm font-medium">{item.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* NEW: The Bridge / Micro-CTA */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="flex justify-center mt-16"
                    >
                        <button
                            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                            className="group flex flex-col items-center gap-3 text-sm font-medium text-gray-500 hover:text-white transition-colors"
                        >
                            <span>See how the system adapts</span>
                            <div className="p-2 rounded-full bg-white/5 border border-white/10 group-hover:border-cyan-500/50 group-hover:bg-cyan-500/10 transition-all">
                                <ArrowRight className="w-4 h-4 rotate-90 text-gray-400 group-hover:text-cyan-400" />
                            </div>
                        </button>
                    </motion.div>
                </div>
            </section>

            {/* HOW IT WORKS - VISUAL UPGRADE */}
            <section id="how-it-works" className="relative z-10 py-24 px-6 border-t border-white/5 bg-[#050507]">
                <div className="max-w-6xl mx-auto">

                    {/* HEADER */}
                    <div className="text-center mb-20">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            className="inline-block px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-medium text-gray-300 mb-6"
                        >
                            HOW IT WORKS
                        </motion.div>
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                            The <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">Anti-Rigid</span> System
                        </h2>
                        <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                            Most apps break when you break. Bounce is designed to flex.
                        </p>
                    </div>

                    {/* THE FLOW GRID (Inspo: GoAtlas Layout) */}
                    <div className="relative grid md:grid-cols-2 gap-8 lg:gap-12">

                        {/* Connecting Line (Desktop Only) - The "GoAtlas" Thread */}
                        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent -translate-x-1/2 z-0" />

                        {/* CARD 1: SAFETY */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="relative z-10 group"
                        >
                            <div className="absolute -left-4 md:-right-12 top-8 w-8 h-8 rounded-full bg-[#050507] border border-cyan-500/30 flex items-center justify-center text-xs text-cyan-500 font-mono z-20 hidden md:flex">01</div>

                            <div className="h-full p-1 rounded-3xl bg-gradient-to-b from-white/10 to-transparent">
                                <div className="h-full bg-[#0A0A0C] rounded-[22px] p-6 md:p-8 border border-white/5 hover:border-cyan-500/30 transition-colors">
                                    <div className="mb-6">
                                        <FeatureVisual type="safety" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                        <RefreshCw size={20} className="text-cyan-400" />
                                        The Safety Net
                                    </h3>
                                    <p className="text-gray-400 text-sm leading-relaxed mb-4">
                                        When you miss a day, typical apps shame you with a broken streak. Bounce enters <strong>Recovery Mode</strong>, giving you easier tasks to regain momentum without guilt.
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="text-[10px] px-2 py-1 rounded bg-cyan-900/20 text-cyan-300 border border-cyan-500/20">Auto-Recovery</span>
                                        <span className="text-[10px] px-2 py-1 rounded bg-white/5 text-gray-400 border border-white/5">No Zero Days</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* CARD 2: ENERGY (Offset for ZigZag) */}
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="relative z-10 md:mt-24 group"
                        >
                            <div className="absolute -left-12 top-8 w-8 h-8 rounded-full bg-[#050507] border border-yellow-500/30 flex items-center justify-center text-xs text-yellow-500 font-mono z-20 hidden md:flex">02</div>

                            <div className="h-full p-1 rounded-3xl bg-gradient-to-b from-white/10 to-transparent">
                                <div className="h-full bg-[#0A0A0C] rounded-[22px] p-6 md:p-8 border border-white/5 hover:border-yellow-500/30 transition-colors">
                                    <div className="mb-6">
                                        <FeatureVisual type="energy" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                        <Zap size={20} className="text-yellow-400" />
                                        Energy Regulation
                                    </h3>
                                    <p className="text-gray-400 text-sm leading-relaxed mb-4">
                                        You aren't a robot. Toggle between <strong>High, Medium, and Low</strong> energy days. The app adjusts your targets instantly so you can succeed even on your worst days.
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="text-[10px] px-2 py-1 rounded bg-yellow-900/20 text-yellow-300 border border-yellow-500/20">Dynamic Targets</span>
                                        <span className="text-[10px] px-2 py-1 rounded bg-white/5 text-gray-400 border border-white/5">Burnout Prevention</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* CARD 3: IDENTITY */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="relative z-10 group"
                        >
                            <div className="absolute -right-12 top-8 w-8 h-8 rounded-full bg-[#050507] border border-purple-500/30 flex items-center justify-center text-xs text-purple-500 font-mono z-20 hidden md:flex">03</div>

                            <div className="h-full p-1 rounded-3xl bg-gradient-to-b from-white/10 to-transparent">
                                <div className="h-full bg-[#0A0A0C] rounded-[22px] p-6 md:p-8 border border-white/5 hover:border-purple-500/30 transition-colors">
                                    <div className="mb-6">
                                        <FeatureVisual type="identity" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                        <Anchor size={20} className="text-purple-400" />
                                        Identity Evolution
                                    </h3>
                                    <p className="text-gray-400 text-sm leading-relaxed mb-4">
                                        Stop trying to do 10 things at once. Bounce builds around a <strong>single Identity</strong>—like becoming a "Runner" or a "Writer". All habits reinforce who you're becoming, not just what you're doing.
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="text-[10px] px-2 py-1 rounded bg-purple-900/20 text-purple-300 border border-purple-500/20">Weekly Review</span>
                                        <span className="text-[10px] px-2 py-1 rounded bg-white/5 text-gray-400 border border-white/5">Habit Rotations</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* CARD 4: FRICTION (Offset) */}
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="relative z-10 md:mt-24 group"
                        >
                            <div className="absolute -left-12 top-8 w-8 h-8 rounded-full bg-[#050507] border border-emerald-500/30 flex items-center justify-center text-xs text-emerald-500 font-mono z-20 hidden md:flex">04</div>

                            <div className="h-full p-1 rounded-3xl bg-gradient-to-b from-white/10 to-transparent">
                                <div className="h-full bg-[#0A0A0C] rounded-[22px] p-6 md:p-8 border border-white/5 hover:border-emerald-500/30 transition-colors">
                                    <div className="mb-6">
                                        <FeatureVisual type="friction" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                        <Activity size={20} className="text-emerald-400" />
                                        Friction Removal
                                    </h3>
                                    <p className="text-gray-400 text-sm leading-relaxed mb-4">
                                        Too tired to type? Use <strong>Voice Logging</strong>. Overwhelmed? Set your energy to <strong>Low</strong>, and the app shifts to show only what matters.</p>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="text-[10px] px-2 py-1 rounded bg-emerald-900/20 text-emerald-300 border border-emerald-500/20">Voice AI</span>
                                        <span className="text-[10px] px-2 py-1 rounded bg-white/5 text-gray-400 border border-white/5">Focus Mode</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                    </div>
                </div>
            </section>

            {/* <ScrollStory /> */}

            {/* PRICING */}
            <section id="pricing" className="relative z-10 py-16 md:py-24 px-6 border-t border-white/5 bg-gradient-to-b from-transparent to-[#050507]/50">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Start without pressure</h2>
                        <p className="text-gray-400 max-w-xl mx-auto">Upgrade when you're ready. No tricks. No "trial panic". No punishment for stopping.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {/* Free Plan */}
                        <div className="p-8 rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                            <h3 className="text-xl font-semibold mb-1 text-gray-400">Free</h3>
                            <p className="text-sm text-gray-500 mb-4">A safe place to start</p>
                            <div className="text-4xl font-bold mb-6 text-white">$0<span className="text-lg text-gray-500 font-normal"> / forever</span></div>
                            <ul className="space-y-4 mb-8 text-gray-300">
                                {[
                                    { label: 'Recovery Mode', benefit: 'Gentle restart after slips' },
                                    { label: 'Manual Energy', benefit: 'Set High/Medium/Low days' },
                                    { label: 'Never Miss Twice', benefit: 'Gentle nudge before momentum fades' },
                                    { label: 'Resilience Score', benefit: 'Track bounce rate, not streaks' },
                                    { label: 'Voice Logging', benefit: 'Quick voice notes' },
                                    { label: 'Calming Soundscape', benefit: 'Rain, forest, wind & more' },
                                    { label: 'New Habits On Stage Progression', benefit: 'New habits unlocked as you progress' },
                                    { label: 'Edit Habits', benefit: 'Edit your habits at any time' },
                                ].map((item) => (
                                    <li key={item.label} className="flex items-start gap-3">
                                        <div className="p-1 rounded-full bg-white/10 mt-0.5"><Check size={12} /></div>
                                        <div>
                                            <span className="font-semibold text-gray-200">{item.label}</span>
                                            <span className="block text-sm text-gray-500">{item.benefit}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            <Link to="/app" className="block w-full py-4 text-center rounded-2xl border border-white/20 font-semibold hover:bg-white hover:text-black transition-all">
                                Start Free
                            </Link>
                            <p className="text-center text-xs text-gray-500 mt-4">No credit card required</p>
                        </div>

                        {/* Premium Plan */}
                        <div className="relative p-8 rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-cyan-950/20 to-purple-900/10 hover:border-cyan-400/50 transition-colors group">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full text-xs font-bold tracking-wider shadow-lg shadow-cyan-500/20">
                                RECOMMENDED
                            </div>

                            <h3 className="text-xl font-semibold mb-1 text-cyan-400">Premium</h3>
                            <p className="text-sm text-gray-400 mb-4">When the system starts helping you think</p>
                            <div className="text-4xl font-bold mb-6 text-white">$8<span className="text-lg text-gray-500 font-normal"> / month</span></div>

                            <ul className="space-y-4 mb-8 text-gray-200">
                                {[
                                    { label: 'Auto-adjust Habits', benefit: 'App lowers/hikes targets for you' },
                                    { label: 'Weekly Clarity', benefit: 'Calm, personalized weekly analysis' },
                                    { label: 'Smart Evolution', benefit: 'Regenerate next week’s habits' },
                                    { label: 'Overreach Recovery', benefit: 'Catches crashes and offers recovery' },
                                    { label: 'Smart Habits Everyday', benefit: 'Based on long term goal and past performance' },
                                    { label: 'Novelty Injection', benefit: 'Variety to avoid burnout' }
                                ].map((item) => (
                                    <li key={item.label} className="flex items-start gap-3">
                                        <div className="p-1 rounded-full bg-cyan-500/20 text-cyan-400 mt-0.5"><Check size={12} /></div>
                                        <div>
                                            <span className="font-semibold text-white">{item.label}</span>
                                            <span className="block text-sm text-cyan-400/60">{item.benefit}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            <Link to="/app" className="block w-full py-4 text-center rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 font-bold shadow-lg shadow-cyan-500/25 group-hover:shadow-cyan-500/40 transition-all">
                                Go Premium
                            </Link>

                            <div className="mt-6 flex flex-col items-center">
                                <button
                                    onClick={() => setShowInfoTooltip(!showInfoTooltip)}
                                    className="flex items-center gap-2 text-xs text-white/40 hover:text-white/80 transition-colors"
                                >
                                    <Info size={14} />
                                    <span>Payment info for Indian users</span>
                                </button>
                                <AnimatePresence>
                                    {showInfoTooltip && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden w-full"
                                        >
                                            <div className="mt-3 p-4 rounded-xl bg-slate-900/90 border border-blue-500/30 text-xs text-blue-200/90 leading-relaxed text-left">
                                                <p className="mb-2"><strong className="text-blue-100">🇮🇳 UPI/Card Note:</strong> RBI mandates may show a "Recurring Limit" (e.g., ₹15,000). Do not worry.</p>
                                                <p>This is just a safety cap. You will <strong className="text-green-400">only be charged $8/month</strong>.</p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    {/* Which plan caption */}
                    <p className="text-center text-gray-500 text-sm mt-10 max-w-md mx-auto">
                        Premium doesn't push you harder. It carries more of the load.
                    </p>
                </div>
            </section>

            {/* FAQ SECTION */}
            <section id="faq" className="relative z-10 py-20 px-6 border-t border-white/5 bg-[#050507]">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-16">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            className="inline-block px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-medium text-gray-300 mb-6"
                        >
                            COMMON QUESTIONS
                        </motion.div>
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">How Bounce actually works</h2>
                        <p className="text-gray-400">
                            Honest answers to the questions people usually have before starting.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {[
                            {
                                q: "Is Bounce just another habit tracker?",
                                a: "No. Bounce is built around how behavior actually works. Most habit apps assume perfect consistency and rely on streaks or pressure. Bounce assumes missed days, fluctuating energy, and motivation dips. The system adapts to those realities instead of punishing you for them."
                            },
                            {
                                q: "What do you mean by an identity goal?",
                                a: "Instead of focusing on what you should do today, Bounce starts with who you are trying to become. For example someone who finishes what they start or someone who takes care of their body. Habits are then designed to reinforce that identity even on days when motivation is low."
                            },
                            {
                                q: "What does using Bounce day to day actually look like?",
                                a: "Each day you choose a version of a habit that matches your energy. Some days that is a lot. Some days it is the smallest possible step. The goal is not intensity but continuity. Over time, Bounce learns how you respond and nudges you in ways that keep you moving without overwhelm."
                            },
                            {
                                q: "What happens when I miss a day or fall off?",
                                a: "Nothing breaks. Bounce does not reset your progress or treat it as failure. It shifts the system to recovery mode and gives you lighter actions to reconnect. The focus is on returning to the identity you chose, not on making up for lost days."
                            },
                            {
                                q: "How do habits become harder over time?",
                                a: "As you show sustained consistency, Bounce moves you through stages. At each stage, habits are regenerated to match your capacity. Free users get new habits when they progress through stages. You are never pushed faster than your behavior shows you are ready for."
                            },
                            {
                                q: "Is the free version actually usable long term?",
                                a: "Yes. Free includes identity based habits, energy levels, stage progression, recovery mode, and daily guidance messages. You can build real consistency without paying and many users do."
                            },
                            {
                                q: "So what does Premium change, exactly?",
                                a: "Premium makes the system more adaptive and more personal. Bounce responds not just week to week but day to day, using recent behavior to adjust difficulty, tone, and guidance. Daily messages become personalized, reflections are written for you, and psychological patterns like overreach or avoidance are caught earlier."
                            },
                            {
                                q: "Who is Bounce NOT a good fit for?",
                                a: "If you want strict streaks, punishment for missed days, or constant pressure to do more, Bounce will probably feel too gentle. It is built for people who want consistency without guilt and progress without burnout."
                            },
                            {
                                q: "Is this good for ADHD or inconsistent motivation?",
                                a: "Yes. Bounce is designed for fluctuating energy and executive dysfunction. It uses low friction actions, flexible difficulty, and supportive messaging instead of pressure. The system is built to work with how your brain actually functions."
                            },
                            {
                                q: "What kind of results should I realistically expect?",
                                a: "Not instant transformation. What most people notice first is that they stop quitting. Over time, showing up feels less forced and more natural. The identity you chose starts to feel real because your behavior keeps reinforcing it."
                            }
                        ].map((item, i) => (
                            <FAQItem key={i} question={item.q} answer={item.a} />
                        ))}
                    </div>
                </div>
            </section>



            {/* FINAL CTA */}
            <section className="relative z-10 py-20 px-6 text-center border-t border-white/5 bg-gradient-to-t from-[#0A0A0C] to-[#050507]">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">Restart. Slip. Try again.</h2>
                    <p className="text-gray-400 mb-10 text-lg">
                        If that sounds familiar, Bounce might be a good fit. It's built around that pattern — not against it.
                    </p>
                    <Link
                        to="/app"
                        className="inline-flex items-center gap-3 px-10 py-5 bg-white text-black rounded-full font-bold text-lg hover:bg-gray-200 transition-colors shadow-lg shadow-white/10"
                    >
                        Try Bounce Free <ArrowRight size={20} />
                    </Link>
                    <p className="mt-6 text-xs text-gray-500">
                        No credit card. No guilt.
                    </p>
                </div>
            </section>

            {/* Footer - RESTORED LINKS */}
            <footer className="relative z-10 border-t border-white/5 bg-[#020203]">
                <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2 opacity-50 grayscale hover:grayscale-0 transition-all">
                        <img src="/pwa-192x192.png" alt="Bounce" className="w-6 h-6 rounded-md" />
                        <span className="font-semibold text-sm text-white">Bounce</span>
                    </div>

                    <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-500">
                        <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                        <Link to="/refund" className="hover:text-white transition-colors">Refund Policy</Link>
                        <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
                    </div>

                    <div className="text-xs text-gray-600">
                        © {new Date().getFullYear()} Bounce. Built for ADHD. Works for everyone.
                    </div>
                </div>
            </footer>
        </div>
    );
};