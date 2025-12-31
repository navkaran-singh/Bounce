
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calendar as CalendarIcon, Award, Activity, ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';
import { useStore } from '../store';
import { useResilienceEngine } from '../hooks/useResilienceEngine';
import { DailyLog } from '../types';

export const Stats: React.FC = () => {
    const { setView, history } = useStore();
    const { state } = useResilienceEngine();

    // Calendar State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    // Calendar Helpers
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
    const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const padding = Array.from({ length: firstDay }, (_, i) => i);

    const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const getLogForDay = (day: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return history[dateStr];
    };

    // Get selected log details
    const selectedLog = selectedDate ? history[selectedDate] : null;

    // Get recent reflections for Echoes section
    const recentLogs = (Object.values(history) as DailyLog[])
        .filter(l => l.note || l.energy || l.intention)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

    // Insight Engine Logic (limited to last 90 days for cost optimization)
    const insights = useMemo(() => {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        ninetyDaysAgo.setHours(0, 0, 0, 0);

        const logs = (Object.values(history) as DailyLog[])
            .filter(log => new Date(log.date) >= ninetyDaysAgo);

        if (logs.length === 0) return ["Start your first bounce today! Your insights will grow with your journey."];
        if (logs.length < 5) return ["Keep bouncing! Insights will appear after a few more days."];

        const result = [];

        // Calculate daily score averages
        const logsWithScores = logs.filter(log => log.dailyScore !== undefined);
        const avgScore = logsWithScores.length > 0
            ? logsWithScores.reduce((sum, log) => sum + (log.dailyScore || 0), 0) / logsWithScores.length
            : 0;

        // Count zero-completion days vs high-completion days
        const zeroDays = logs.filter(log => !log.completedIndices || log.completedIndices.length === 0).length;
        const highDays = logs.filter(log => (log.dailyScore || 0) >= 2.5).length;
        const perfectDays = logs.filter(log => (log.dailyScore || 0) === 3.0).length;

        // Score-based insights
        if (avgScore >= 2.5) {
            result.push("You're crushing it! Your average daily score is exceptional.");
        } else if (avgScore >= 1.5) {
            result.push("Steady progress! You're building solid momentum.");
        } else if (avgScore < 1 && logsWithScores.length > 0) {
            result.push("Every bounce counts. Focus on consistency over perfection.");
        }

        // Zero-day recovery insights
        if (zeroDays > logs.length * 0.3) {
            result.push("Some days are harder than others. Consider using Low Energy mode more often.");
        }

        // High performance celebration
        if (perfectDays > 0) {
            result.push(`You've had ${perfectDays} perfect score day${perfectDays > 1 ? 's' : ''}! Keep that energy.`);
        }

        // Day of week analysis
        const dayCounts = [0, 0, 0, 0, 0, 0, 0];
        let highEnergyCount = 0;
        let lowEnergyCount = 0;

        logs.forEach(log => {
            const day = new Date(log.date).getDay(); // 0 = Sun
            if (log.completedIndices && log.completedIndices.length > 0) dayCounts[day]++;
            if (log.energy === 'high') highEnergyCount++;
            if (log.energy === 'low') lowEnergyCount++;
        });

        const maxDays = Math.max(...dayCounts);
        const minDays = Math.min(...dayCounts.filter(c => c > 0 || logs.length < 30));
        const bestDayIndex = dayCounts.indexOf(maxDays);
        const worstDayIndex = dayCounts.indexOf(minDays);
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        if (maxDays > 0 && logs.length >= 14) {
            result.push(`${daysOfWeek[bestDayIndex]}s are your power day – you're most consistent then.`);
        }

        if (highEnergyCount / logs.length > 0.4) {
            result.push("You report high energy in over 40% of sessions. Great vitality!");
        } else if (lowEnergyCount / logs.length > 0.5) {
            result.push("You often work with low energy – and that's okay. You're still showing up.");
        }

        // Streak insights
        if (state.streak > 21) {
            result.push("Three weeks strong! Your habit is becoming automatic.");
        } else if (state.streak > 7) {
            result.push("Your current streak shows a strong habit forming.");
        } else if (state.streak > 0 && state.streak <= 3) {
            result.push("Fresh start! The first few days are the hardest – keep going.");
        }

        // Fallback if no insights generated
        if (result.length === 0) {
            result.push("Keep tracking your progress. Patterns will emerge over time.");
        }

        return result.slice(0, 4); // Limit to 4 insights max
    }, [history, state.streak]);

    return (
        <div className="h-full flex flex-col relative bg-light-50 dark:bg-[#0F0F10] overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="p-6 sticky top-0 bg-light-50/90 dark:bg-[#0F0F10]/90 backdrop-blur-md z-20 flex justify-center items-center border-b border-gray-200 dark:border-white/5">
                <h1 className="text-xl font-bold text-gray-800 dark:text-white">Resilience Data</h1>
            </div>

            <div className="p-6 space-y-8 pb-24">

                {/* Insights Section (New Feature) */}
                <section>
                    <div className="flex items-center gap-2 mb-4 text-yellow-500">
                        <Lightbulb size={20} />
                        <h2 className="text-sm font-bold uppercase tracking-wider">Insights</h2>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Lightbulb size={64} />
                        </div>
                        <ul className="space-y-2 relative z-10">
                            {insights.map((insight, i) => (
                                <li key={i} className="text-sm text-gray-800 dark:text-white/90 flex gap-2">
                                    <span className="text-yellow-500">•</span> {insight}
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* Badges Section */}
                <section>
                    <div className="flex items-center gap-2 mb-4 text-primary-purple">
                        <Award size={20} />
                        <h2 className="text-sm font-bold uppercase tracking-wider">Badges</h2>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {state.earnedBadges.map(badge => (
                            <div key={badge.id} className="aspect-square rounded-2xl bg-gradient-to-br from-primary-cyan/10 to-primary-purple/10 border border-primary-cyan/20 flex flex-col items-center justify-center gap-1">
                                <span className="text-2xl">{badge.icon}</span>
                                <span className="text-xs font-bold text-dark-900 dark:text-white">{badge.label}</span>
                            </div>
                        ))}
                        {state.nextBadge && (
                            <div className="aspect-square rounded-2xl bg-gray-100 dark:bg-white/5 border border-dashed border-gray-300 dark:border-white/10 flex flex-col items-center justify-center gap-1 opacity-50">
                                <span className="text-2xl grayscale filter">{state.nextBadge.icon}</span>
                                <span className="text-xs text-gray-500 dark:text-white/50">Next</span>
                                <span className="text-[10px] text-gray-400 dark:text-white/30">{state.totalCompletions}/{state.nextBadge.requirement}</span>
                            </div>
                        )}
                    </div>
                </section>

                {/* Consistency Section (Integrated Calendar) */}
                <section>
                    <div className="flex items-center gap-2 mb-4 text-primary-cyan">
                        <CalendarIcon size={20} />
                        <h2 className="text-sm font-bold uppercase tracking-wider">Consistency</h2>
                    </div>

                    <div className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-gray-200 dark:border-white/10 shadow-sm">
                        {/* Calendar Controls */}
                        <div className="flex items-center justify-between mb-4">
                            <span className="font-bold text-gray-900 dark:text-white">{monthName} <span className="opacity-50">{year}</span></span>
                            <div className="flex gap-1">
                                <button onClick={handlePrevMonth} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10"><ChevronLeft size={16} /></button>
                                <button onClick={handleNextMonth} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10"><ChevronRight size={16} /></button>
                            </div>
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                <div key={i} className="text-center text-[10px] font-bold text-gray-400 dark:text-white/30 py-1">{d}</div>
                            ))}
                            {padding.map((_, i) => <div key={`pad-${i}`} />)}
                            {days.map((day) => {
                                const log = getLogForDay(day);
                                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                const isSelected = selectedDate === dateStr;
                                const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

                                return (
                                    <button
                                        key={day}
                                        onClick={() => setSelectedDate(dateStr)}
                                        className={`
                                        aspect-square rounded-lg flex flex-col items-center justify-center relative transition-all text-xs
                                        ${isSelected ? 'ring-1 ring-primary-cyan ring-offset-1 ring-offset-dark-900' : ''}
                                        ${log?.completedIndices?.length
                                                ? 'bg-primary-cyan/20 text-white font-bold'
                                                : 'text-gray-400 dark:text-white/30 hover:bg-gray-100 dark:hover:bg-white/5'
                                            }
                                    `}
                                    >
                                        <span className={isToday ? 'text-primary-cyan' : ''}>{day}</span>
                                        {log?.completedIndices?.length ? (
                                            <div className="w-1 h-1 rounded-full bg-primary-cyan mt-0.5" />
                                        ) : null}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Selected Day Detail Pop-in */}
                        <AnimatePresence>
                            {selectedDate && selectedLog && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                    animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                    className="overflow-hidden border-t border-white/10"
                                >
                                    <div className="pt-3">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold uppercase text-white/50">{new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                            {selectedLog.energy && <span className="text-lg">{selectedLog.energy === 'high' ? '⚡' : selectedLog.energy === 'medium' ? '🌊' : '☁️'}</span>}
                                        </div>
                                        {selectedLog.intention && (
                                            <div className="mb-2 text-xs">
                                                <span className="text-primary-purple opacity-70">Anchor: </span>
                                                <span className="text-white/90">{selectedLog.intention}</span>
                                            </div>
                                        )}
                                        {selectedLog.note ? (
                                            <p className="text-sm text-white/80 italic">"{selectedLog.note}"</p>
                                        ) : (
                                            <p className="text-xs text-white/30">Bounce completed.</p>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </section>

                {/* Echoes (Journal) Section */}
                <section>
                    <div className="flex items-center gap-2 mb-4 text-orange-400">
                        <Activity size={20} />
                        <h2 className="text-sm font-bold uppercase tracking-wider">Journal & Voice Logs</h2>
                    </div>
                    <div className="space-y-3">
                        {recentLogs.length === 0 && (
                            <p className="text-center text-gray-400 dark:text-white/30 text-sm py-4 italic">No voice logs or notes yet.</p>
                        )}
                        {recentLogs.map((log, i) => (
                            <div key={i} className="bg-white dark:bg-white/5 p-4 rounded-2xl border border-gray-200 dark:border-white/10">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs text-gray-500 dark:text-white/40 font-mono">{log.date}</span>
                                    <div className="flex gap-2">
                                        {log.intention && <span className="text-xs bg-primary-purple/10 text-primary-purple px-2 py-0.5 rounded-md">{log.intention}</span>}
                                        {log.energy && (
                                            <span className="text-lg" title={`Energy: ${log.energy}`}>
                                                {log.energy === 'high' ? '⚡' : log.energy === 'medium' ? '🌊' : '☁️'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {log.note && (
                                    <p className="text-sm text-gray-800 dark:text-white/80 leading-relaxed whitespace-pre-wrap">"{log.note}"</p>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

            </div>
        </div>
    );
};
