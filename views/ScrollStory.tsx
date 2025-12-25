import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Anchor, Sparkles, RefreshCw, X, ArrowRight, ChevronLeft, ChevronRight, Activity, Shield, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const ScrollStory = () => {
    const [currentScene, setCurrentScene] = useState(0);
    const [direction, setDirection] = useState(0);

    // Navigation
    const goNext = () => {
        if (currentScene < scenes.length - 1) {
            setDirection(1);
            setCurrentScene((prev) => prev + 1);
        }
    };
    const goPrev = () => {
        if (currentScene > 0) {
            setDirection(-1);
            setCurrentScene((prev) => prev - 1);
        }
    };

    // Keyboard support
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') goNext();
            if (e.key === 'ArrowLeft') goPrev();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentScene]);

    // --- ANIMATION VARIANTS ---
    const textVariants = {
        enter: (dir: number) => ({ x: dir * 50, opacity: 0, filter: "blur(4px)" }),
        center: { x: 0, opacity: 1, filter: "blur(0px)", transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
        exit: (dir: number) => ({ x: dir * -50, opacity: 0, filter: "blur(4px)", transition: { duration: 0.3 } })
    };

    // Background Blob colors based on scene - journey themed
    const blobColors = [
        ['#22d3ee', '#0ea5e9', '#0284c7'], // 1: Cyan (Identity)
        ['#22c55e', '#eab308', '#f59e0b'], // 2: Green/Yellow (Energy)
        ['#10b981', '#8b5cf6', '#a855f7'], // 3: Emerald/Purple (Evolution)
        ['#2dd4bf', '#0d9488', '#115e59'], // 4: Teal (Recovery)
        ['#c084fc', '#9333ea', '#581c87'], // 5: Purple (Your Pace)
    ];

    const currentColors = blobColors[currentScene];

    // --- SCENE CONTENT - THE USER'S JOURNEY ---
    const scenes = [
        // 1. STEP 1: PICK YOUR IDENTITY
        {
            content: (
                <div className="flex flex-col items-center text-center">
                    <div className="mb-8 relative">
                        <div className="absolute inset-0 bg-cyan-500/30 blur-3xl rounded-full animate-pulse" />
                        <div className="px-6 py-4 rounded-2xl bg-black/40 border border-cyan-500/30 backdrop-blur-xl relative z-10 shadow-[0_0_40px_rgba(34,211,238,0.2)]">
                            <p className="text-sm text-cyan-300/60 mb-1">I want to become</p>
                            <p className="text-2xl md:text-3xl font-bold text-white">"Someone who reads every day"</p>
                        </div>
                    </div>
                    <h2 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tighter">
                        You choose <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500">who</span> you're becoming.
                    </h2>
                    <p className="text-xl text-cyan-100/60 max-w-lg leading-relaxed">
                        At first, you hold this in your mind. <strong className="text-white">Over time, Bounce starts reflecting it back to you.</strong>
                    </p>
                </div>
            )
        },
        // 2. STEP 2: ENERGY-ADAPTIVE HABITS
        {
            content: (
                <div className="flex flex-col items-center text-center">
                    <div className="mb-8 flex gap-3">
                        {/* Energy level cards */}
                        <div className="px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-center">
                            <Zap size={20} className="text-green-400 mx-auto mb-1" />
                            <p className="text-xs text-green-300">HIGH</p>
                            <p className="text-sm text-white/80 mt-1">"Read 20 pages"</p>
                        </div>
                        <div className="px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-center">
                            <Zap size={20} className="text-yellow-400 mx-auto mb-1" />
                            <p className="text-xs text-yellow-300">MEDIUM</p>
                            <p className="text-sm text-white/80 mt-1">"Read 5 pages"</p>
                        </div>
                        <div className="px-4 py-3 rounded-xl bg-orange-500/10 border border-orange-500/30 text-center">
                            <Zap size={20} className="text-orange-400 mx-auto mb-1" />
                            <p className="text-xs text-orange-300">LOW</p>
                            <p className="text-sm text-white/80 mt-1">"Read 1 page"</p>
                        </div>
                    </div>
                    <h2 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tighter">
                        You <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-yellow-300">pick</span> what fits today.
                    </h2>
                    <p className="text-xl text-white/60 max-w-lg leading-relaxed">
                        At first, you choose your energy level each day. <strong className="text-white">Later, Bounce starts noticing patterns and guides you.</strong>
                    </p>
                </div>
            )
        },
        // 3. STEP 3: PROGRESS & EVOLUTION
        {
            content: (
                <div className="flex flex-col items-center text-center">
                    <div className="mb-8 flex items-center gap-4">
                        {/* Stage progression visual */}
                        <div className="flex items-center gap-2">
                            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center">
                                <span className="text-lg">🌱</span>
                            </div>
                            <div className="w-8 h-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500" />
                            <div className="w-12 h-12 rounded-full bg-cyan-500/20 border-2 border-cyan-500 flex items-center justify-center">
                                <span className="text-lg">🌿</span>
                            </div>
                            <div className="w-8 h-0.5 bg-gradient-to-r from-cyan-500 to-purple-500" />
                            <div className="w-12 h-12 rounded-full bg-purple-500/20 border-2 border-purple-500 flex items-center justify-center">
                                <span className="text-lg">🌳</span>
                            </div>
                            <div className="w-8 h-0.5 bg-gradient-to-r from-purple-500 to-amber-500" />
                            <div className="w-12 h-12 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center">
                                <span className="text-lg">🌲</span>
                            </div>
                        </div>
                    </div>
                    <h2 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tighter">
                        You <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-purple-400">grow</span>. So do your habits.
                    </h2>
                    <p className="text-xl text-white/60 max-w-lg leading-relaxed">
                        At first, you advance when you're ready. <strong className="text-white">Over time, Bounce starts adjusting the pace for you.</strong>
                    </p>
                </div>
            )
        },
        // 4. STEP 4: WHEN YOU SLIP - RECOVERY
        {
            content: (
                <div className="flex flex-col items-center text-center">
                    <div className="mb-10 relative">
                        <div className="absolute inset-0 bg-teal-400/20 blur-[50px] rounded-full" />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="inline-flex items-center gap-4 px-8 py-5 rounded-2xl bg-black/40 border border-teal-400/50 text-teal-300 font-bold text-xl tracking-wide shadow-[0_0_60px_-15px_rgba(45,212,191,0.3)] backdrop-blur-2xl relative z-10"
                        >
                            <RefreshCw size={28} className="text-teal-400 animate-[spin_4s_linear_infinite]" />
                            RECOVERY MODE
                        </motion.div>
                    </div>
                    <h2 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tighter">
                        You <span className="text-teal-400">come back</span>. Bounce helps.
                    </h2>
                    <p className="text-xl text-teal-100/60 max-w-lg leading-relaxed">
                        At first, you step down and recover on your own. <strong className="text-white">Eventually, Bounce steps in earlier.</strong>
                    </p>
                </div>
            )
        },
        // 5. STEP 5: FINAL - SINGLE NARRATIVE
        {
            content: (
                <div className="flex flex-col items-center text-center max-w-2xl px-6">
                    <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tighter">
                        You keep <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400">showing up</span>.
                    </h2>
                    <p className="text-xl text-white/60 leading-relaxed mb-6">
                        That's the whole point.
                    </p>
                    <p className="text-lg text-white/40 leading-relaxed mb-12">
                        You do the work. Bounce just does more of the thinking.
                    </p>

                    <Link
                        to="/app"
                        className="group relative inline-flex items-center gap-3 px-12 py-5 bg-white text-black rounded-full font-bold text-xl hover:bg-gray-100 transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] overflow-hidden"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            Start free <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                    </Link>
                </div>
            )
        }
    ];

    return (
        <section className="relative h-screen bg-[#050507] overflow-hidden flex flex-col items-center justify-center">

            {/* --- ATMOSPHERE LAYER --- */}

            {/* 1. Grid Pattern (Consistent with Landing) */}
            <div className="absolute inset-0 opacity-[0.15] pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(to right, #808080 1px, transparent 1px), linear-gradient(to bottom, #808080 1px, transparent 1px)`,
                    backgroundSize: '40px 40px',
                    maskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)'
                }}
            />

            {/* 2. The Living Background Blob (Morphing Orb) */}
            <motion.div
                className="absolute w-[800px] h-[800px] rounded-full blur-[120px] opacity-40 pointer-events-none"
                animate={{
                    background: `radial-gradient(circle, ${currentColors[0]} 0%, ${currentColors[1]} 40%, transparent 80%)`,
                    scale: [1, 1.1, 1], // Breathing effect
                }}
                transition={{
                    background: { duration: 1.5, ease: "easeInOut" }, // Color morph speed
                    scale: { duration: 8, repeat: Infinity, ease: "easeInOut" }
                }}
            />
            {/* Secondary Blob for complexity */}
            <motion.div
                className="absolute w-[600px] h-[600px] rounded-full blur-[100px] opacity-30 pointer-events-none"
                animate={{
                    background: currentColors[2],
                    x: [0, 100, 0],
                    y: [0, -50, 0],
                }}
                transition={{
                    duration: 10, repeat: Infinity, ease: "easeInOut"
                }}
                style={{ top: '20%', right: '10%' }}
            />

            {/* 3. Noise Texture */}
            <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-cover mix-blend-overlay pointer-events-none" />


            {/* --- CONTENT LAYER --- */}

            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 h-[60vh] flex items-center justify-center">
                <AnimatePresence custom={direction} mode="popLayout">
                    <motion.div
                        key={currentScene}
                        custom={direction}
                        variants={textVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="w-full flex justify-center"
                    >
                        {scenes[currentScene].content}
                    </motion.div>
                </AnimatePresence>
            </div>


            {/* --- CONTROLS --- */}

            <div className="absolute bottom-12 flex items-center gap-8 z-20">
                <button
                    onClick={goPrev}
                    disabled={currentScene === 0}
                    className="p-4 rounded-full border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20 backdrop-blur-md transition-all disabled:opacity-0 disabled:scale-75"
                >
                    <ChevronLeft size={24} className="text-white/70" />
                </button>

                {/* Indicators */}
                <div className="flex gap-3">
                    {scenes.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                setDirection(i > currentScene ? 1 : -1);
                                setCurrentScene(i);
                            }}
                            className="relative h-1.5 rounded-full overflow-hidden transition-all duration-300 ease-out"
                            style={{
                                width: i === currentScene ? 40 : 8,
                                background: i === currentScene ? 'white' : 'rgba(255,255,255,0.2)'
                            }}
                        />
                    ))}
                </div>

                <button
                    onClick={goNext}
                    disabled={currentScene === scenes.length - 1}
                    className="p-4 rounded-full border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20 backdrop-blur-md transition-all disabled:opacity-0 disabled:scale-75"
                >
                    <ChevronRight size={24} className="text-white/70" />
                </button>
            </div>

            {/* Hint for first slide */}
            {currentScene === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2 }}
                    className="absolute bottom-32 text-white/30 text-xs tracking-widest uppercase font-medium"
                >
                    Use arrows to navigate
                </motion.div>
            )}
        </section>
    );
};

export default ScrollStory;