
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, BarChart3, List, Zap, ThermometerSnowflake, AlertCircle, Dices, Check, Wind, Volume2, VolumeX, Eye, EyeOff, Hammer, Shield, Timer, Undo2, CloudRain, Trees, Waves, Flame, X, Calendar, PenLine, Target, Sprout, Anchor, Battery, Mic } from 'lucide-react';
import { useStore } from '../store';
import { useResilienceEngine } from '../hooks/useResilienceEngine';
import { Orb } from '../components/Orb';
import { SettingsModal } from '../components/SettingsModal';
import { Stats } from './Stats';
import { BreathingModal } from '../components/BreathingModal';
import { ReflectionModal } from '../components/ReflectionModal';
import { FocusTimerModal } from '../components/FocusTimerModal';
import { GoalsModal } from '../components/GoalsModal';
import { EnergyMenu } from '../components/EnergyMenu'; // NEW
import { VoiceMode } from '../components/VoiceMode'; // NEW
import { WeeklyStory } from '../components/WeeklyStory'; // NEW
import { SoundType, DailyLog } from '../types';

export const Dashboard: React.FC = () => {
    const { state, actions } = useResilienceEngine();
    const { identity, microHabits, currentHabitIndex, cycleMicroHabit, setView, logReflection, setDailyIntention, toggleSound, soundEnabled, soundType, soundVolume, setSoundVolume, setSoundType, history, goal, currentEnergyLevel, addMicroHabit } = useStore();

    const [showCelebration, setShowCelebration] = useState(false);
    const [milestoneReached, setMilestoneReached] = useState<number | null>(null);

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isBreathingOpen, setIsBreathingOpen] = useState(false);
    const [isReflectionOpen, setIsReflectionOpen] = useState(false);
    const [isFocusOpen, setIsFocusOpen] = useState(false);
    const [isGoalsOpen, setIsGoalsOpen] = useState(false);
    const [isEnergyOpen, setIsEnergyOpen] = useState(false); // NEW
    const [isVoiceOpen, setIsVoiceOpen] = useState(false); // NEW
    const [zenMode, setZenMode] = useState(false);

    // UI State for post-completion options
    const [showPostCompletionActions, setShowPostCompletionActions] = useState(false);
    const [showSoundControls, setShowSoundControls] = useState(false);

    // Intention State
    const todayKey = new Date().toISOString().split('T')[0];
    const [intentionInput, setIntentionInput] = useState(history[todayKey]?.intention || '');
    const [isEditingIntention, setIsEditingIntention] = useState(!history[todayKey]?.intention);

    // Audio Ref
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Sound Asset Map
    const soundAssets: Record<SoundType, string> = {
        rain: 'https://assets.mixkit.co/active_storage/sfx/1290/1290-preview.mp3', // Heavy Rain
        forest: 'https://assets.mixkit.co/active_storage/sfx/2434/2434-preview.mp3', // Forest Birds
        wind: 'https://assets.mixkit.co/active_storage/sfx/2658/2658-preview.mp3',  // Wind Flow
        volcano: 'https://assets.mixkit.co/active_storage/sfx/2443/2443-preview.mp3', // Volcano
        stream: 'https://assets.mixkit.co/active_storage/sfx/207/207-preview.mp3', // Stream
    };

    // Sound Effect Logic
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        if (soundEnabled) {
            audioRef.current = new Audio(soundAssets[soundType]);
            audioRef.current.loop = true;
            audioRef.current.volume = soundVolume;
            audioRef.current.play().catch(() => { /* Autoplay block ignore */ });
        }

        return () => { audioRef.current?.pause(); };
    }, [soundEnabled, soundType]);

    // Dynamic Volume Update without restart
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = soundVolume;
        }
    }, [soundVolume]);

    const currentHabit = microHabits && microHabits.length > 0
        ? microHabits[currentHabitIndex]
        : "Check in";

    const isCurrentHabitDone = actions.isHabitCompleted(currentHabitIndex);

    // Button Hold Logic
    const [isHolding, setIsHolding] = useState(false);
    const intervalRef = useRef<any>(null);
    const actionsTimeoutRef = useRef<any>(null);

    const startHold = () => {
        if (isCurrentHabitDone) return;
        setIsHolding(true);
        intervalRef.current = setTimeout(() => {
            actions.completeTask(currentHabitIndex);
            setIsHolding(false);

            // Milestone Check
            const newStreak = state.streak + 1;
            if (newStreak > 0 && (newStreak % 7 === 0 || newStreak === 30)) {
                setMilestoneReached(newStreak);
            } else {
                setShowCelebration(true);
            }

            // Show Actions (Undo / Note)
            setShowPostCompletionActions(true);
            if (actionsTimeoutRef.current) clearTimeout(actionsTimeoutRef.current);
            actionsTimeoutRef.current = setTimeout(() => {
                setShowPostCompletionActions(false);
            }, 10000);

            setTimeout(() => {
                setShowCelebration(false);
            }, milestoneReached ? 4000 : 2000);
        }, 1500);
    };

    const stopHold = () => {
        setIsHolding(false);
        clearTimeout(intervalRef.current);
    };

    const handleUndo = () => {
        actions.undo();
        setShowPostCompletionActions(false);
        setShowCelebration(false);
        setMilestoneReached(null);
    };

    const handleShuffle = () => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
        cycleMicroHabit();
    };

    const handleIntentionSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (intentionInput.trim()) {
            const now = new Date().toISOString();
            setDailyIntention(now, intentionInput);
            setIsEditingIntention(false);
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    };

    // Calculate Weekly Goal Progress
    const getWeeklyProgress = () => {
        const today = new Date();
        const startOfWeek = new Date(today);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);

        let count = 0;
        Object.values(history).forEach((log: DailyLog) => {
            if (new Date(log.date) >= startOfWeek) {
                count++;
            }
        });

        if (state.isCompletedToday && !history[new Date().toISOString().split('T')[0]]) {
            count++;
        }

        return count;
    };

    const weeklyProgress = getWeeklyProgress();
    const goalPercentage = Math.min(100, (weeklyProgress / goal.target) * 100);

    // Determine Orb State
    let orbState: 'frozen' | 'active' | 'success' | 'breathing' | 'healing' = 'breathing';
    if (showCelebration || milestoneReached) orbState = 'success';
    else if (state.isFrozen) orbState = 'frozen';
    else if (state.status === 'BOUNCED') orbState = 'healing';
    else if (isHolding) orbState = 'active';

    return (
        <div className="h-full flex flex-col relative transition-colors duration-300">

            {/* OVERLAYS */}
            <WeeklyStory /> {/* PREMIUM: AI Weekly Review */}
            <VoiceMode
                isOpen={isVoiceOpen}
                onClose={(transcript) => {
                    setIsVoiceOpen(false);
                    // Only add if there is actual text (user didn't just click X)
                    if (transcript && typeof transcript === 'string') {
                        addMicroHabit(transcript);
                    }
                }}
            />
            {/* Milestone Celebration Overlay */}
            <AnimatePresence>
                {milestoneReached && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-lg pointer-events-none"
                    >
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            transition={{ type: "spring", duration: 1, bounce: 0.5 }}
                            className="relative flex flex-col items-center"
                        >
                            <div className="absolute inset-0 bg-primary-cyan/30 blur-[80px] rounded-full" />
                            <div className="text-8xl mb-4 animate-bounce">✨</div>
                            <h2 className="text-5xl font-bold text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary-cyan to-white drop-shadow-[0_0_15px_rgba(13,204,242,0.8)]">
                                {milestoneReached} Days
                            </h2>
                            <p className="text-white/80 text-xl tracking-widest uppercase font-light">Evolved</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Celebration Glow Overlay (Standard) */}
            <AnimatePresence>
                {showCelebration && !milestoneReached && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center overflow-hidden"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{
                                scale: [1, 1.5],
                                opacity: [0, 0.8, 0]
                            }}
                            transition={{
                                duration: 2,
                                times: [0, 0.4, 1],
                                ease: "easeOut"
                            }}
                            className="w-[150vmax] h-[150vmax] rounded-full"
                            style={{
                                background: 'radial-gradient(circle, rgba(13,204,242,0.4) 0%, rgba(127,0,255,0.25) 30%, rgba(0,191,255,0.1) 60%, transparent 80%)',
                                filter: 'blur(60px)',
                                mixBlendMode: 'screen'
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modals */}
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
            <BreathingModal isOpen={isBreathingOpen} onClose={() => setIsBreathingOpen(false)} />
            <FocusTimerModal isOpen={isFocusOpen} onClose={() => setIsFocusOpen(false)} />
            <GoalsModal isOpen={isGoalsOpen} onClose={() => setIsGoalsOpen(false)} />
            <EnergyMenu isOpen={isEnergyOpen} onClose={() => setIsEnergyOpen(false)} />
            <ReflectionModal
                isOpen={isReflectionOpen}
                onClose={() => { setIsReflectionOpen(false); setMilestoneReached(null); }}
                onSave={(energy, note) => {
                    const now = new Date().toISOString();
                    logReflection(now, energy, note);
                    setMilestoneReached(null);
                    setShowPostCompletionActions(false);
                }}
            />

            {/* Header */}
            <AnimatePresence>
                {!zenMode && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className="px-6 pt-8 pb-4 z-20 relative"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden border border-gray-300 dark:border-white/20">
                                    <img src={`https://api.dicebear.com/9.x/micah/svg?seed=${identity}`} alt="User" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-semibold text-gray-800 dark:text-white">{getGreeting()}</h2>
                                    <p className="text-xs text-primary-cyan font-medium">{identity}</p>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-3">
                                {/* Sound & Settings Row */}
                                <div className="flex items-center gap-2 relative">
                                    {/* PREMIUM: Smart Energy Button */}
                                    <button
                                        onClick={() => setIsEnergyOpen(true)}
                                        className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors relative z-50 ${currentEnergyLevel
                                            ? currentEnergyLevel === 'low' ? 'bg-red-500/20 text-red-500' : currentEnergyLevel === 'high' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'
                                            : 'bg-black/5 dark:bg-white/5 text-gray-400'
                                            }`}
                                    >
                                        <Battery size={16} />
                                    </button>

                                    {/* PREMIUM: Voice Logger Button */}
                                    <button
                                        onClick={() => setIsVoiceOpen(true)}
                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/5 text-gray-400 hover:text-primary-cyan transition-colors"
                                    >
                                        <Mic size={16} />
                                    </button>

                                    <button
                                        onClick={() => setShowSoundControls(!showSoundControls)}
                                        className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors relative z-50 ${soundEnabled
                                            ? 'bg-primary-cyan/20 text-primary-cyan'
                                            : 'bg-black/5 dark:bg-white/5 text-gray-400'
                                            }`}
                                    >
                                        {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                                    </button>

                                    {/* Sound Controls Popover */}
                                    <AnimatePresence>
                                        {showSoundControls && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                                className="absolute top-full right-0 mt-2 p-4 bg-white dark:bg-dark-800 border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl w-64 z-40 backdrop-blur-xl"
                                            >
                                                {/* Sound controls content same as before */}
                                                <div className="flex justify-between items-center mb-3">
                                                    <span className="text-xs font-bold text-gray-500 dark:text-white/50 uppercase">Soundscape</span>
                                                    <button onClick={toggleSound} className="text-xs text-primary-cyan hover:underline">
                                                        {soundEnabled ? 'Disable' : 'Enable'}
                                                    </button>
                                                </div>

                                                <div className="mb-4">
                                                    <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                                                        <span>Volume</span>
                                                        <span>{Math.round(soundVolume * 100)}%</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="0" max="1" step="0.05"
                                                        value={soundVolume}
                                                        onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                                                        className="w-full h-1.5 bg-gray-200 dark:bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-cyan"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-5 gap-2">
                                                    {[
                                                        { id: 'rain', icon: <CloudRain size={14} /> },
                                                        { id: 'forest', icon: <Trees size={14} /> },
                                                        { id: 'wind', icon: <Wind size={14} /> },
                                                        { id: 'stream', icon: <Waves size={14} /> },
                                                        { id: 'volcano', icon: <Flame size={14} /> },
                                                    ].map((s) => (
                                                        <button
                                                            key={s.id}
                                                            onClick={() => setSoundType(s.id as SoundType)}
                                                            className={`aspect-square flex items-center justify-center rounded-lg transition-all ${soundType === s.id
                                                                ? 'bg-primary-cyan text-black shadow-lg shadow-primary-cyan/20'
                                                                : 'bg-gray-100 dark:bg-white/5 text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
                                                                }`}
                                                            title={s.id}
                                                        >
                                                            {s.icon}
                                                        </button>
                                                    ))}
                                                </div>

                                                <button
                                                    onClick={() => setShowSoundControls(false)}
                                                    className="w-full mt-3 pt-2 border-t border-gray-100 dark:border-white/5 text-[10px] text-center text-gray-400"
                                                >
                                                    Close
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <button
                                        onClick={() => setIsSettingsOpen(true)}
                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/5 text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                                    >
                                        <Settings size={18} />
                                    </button>
                                </div>

                                {/* Resilience Score */}
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col items-end pr-1">
                                        <span className="text-sm font-bold text-gray-800 dark:text-white">{state.score}%</span>
                                        <span className="text-[10px] text-gray-400 dark:text-white/50 uppercase tracking-wider">Resilience</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Daily Intention Anchor */}
                        <motion.div
                            layout
                            className="relative overflow-hidden"
                        >
                            {isEditingIntention ? (
                                <form onSubmit={handleIntentionSubmit} className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <Anchor size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            value={intentionInput}
                                            onChange={(e) => setIntentionInput(e.target.value)}
                                            placeholder="Set today's intention..."
                                            className="w-full bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:border-primary-cyan/50 backdrop-blur-sm"
                                            autoFocus
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!intentionInput.trim()}
                                        className="p-2 rounded-xl bg-primary-cyan/20 text-primary-cyan hover:bg-primary-cyan/30 disabled:opacity-50 transition-colors"
                                    >
                                        <Check size={16} />
                                    </button>
                                </form>
                            ) : (
                                <div onClick={() => setIsEditingIntention(true)} className="flex items-center gap-2 group cursor-pointer">
                                    <Anchor size={14} className="text-primary-purple" />
                                    <p className="text-sm font-medium text-gray-600 dark:text-white/70 group-hover:text-primary-cyan transition-colors">
                                        Today's Anchor: <span className="text-gray-900 dark:text-white">{intentionInput}</span>
                                    </p>
                                </div>
                            )}
                        </motion.div>

                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-0">

                {/* Zen Mode Toggle */}
                <button
                    onClick={() => setZenMode(!zenMode)}
                    className="absolute top-4 right-6 z-30 text-gray-400 dark:text-white/20 hover:text-primary-cyan transition-colors"
                >
                    {zenMode ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>

                {/* Goals Button */}
                <button
                    onClick={() => setIsGoalsOpen(true)}
                    className={`absolute top-4 left-6 z-30 flex items-center gap-2 transition-opacity duration-300 ${zenMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                >
                    <div className="relative w-8 h-8">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 32 32">
                            <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="3" fill="none" className="text-gray-200 dark:text-white/10" />
                            <circle cx="16" cy="16" r="14" stroke="#7F00FF" strokeWidth="3" fill="none" strokeDasharray="88" strokeDashoffset={88 - (88 * (goalPercentage / 100))} strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-gray-600 dark:text-white">
                            {weeklyProgress}/{goal.target}
                        </div>
                    </div>
                </button>

                {/* Pulse/Timer Triggers */}
                <div className={`absolute top-1/4 left-6 z-30 flex flex-col gap-4 transition-opacity duration-300 ${zenMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    <button
                        onClick={() => setIsBreathingOpen(true)}
                        className="flex flex-col items-center gap-1 text-primary-purple/80 hover:text-primary-purple transition-all"
                    >
                        <div className="p-2 bg-white/10 backdrop-blur-md rounded-full border border-white/10 shadow-sm">
                            <Wind size={20} />
                        </div>
                        <span className="text-[10px] font-medium">Pulse</span>
                    </button>

                    <button
                        onClick={() => setIsFocusOpen(true)}
                        className="flex flex-col items-center gap-1 text-primary-blue/80 hover:text-primary-blue transition-all"
                    >
                        <div className="p-2 bg-white/10 backdrop-blur-md rounded-full border border-white/10 shadow-sm">
                            <Timer size={20} />
                        </div>
                        <span className="text-[10px] font-medium">Focus</span>
                    </button>
                </div>

                {/* The Orb */}
                <motion.div
                    layout
                    className="relative mb-6 transition-transform"
                    animate={{ scale: zenMode ? 1.2 : 1 }}
                >
                    <Orb
                        state={orbState}
                        size={300}
                        isFractured={state.status === 'CRACKED'}
                        streak={state.streak}
                    />
                </motion.div>

                {/* Action/Info Card - The "Deck" */}
                <motion.div
                    className="w-[90%] max-w-md perspective-1000 mb-8 relative z-20"
                    animate={{ y: zenMode ? 50 : 0 }}
                >
                    <div className="relative w-full">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentHabitIndex}
                                initial={{ rotateX: -90, opacity: 0 }}
                                animate={{ rotateX: 0, opacity: 1 }}
                                exit={{ rotateX: 90, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className={`backdrop-blur-xl border rounded-3xl p-5 shadow-xl transition-colors ${zenMode
                                    ? 'bg-transparent border-transparent shadow-none text-center'
                                    : 'bg-white/60 dark:bg-white/5 border-gray-200 dark:border-white/10'
                                    }`}
                            >
                                <div className={`flex ${zenMode ? 'justify-center' : 'justify-between'} items-start mb-2`}>
                                    <div className="flex-1 pr-2">
                                        {!zenMode && (
                                            <div className="flex justify-between items-center mb-1">
                                                <p className="text-xs text-gray-500 dark:text-white/40 uppercase tracking-wider">
                                                    Micro-Habit {currentHabitIndex + 1}/{microHabits.length}
                                                </p>
                                                {/* AI Generated Badge */}
                                                {currentHabit.includes("Mode") && (
                                                    <span className="text-[9px] bg-primary-cyan/10 text-primary-cyan px-1.5 py-0.5 rounded uppercase font-bold flex items-center gap-1">
                                                        <Zap size={8} /> AI Adaptive
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        <h3 className={`text-lg font-bold text-gray-800 dark:text-white leading-tight flex items-center gap-2 ${zenMode ? 'justify-center text-2xl' : ''}`}>
                                            {currentHabit}
                                            {isCurrentHabitDone && (
                                                <span className="text-green-500 inline-flex items-center justify-center bg-green-500/10 rounded-full p-0.5">
                                                    <Check size={14} strokeWidth={3} />
                                                </span>
                                            )}
                                        </h3>
                                    </div>
                                    {!zenMode && (
                                        <button
                                            onClick={handleShuffle}
                                            disabled={state.isFrozen}
                                            className="p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-primary-cyan transition-colors disabled:opacity-30"
                                        >
                                            <Dices size={20} />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* Main Action & Undo Layer */}
                <div className="relative flex flex-col items-center w-full min-h-[100px]">
                    <motion.button
                        disabled={isCurrentHabitDone || state.isFrozen}
                        onMouseDown={startHold}
                        onMouseUp={stopHold}
                        onMouseLeave={stopHold}
                        onTouchStart={startHold}
                        onTouchEnd={stopHold}
                        animate={{ opacity: zenMode && isCurrentHabitDone ? 0 : 1 }}
                        className={`
                    relative w-64 h-16 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 overflow-hidden shadow-lg
                    ${isCurrentHabitDone
                                ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/50 cursor-default'
                                : state.status === 'CRACKED'
                                    ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-orange-500/30'
                                    : 'bg-gradient-to-r from-primary-cyan to-primary-blue text-white dark:text-dark-900 shadow-cyan-500/30 dark:shadow-[0_0_30px_rgba(13,204,242,0.4)]'
                            }
                    ${state.isFrozen ? 'opacity-50 grayscale' : ''}
                    active:scale-95
                `}
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            {isCurrentHabitDone
                                ? "Completed"
                                : state.status === 'CRACKED'
                                    ? <><Hammer size={18} /> Repair & Bounce</>
                                    : "Hold to Complete"
                            }
                        </span>

                        {/* Fill effect */}
                        {isHolding && !isCurrentHabitDone && (
                            <motion.div
                                layoutId="fill"
                                initial={{ width: 0 }} animate={{ width: '100%' }}
                                transition={{ duration: 1.5, ease: "linear" }}
                                className="absolute left-0 top-0 h-full bg-white/40"
                            />
                        )}
                    </motion.button>

                    {/* Post Completion Actions (Undo & Add Note) */}
                    <AnimatePresence>
                        {showPostCompletionActions && (
                            <div className="absolute top-full mt-4 flex gap-3 z-40">
                                <motion.button
                                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                    onClick={handleUndo}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-dark-800 dark:bg-white/10 text-white backdrop-blur-xl border border-white/10 shadow-xl text-sm font-medium hover:bg-dark-700 dark:hover:bg-white/20 transition-colors"
                                >
                                    <Undo2 size={16} className="text-primary-cyan" /> Undo
                                </motion.button>

                                <motion.button
                                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                    transition={{ delay: 0.1 }}
                                    onClick={() => setIsReflectionOpen(true)}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-cyan text-black backdrop-blur-xl shadow-xl shadow-cyan-500/20 text-sm font-bold hover:scale-105 transition-transform"
                                >
                                    <PenLine size={16} /> Add Note
                                </motion.button>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Nav Bar */}
            <AnimatePresence>
                {!zenMode && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                        className="px-6 py-4 border-t border-gray-200 dark:border-white/10 bg-white/80 dark:bg-dark-900/80 backdrop-blur-md flex justify-between items-center z-10"
                    >
                        <NavItem icon={<List size={24} />} label="Habits" active />
                        <NavItem
                            icon={<Sprout size={24} />}
                            label="Growth"
                            onClick={() => setView('growth')}
                        />
                        <NavItem
                            icon={<BarChart3 size={24} />}
                            label="Stats"
                            onClick={() => setView('stats')}
                        />
                        <button
                            onClick={() => actions.toggleFreeze(true)}
                            className="flex flex-col items-center gap-1 text-red-500 dark:text-red-400 opacity-80 hover:opacity-100"
                        >
                            <ThermometerSnowflake size={24} />
                            <span className="text-[10px]">Freeze</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const NavItem = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center gap-1 ${active ? 'text-primary-cyan' : 'text-gray-400 dark:text-white/40'}`}
    >
        {icon}
        <span className="text-[10px] font-medium">{label}</span>
    </button>
);
