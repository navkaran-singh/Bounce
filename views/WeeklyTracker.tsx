import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Check, ChevronLeft, ChevronRight, Sparkles, Calendar, Trophy, Target, Lock, Zap, Brain, Heart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// Types
interface Task {
    id: string;
    text: string;
    completed: boolean;
    energy: 'high' | 'medium' | 'low';
}

interface Habit {
    id: string;
    name: string;
    energy: 'high' | 'medium' | 'low';
    days: boolean[]; // 7 days, Sun-Sat
}

// Energy level colors and labels
const ENERGY_CONFIG = {
    high: { color: '#F59E0B', bgColor: '#FEF3C7', label: '⚡ High', emoji: '🔥' },
    medium: { color: '#3B82F6', bgColor: '#DBEAFE', label: '💪 Medium', emoji: '💪' },
    low: { color: '#7CBA59', bgColor: '#E8F5E0', label: '🌿 Low', emoji: '🌿' }
};

interface DayData {
    date: Date;
    dayName: string;
    shortDate: string;
    tasks: Task[];
}

type InterventionType = 'too-many-tasks' | 'perfect-day' | 'missed-day' | 'week-complete' | null;

// Helpers
const generateId = () => Math.random().toString(36).substring(2, 9);

const getWeekDates = (startDate: Date): DayData[] => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const week: DayData[] = [];

    for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        week.push({
            date,
            dayName: days[date.getDay()],
            shortDate: date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            tasks: []
        });
    }
    return week;
};

const getStartOfWeek = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
};

// Default habits for new users - with energy levels
const DEFAULT_HABITS: Habit[] = [
    { id: '1', name: 'Wake up at 06:00', energy: 'medium', days: [false, false, false, false, false, false, false] },
    { id: '2', name: 'No alcohol', energy: 'low', days: [false, false, false, false, false, false, false] },
    { id: '3', name: '1 hour social media max', energy: 'low', days: [false, false, false, false, false, false, false] },
    { id: '4', name: 'Gym workout', energy: 'high', days: [false, false, false, false, false, false, false] },
    { id: '5', name: 'Read 20 pages', energy: 'medium', days: [false, false, false, false, false, false, false] },
    { id: '6', name: 'Meditate 10 min', energy: 'low', days: [false, false, false, false, false, false, false] },
];

// ============ IDENTITY INFERENCE (Keyword Matching) ============
const IDENTITY_KEYWORDS: Record<string, { name: string; keywords: string[]; emoji: string }> = {
    fitness: { name: 'Fitness Enthusiast', emoji: '💪', keywords: ['gym', 'workout', 'run', 'running', 'exercise', 'lift', 'yoga', 'cardio', 'fitness', 'weights', 'pushup', 'squat'] },
    morning: { name: 'Morning Person', emoji: '🌅', keywords: ['wake', 'morning', 'early', '6:00', '5:00', '6am', '5am', 'sunrise', 'alarm'] },
    reader: { name: 'Lifelong Learner', emoji: '📚', keywords: ['read', 'book', 'study', 'learn', 'pages', 'reading', 'audiobook', 'course'] },
    writer: { name: 'Creator', emoji: '✍️', keywords: ['write', 'journal', 'blog', 'create', 'content', 'writing', 'notes', 'draft'] },
    mindful: { name: 'Mindful Person', emoji: '🧘', keywords: ['meditat', 'breathe', 'calm', 'mindful', 'mental', 'gratitude', 'reflect', 'peace'] },
    healthy: { name: 'Health-Conscious', emoji: '🥗', keywords: ['diet', 'water', 'sleep', 'health', 'nutrition', 'alcohol', 'vegetable', 'fruit', 'hydrat'] },
    productive: { name: 'Productivity Master', emoji: '🎯', keywords: ['task', 'focus', 'work', 'productivity', 'goal', 'plan', 'organize', 'schedule', 'priority'] },
    creative: { name: 'Creative Soul', emoji: '🎨', keywords: ['art', 'design', 'music', 'draw', 'paint', 'create', 'craft', 'photo', 'video'] },
    social: { name: 'Connector', emoji: '🤝', keywords: ['social', 'friend', 'family', 'call', 'connect', 'network', 'relationship', 'meet'] },
    financial: { name: 'Wealth Builder', emoji: '💰', keywords: ['budget', 'save', 'invest', 'money', 'finance', 'expense', 'income', 'track'] }
};

// Infer identity from tasks only (not habits from Weekly Habits section)
const inferIdentity = (tasks: Task[]): { identity: string; emoji: string } | null => {
    const allText = tasks.map(t => t.text.toLowerCase()).join(' ');

    const scores: Record<string, number> = {};

    for (const [key, config] of Object.entries(IDENTITY_KEYWORDS)) {
        scores[key] = config.keywords.filter(keyword => allText.includes(keyword)).length;
    }

    const topMatch = Object.entries(scores)
        .filter(([_, score]) => score > 0)
        .sort((a, b) => b[1] - a[1])[0];

    if (topMatch && topMatch[1] > 0) {
        const config = IDENTITY_KEYWORDS[topMatch[0]];
        return { identity: config.name, emoji: config.emoji };
    }

    return null;
};

// ============ INTERVENTION MODAL COMPONENT ============
const InterventionModal: React.FC<{
    type: InterventionType;
    onClose: () => void;
    dayName?: string;
}> = ({ type, onClose, dayName }) => {
    if (!type) return null;

    const content = {
        'too-many-tasks': {
            emoji: '🤔',
            title: 'That\'s ambitious!',
            message: 'Research shows 3 focused habits beats 10 scattered tasks. Bounce uses science to recommend the right 3 habits for your identity.',
            cta: 'See Science-Backed Habits',
            color: 'from-amber-500 to-orange-500'
        },
        'perfect-day': {
            emoji: '🎉',
            title: 'Perfect day!',
            message: 'Amazing work! But will you maintain this next month? Bounce\'s 4-stage evolution system ensures lasting change - habits that grow with you.',
            cta: 'Build Lasting Habits',
            color: 'from-emerald-500 to-green-500'
        },
        'missed-day': {
            emoji: '💪',
            title: 'Missed a day?',
            message: 'In most apps, that breaks your streak. In Bounce, this triggers our Resilience Engine — you\'d earn bonus points for bouncing back. Failure becomes your advantage.',
            cta: 'Turn Failure Into Strength',
            color: 'from-blue-500 to-indigo-500'
        },
        'week-complete': {
            emoji: '🏆',
            title: 'One week tracked!',
            message: 'You\'ve proven you can track tasks. But are these the RIGHT tasks? Bounce uses AI to suggest habits aligned with who you want to become — not just what you want to do.',
            cta: 'Discover Your Identity Habits',
            color: 'from-purple-500 to-pink-500'
        }
    };

    const c = content[type];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`bg-gradient-to-r ${c.color} p-6 text-center text-white`}>
                    <span className="text-5xl">{c.emoji}</span>
                    <h3 className="text-2xl font-bold mt-3">{c.title}</h3>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-gray-600 text-center mb-6 leading-relaxed">
                        {c.message}
                    </p>

                    <div className="space-y-3">
                        <Link
                            to="/app"
                            className={`w-full py-3 bg-gradient-to-r ${c.color} text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all`}
                        >
                            <Sparkles size={18} />
                            {c.cta}
                        </Link>
                        <button
                            onClick={onClose}
                            className="w-full py-3 text-gray-500 hover:bg-gray-50 rounded-xl transition-colors"
                        >
                            Continue tracking
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

// ============ LOCKED HABIT TRACKER OVERLAY ============
const LockedHabitTracker: React.FC = () => (
    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-6 z-10">
        <div className="w-16 h-16 bg-gradient-to-br from-[#7CBA59] to-[#5A9A3A] rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Lock className="text-white" size={28} />
        </div>
        <h4 className="text-lg font-bold text-gray-800 mb-2 text-center">Connect to Bounce</h4>
        <p className="text-sm text-gray-500 text-center mb-4">
            Track persistent habits across weeks with science-backed recommendations
        </p>
        <Link
            to="/app"
            className="px-6 py-2.5 bg-gradient-to-r from-[#7CBA59] to-[#5A9A3A] text-white rounded-full font-medium flex items-center gap-2 hover:shadow-lg transition-all"
        >
            <Sparkles size={16} />
            Unlock with Bounce
        </Link>
    </div>
);

// Circular Progress Component
const CircularProgress: React.FC<{
    percentage: number;
    size?: number;
    strokeWidth?: number;
    showText?: boolean;
}> = ({ percentage, size = 100, strokeWidth = 10, showText = true }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="#E8F5E0"
                    strokeWidth={strokeWidth}
                />
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="#7CBA59"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                />
            </svg>
            {showText && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-bold text-gray-700 text-2xl">
                        {Math.round(percentage)}%
                    </span>
                </div>
            )}
        </div>
    );
};

// Bar Chart Component with gridlines - Fixed Y-axis 0-6
const BarChart: React.FC<{ data: number[]; labels: string[] }> = ({ data, labels }) => {
    // Fixed max of 6 tasks per day
    const maxValue = 6;

    return (
        <div className="relative h-64">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between text-xs text-gray-400">
                <span>6</span>
                <span>5</span>
                <span>4</span>
                <span>3</span>
                <span>2</span>
                <span>1</span>
                <span>0</span>
            </div>

            {/* Chart area */}
            <div className="ml-10 h-56 relative border-l border-b border-gray-200">
                {/* Horizontal grid lines */}
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                        key={i}
                        className="absolute left-0 right-0 border-t border-gray-100"
                        style={{ bottom: `${(i / 6) * 100}%` }}
                    />
                ))}

                {/* Bars container */}
                <div className="absolute inset-0 flex items-end justify-around px-2">
                    {data.map((value, index) => {
                        const heightPercent = (value / maxValue) * 100;
                        return (
                            <div key={index} className="flex-1 mx-1 relative" style={{ height: '100%' }}>
                                {/* Bar - positioned from bottom */}
                                <div
                                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#7CBA59] to-[#9ED47A] rounded-t-md"
                                    style={{ height: `${heightPercent}%` }}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* X-axis labels */}
            <div className="ml-10 flex justify-around px-2 mt-2">
                {labels.map((label, index) => (
                    <span key={index} className="flex-1 text-center text-xs text-gray-500 font-medium">
                        {label}
                    </span>
                ))}
            </div>
        </div>
    );
};

// Horizontal Progress Bar for Habit Tracker
const HabitProgressBar: React.FC<{ completed: number; total: number; color?: string }> = ({ completed, total, color = '#7CBA59' }) => {
    const percentage = total > 0 ? (completed / total) * 100 : 0;

    return (
        <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.5 }}
            />
        </div>
    );
};

// Consistency Graph (Area Chart) - Smooth Spline Version
const ConsistencyGraph: React.FC<{
    data: {
        date: string;
        high: number;
        medium: number;
        low: number;
    }[]
}> = ({ data }) => {
    const height = 180;
    const width = 800;
    const paddingLeft = 10;
    const paddingRight = 10;
    const paddingTop = 20;
    const paddingBottom = 20;

    // Find max value for scaling (default min 4 to keep some scale)
    const maxVal = Math.max(4, ...data.map(d => Math.max(d.high, d.medium, d.low)));

    const getX = (index: number) => paddingLeft + (index * (width - paddingLeft - paddingRight)) / Math.max(1, data.length - 1);
    const getY = (val: number) => height - paddingBottom - (val * (height - paddingTop - paddingBottom)) / maxVal;

    // Cardinal spline interpolation for smooth curves
    const generateSplinePath = (key: 'high' | 'medium' | 'low', tension: number = 0.4): string => {
        if (data.length < 2) return "";

        const points = data.map((d, i) => ({ x: getX(i), y: getY(d[key]) }));

        let path = `M ${points[0].x} ${points[0].y}`;

        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[Math.max(0, i - 1)];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = points[Math.min(points.length - 1, i + 2)];

            const cp1x = p1.x + (p2.x - p0.x) * tension / 3;
            const cp1y = p1.y + (p2.y - p0.y) * tension / 3;
            const cp2x = p2.x - (p3.x - p1.x) * tension / 3;
            const cp2y = p2.y - (p3.y - p1.y) * tension / 3;

            path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
        }

        return path;
    };

    const generateSplineAreaPath = (key: 'high' | 'medium' | 'low', tension: number = 0.4): string => {
        const linePath = generateSplinePath(key, tension);
        if (!linePath) return "";

        // Close the area by going to bottom-right, bottom-left, then back to start
        return `${linePath} L ${getX(data.length - 1)} ${height - paddingBottom} L ${getX(0)} ${height - paddingBottom} Z`;
    };

    return (
        <div className="bg-white rounded-2xl p-6 border border-[#E8F5E0] shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[#5A9A3A] flex items-center gap-2">
                    <Trophy size={22} />
                    Consistency Graph
                </h3>
                <div className="flex gap-4 text-xs font-medium">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ENERGY_CONFIG.high.color }} />
                        <span className="text-gray-500">High</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ENERGY_CONFIG.medium.color }} />
                        <span className="text-gray-500">Medium</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ENERGY_CONFIG.low.color }} />
                        <span className="text-gray-500">Low</span>
                    </div>
                </div>
            </div>

            <div className="relative h-[180px] w-full">
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="w-full h-full overflow-visible"
                    preserveAspectRatio="none"
                >
                    {/* Subtle horizontal grid lines only */}
                    {[1, 2, 3].map((i) => {
                        const y = getY((maxVal / 4) * i);
                        return (
                            <line
                                key={i}
                                x1={paddingLeft}
                                y1={y}
                                x2={width - paddingRight}
                                y2={y}
                                stroke="#F0F0F0"
                                strokeWidth="1"
                                strokeDasharray="4 4"
                            />
                        );
                    })}

                    {/* Low Energy Area - Bottom layer */}
                    <path
                        d={generateSplineAreaPath('low')}
                        fill={ENERGY_CONFIG.low.color}
                        fillOpacity="0.25"
                    />
                    <path
                        d={generateSplinePath('low')}
                        fill="none"
                        stroke={ENERGY_CONFIG.low.color}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Medium Energy Area - Middle layer */}
                    <path
                        d={generateSplineAreaPath('medium')}
                        fill={ENERGY_CONFIG.medium.color}
                        fillOpacity="0.2"
                    />
                    <path
                        d={generateSplinePath('medium')}
                        fill="none"
                        stroke={ENERGY_CONFIG.medium.color}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* High Energy Area - Top layer */}
                    <path
                        d={generateSplineAreaPath('high')}
                        fill={ENERGY_CONFIG.high.color}
                        fillOpacity="0.2"
                    />
                    <path
                        d={generateSplinePath('high')}
                        fill="none"
                        stroke={ENERGY_CONFIG.high.color}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Smaller solid markers - only on notable points */}
                    {data.map((d, i) => {
                        const hasData = d.high > 0 || d.medium > 0 || d.low > 0;
                        if (!hasData) return null;
                        return (
                            <g key={i}>
                                {d.low > 0 && (
                                    <circle
                                        cx={getX(i)}
                                        cy={getY(d.low)}
                                        r="4"
                                        fill={ENERGY_CONFIG.low.color}
                                    />
                                )}
                                {d.medium > 0 && (
                                    <circle
                                        cx={getX(i)}
                                        cy={getY(d.medium)}
                                        r="4"
                                        fill={ENERGY_CONFIG.medium.color}
                                    />
                                )}
                                {d.high > 0 && (
                                    <circle
                                        cx={getX(i)}
                                        cy={getY(d.high)}
                                        r="4"
                                        fill={ENERGY_CONFIG.high.color}
                                    />
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* X-Axis Dates */}
            <div className="flex justify-between mt-2 px-1">
                {data.filter((_, i) => i % 5 === 0 || i === data.length - 1).map((d, i) => (
                    <span key={i} className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                        {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                ))}
            </div>
        </div>
    );
};

// Day Card Component
const DayCard: React.FC<{
    day: DayData;
    onAddTask: (dayIndex: number, text: string, energy: 'high' | 'medium' | 'low') => void;
    onToggleTask: (dayIndex: number, taskId: string) => void;
    onDeleteTask: (dayIndex: number, taskId: string) => void;
    dayIndex: number;
    isToday: boolean;
}> = ({ day, onAddTask, onToggleTask, onDeleteTask, dayIndex, isToday }) => {
    const [newTask, setNewTask] = useState('');
    const [newTaskEnergy, setNewTaskEnergy] = useState<'high' | 'medium' | 'low'>('medium');
    const [isAdding, setIsAdding] = useState(false);

    const completedCount = day.tasks.filter(t => t.completed).length;
    const totalCount = day.tasks.length;
    const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTask.trim()) {
            onAddTask(dayIndex, newTask.trim(), newTaskEnergy);
            setNewTask('');
            setNewTaskEnergy('medium');
            setIsAdding(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: dayIndex * 0.03 }}
            className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden flex flex-col min-h-[420px] ${isToday ? 'border-[#7CBA59] ring-2 ring-[#7CBA59]/20' : 'border-[#E8F5E0]'
                }`}
        >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#7CBA59] to-[#8FC96A] px-4 py-3 text-white">
                <h3 className="font-bold text-lg">{day.dayName}</h3>
                <p className="text-white/80 text-sm">{day.shortDate}</p>
            </div>

            {/* Progress Ring */}
            <div className="flex justify-center py-6 bg-gradient-to-b from-[#F8FBF6] to-white">
                <CircularProgress percentage={percentage} size={110} strokeWidth={12} />
            </div>

            {/* Tasks Section */}
            <div className="px-4 pb-4 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-3 border-b border-[#E8F5E0] pb-2">
                    <span className="text-sm font-bold text-[#7CBA59] uppercase tracking-wide">Tasks</span>
                    <span className="text-xs text-gray-400 font-medium">{completedCount}/{totalCount}</span>
                </div>

                {/* Task List */}
                <div className="space-y-1.5 flex-1 min-h-[140px] max-h-[180px] overflow-y-auto">
                    <AnimatePresence>
                        {day.tasks.map((task) => {
                            const taskEnergy = ENERGY_CONFIG[task.energy || 'medium'];
                            return (
                                <motion.div
                                    key={task.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className={`flex items-start gap-2 px-2 py-1.5 rounded transition-all cursor-pointer group`}
                                    style={{
                                        backgroundColor: task.completed ? taskEnergy.color : 'transparent'
                                    }}
                                    onClick={() => onToggleTask(dayIndex, task.id)}
                                >
                                    <div
                                        className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center mt-0.5`}
                                        style={{
                                            backgroundColor: task.completed ? 'white' : 'transparent',
                                            borderColor: task.completed ? 'white' : taskEnergy.color
                                        }}
                                    >
                                        {task.completed && <Check size={10} style={{ color: taskEnergy.color }} />}
                                    </div>
                                    {/* Energy indicator dot */}
                                    {!task.completed && (
                                        <span
                                            className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                                            style={{ backgroundColor: taskEnergy.color }}
                                        />
                                    )}
                                    <span className={`text-sm flex-1 leading-tight ${task.completed ? 'line-through text-white opacity-90' : 'text-gray-700'}`}>
                                        {task.text}
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteTask(dayIndex, task.id);
                                        }}
                                        className={`opacity-0 group-hover:opacity-100 transition-opacity ${task.completed ? 'text-white/70 hover:text-white' : 'text-gray-400 hover:text-red-400'
                                            }`}
                                    >
                                        <X size={14} />
                                    </button>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {day.tasks.length === 0 && !isAdding && (
                        <p className="text-gray-300 text-xs text-center py-6 italic">No tasks yet</p>
                    )}
                </div>

                {/* Add Task */}
                {isAdding ? (
                    <form onSubmit={handleSubmit} className="mt-3 pt-3 border-t border-[#E8F5E0]">
                        <input
                            type="text"
                            value={newTask}
                            onChange={(e) => setNewTask(e.target.value)}
                            placeholder="Enter task..."
                            className="w-full px-3 py-2 text-sm text-gray-700 bg-white border-2 border-[#7CBA59] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7CBA59]/30"
                            autoFocus
                        />
                        {/* Energy Selector */}
                        <div className="flex gap-1.5 mt-2">
                            {(['high', 'medium', 'low'] as const).map((level) => {
                                const config = ENERGY_CONFIG[level];
                                return (
                                    <button
                                        key={level}
                                        type="button"
                                        onClick={() => setNewTaskEnergy(level)}
                                        className={`flex-1 px-2 py-1 rounded text-xs font-medium flex items-center justify-center gap-1 transition-all ${newTaskEnergy === level
                                            ? 'ring-2 ring-offset-1'
                                            : 'opacity-50 hover:opacity-80'
                                            }`}
                                        style={{
                                            backgroundColor: config.bgColor,
                                            color: config.color
                                        }}
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.color }} />
                                        {level.charAt(0).toUpperCase()}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="flex gap-2 mt-2">
                            <button
                                type="submit"
                                className="flex-1 bg-[#7CBA59] text-white py-1.5 rounded-lg text-sm font-medium hover:bg-[#6BA84A] transition-colors"
                            >
                                Add
                            </button>
                            <button
                                type="button"
                                onClick={() => { setIsAdding(false); setNewTask(''); setNewTaskEnergy('medium'); }}
                                className="px-3 py-1.5 text-gray-500 hover:bg-gray-100 rounded-lg text-sm transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                ) : (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="mt-3 w-full py-2 border-2 border-dashed border-[#7CBA59]/40 rounded-lg text-[#7CBA59] text-sm font-medium hover:border-[#7CBA59] hover:bg-[#F8FBF6] transition-all flex items-center justify-center gap-1"
                    >
                        <Plus size={16} />
                        Add Task
                    </button>
                )}
            </div>
        </motion.div>
    );
};

// ============ MAIN COMPONENT ============
export const WeeklyTracker: React.FC = () => {
    const [weekStart, setWeekStart] = useState(() => getStartOfWeek(new Date()));
    const [weekData, setWeekData] = useState<DayData[]>(() => getWeekDates(getStartOfWeek(new Date())));
    const [habits, setHabits] = useState<Habit[]>(DEFAULT_HABITS);
    const [weeklyGoal, setWeeklyGoal] = useState('Inspiration comes only during work');
    const [isEditingGoal, setIsEditingGoal] = useState(false);
    const [newHabitName, setNewHabitName] = useState('');
    const [newHabitEnergy, setNewHabitEnergy] = useState<'high' | 'medium' | 'low'>('medium');
    const [isAddingHabit, setIsAddingHabit] = useState(false);

    // Dev mode: hide mirror question for video recording
    const isDev = import.meta.env.DEV;
    const [hideMirrorQuestion, setHideMirrorQuestion] = useState(false);

    // ========== DEMO MODE FOR VIDEO RECORDING ==========
    const [demoMode, setDemoMode] = useState(false);
    const [demoProgress, setDemoProgress] = useState(0); // 0-30 (days)
    const [demoData, setDemoData] = useState<{ date: string; high: number; medium: number; low: number }[]>([]);
    const [demoWeekData, setDemoWeekData] = useState<DayData[] | null>(null); // Demo data for day cards

    // Demo task templates
    const demoTaskPool = {
        high: ['🏋️ Gym workout', '🏃 Morning run', '💪 HIIT session', '🚴 Cycling'],
        medium: ['📚 Read 30 pages', '✍️ Journal entry', '🎯 Deep work 2hr', '🧘 Yoga'],
        low: ['💧 8 glasses water', '🚶 Walk 15min', '🧘 Meditate 10min', '😴 Sleep by 10pm']
    };

    // Start demo with 1 second delay
    const startDemo = () => {
        setDemoMode(true);
        setDemoProgress(-1); // -1 means "waiting to start"
        setDemoData([]);
        setDemoWeekData(null);
    };

    // Demo mode animation effect
    useEffect(() => {
        if (!demoMode) return;

        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        const currentWeekStartDate = getStartOfWeek(todayDate);

        // 1 second delay before starting
        const startDelay = demoProgress === -1 ? 1000 : 0;

        const timeout = setTimeout(() => {
            const interval = setInterval(() => {
                setDemoProgress(prev => {
                    const current = prev === -1 ? 0 : prev;
                    if (current >= 30) {
                        clearInterval(interval);
                        return 30;
                    }

                    const nextProgress = current + 1;


                    // Build consistency graph data - synced with two-phase animation
                    // Phase 1 (progress 1-15): Graph stays at zero (tasks not completed yet)
                    // Phase 2 (progress 16-30): Graph shows completed tasks progressively
                    const newGraphData = [];
                    for (let i = 29; i >= 0; i--) {
                        const date = new Date(todayDate);
                        date.setDate(date.getDate() - i);
                        const dateStr = date.toISOString().split('T')[0];
                        const dayIndex = 29 - i; // 0 = oldest, 29 = today

                        // Only show graph data once we're in Phase 2 (completing tasks)
                        // Map dayIndex to when its tasks get completed
                        // dayIndex 0's first task completes at progress 16, second at 17, etc.
                        const dayCompletionProgress = 16 + (dayIndex * 0.5); // Spread 30 days over progress 16-30

                        if (nextProgress >= dayCompletionProgress) {
                            // Calculate how many tasks are completed for this day
                            // based on how far we are past the day's completion progress
                            const completionRatio = Math.min(1, (nextProgress - dayCompletionProgress + 1) / 3);
                            const seed = dayIndex * 7;
                            const high = Math.round(((seed % 3) + (dayIndex > 20 ? 1 : 0)) * completionRatio);
                            const medium = Math.round((((seed + 2) % 3) + (dayIndex > 15 ? 1 : 0)) * completionRatio);
                            const low = Math.round((((seed + 4) % 2) + 1) * completionRatio);
                            newGraphData.push({ date: dateStr, high, medium, low });
                        } else {
                            newGraphData.push({ date: dateStr, high: 0, medium: 0, low: 0 });
                        }
                    }
                    setDemoData(newGraphData);


                    // Generate demo week data for day cards
                    // Animation has TWO PHASES:
                    // Phase 1 (progress 1-15): Add tasks (incomplete)
                    // Phase 2 (progress 16-30): Complete tasks gradually
                    const demoWeek = getWeekDates(currentWeekStartDate).map((day, dayIdx) => {
                        const tasks: Task[] = [];

                        // Each day can have 2-4 tasks
                        const numTasks = 2 + (dayIdx % 3); // 2-4 tasks per day

                        // Phase 1: Tasks appear during progress 1-15 (spread across 7 days)
                        // Day 0: tasks appear at progress 1,2
                        // Day 1: tasks appear at progress 3,4
                        // Day 2: tasks appear at progress 5,6
                        // etc.
                        const taskAddBaseProgress = dayIdx * 2;

                        for (let t = 0; t < numTasks; t++) {
                            const taskAppearsAt = taskAddBaseProgress + t + 1;

                            if (nextProgress >= taskAppearsAt) {
                                const energy: 'high' | 'medium' | 'low' = (['high', 'medium', 'low'] as const)[t % 3];
                                const pool = demoTaskPool[energy];

                                // Phase 2: Tasks get completed during progress 16-30
                                // Calculate when this specific task should be marked complete
                                // Total tasks = ~21, spread over progress 16-30 (15 steps)
                                const globalTaskIndex = dayIdx * 4 + t; // unique index for each task
                                const taskCompletesAt = 16 + globalTaskIndex; // Complete one task per step starting at 16
                                const isCompleted = nextProgress >= taskCompletesAt;

                                tasks.push({
                                    id: `demo-${dayIdx}-${t}`,
                                    text: pool[(dayIdx + t) % pool.length],
                                    completed: isCompleted,
                                    energy
                                });
                            }
                        }
                        return { ...day, tasks };
                    });
                    setDemoWeekData(demoWeek);

                    return nextProgress;
                });
            }, 150); // 150ms per day

            return () => clearInterval(interval);
        }, startDelay);

        return () => clearTimeout(timeout);
    }, [demoMode, demoProgress === -1]);

    // Reset demo
    const resetDemo = () => {
        setDemoMode(false);
        setDemoProgress(0);
        setDemoData([]);
        setDemoWeekData(null);
    };

    // ========== SEO & DOCUMENT TITLE ==========
    useEffect(() => {
        const originalTitle = document.title;
        document.title = "Weekly Task Tracker | Bounce - Resilience-Based Fitness & Habits";

        // Add meta description if it doesn't exist
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.setAttribute('name', 'description');
            document.head.appendChild(metaDesc);
        }
        const originalDesc = metaDesc.getAttribute('content') || "";
        metaDesc.setAttribute('content', "Plan your week, track your tasks, and build a lasting identity with the Bounce Weekly Tracker. Built for resilience, not just streaks.");

        return () => {
            document.title = originalTitle;
            if (metaDesc) metaDesc.setAttribute('content', originalDesc);
        };
    }, []);

    // Intervention state
    const [intervention, setIntervention] = useState<InterventionType>(null);
    const [shownInterventions, setShownInterventions] = useState<Set<string>>(() => {
        const saved = localStorage.getItem('trackerInterventionsShown');
        return saved ? new Set(JSON.parse(saved)) : new Set();
    });

    // Track usage for soft limitations
    const [daysUsed, setDaysUsed] = useState<number>(() => {
        const saved = localStorage.getItem('trackerDaysUsed');
        return saved ? parseInt(saved, 10) : 0;
    });
    const [firstUseDate, setFirstUseDate] = useState<string | null>(() => {
        return localStorage.getItem('trackerFirstUseDate');
    });

    // Check if habit tracker should be locked (after 7 days) - bypass in dev mode
    const isHabitTrackerLocked = !isDev && daysUsed >= 7;

    // Track first use date
    useEffect(() => {
        if (!firstUseDate) {
            const today = new Date().toISOString().split('T')[0];
            setFirstUseDate(today);
            localStorage.setItem('trackerFirstUseDate', today);
        }
    }, [firstUseDate]);

    // Track days used
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        const lastVisit = localStorage.getItem('trackerLastVisit');

        if (lastVisit !== today) {
            const newDaysUsed = daysUsed + 1;
            setDaysUsed(newDaysUsed);
            localStorage.setItem('trackerDaysUsed', String(newDaysUsed));
            localStorage.setItem('trackerLastVisit', today);

            // Show week-complete intervention after 7 days
            if (newDaysUsed === 7 && !shownInterventions.has('week-complete')) {
                setTimeout(() => setIntervention('week-complete'), 1000);
            }
        }
    }, [daysUsed, shownInterventions]);

    // Save shown interventions
    useEffect(() => {
        localStorage.setItem('trackerInterventionsShown', JSON.stringify([...shownInterventions]));
    }, [shownInterventions]);

    const showIntervention = useCallback((type: InterventionType) => {
        if (type && !shownInterventions.has(type)) {
            setIntervention(type);
            setShownInterventions(prev => new Set([...prev, type]));
        }
    }, [shownInterventions]);

    const closeIntervention = () => setIntervention(null);

    // Load from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(`weeklyTracker_${weekStart.toISOString().split('T')[0]}`);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setWeekData(prev => prev.map((day, i) => ({
                    ...day,
                    // Backward compatibility: Add default energy to old tasks that don't have it
                    tasks: (parsed.tasks?.[i] || []).map((t: any) => ({
                        ...t,
                        energy: t.energy || 'medium'
                    }))
                })));
                if (parsed.goal) setWeeklyGoal(parsed.goal);
                if (parsed.habits) {
                    // Backward compatibility: Add default energy to old habits that don't have it
                    const habitsWithEnergy = parsed.habits.map((h: any) => ({
                        ...h,
                        energy: h.energy || 'medium' // Default to medium if not present
                    }));
                    setHabits(habitsWithEnergy);
                }
            } catch (e) {
                console.error('Failed to load saved data');
            }
        } else {
            setWeekData(getWeekDates(weekStart));
            setHabits(DEFAULT_HABITS.map(h => ({ ...h, days: [false, false, false, false, false, false, false] })));
        }
    }, [weekStart]);

    // Track if initial load is complete (prevents save from overwriting loaded data)
    const [isInitialized, setIsInitialized] = useState(false);
    useEffect(() => {
        // Mark as initialized after first load completes
        const timer = setTimeout(() => setIsInitialized(true), 100);
        return () => clearTimeout(timer);
    }, [weekStart]);

    // Save to localStorage (only after initial load)
    useEffect(() => {
        if (!isInitialized) return; // Skip save until initial load is complete

        const data = {
            tasks: weekData.map(d => d.tasks),
            goal: weeklyGoal,
            habits: habits
        };
        localStorage.setItem(`weeklyTracker_${weekStart.toISOString().split('T')[0]}`, JSON.stringify(data));
        console.log('[WeeklyTracker] Saved to localStorage:', `weeklyTracker_${weekStart.toISOString().split('T')[0]}`);
    }, [weekData, weeklyGoal, habits, weekStart, isInitialized]);

    const navigateWeek = (direction: 'prev' | 'next') => {
        const newStart = new Date(weekStart);
        newStart.setDate(weekStart.getDate() + (direction === 'next' ? 7 : -7));
        setWeekStart(newStart);
        setWeekData(getWeekDates(newStart));
    };

    const addTask = (dayIndex: number, text: string, energy: 'high' | 'medium' | 'low' = 'medium') => {
        const currentTasks = weekData[dayIndex].tasks.length;

        // Limit: Max 6 tasks per day
        if (currentTasks >= 6) {
            showIntervention('too-many-tasks');
            return; // Don't add more tasks
        }

        // Intervention: Show warning at 4+ tasks (but still allow up to 6)
        if (currentTasks >= 3) {
            showIntervention('too-many-tasks');
        }

        setWeekData(prev => prev.map((day, i) =>
            i === dayIndex
                ? { ...day, tasks: [...day.tasks, { id: generateId(), text, completed: false, energy }] }
                : day
        ));
    };

    const toggleTask = (dayIndex: number, taskId: string) => {
        setWeekData(prev => {
            const newData = prev.map((day, i) =>
                i === dayIndex
                    ? { ...day, tasks: day.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t) }
                    : day
            );

            // Check for perfect day (100% completion)
            const updatedDay = newData[dayIndex];
            const allCompleted = updatedDay.tasks.length > 0 && updatedDay.tasks.every(t => t.completed);
            if (allCompleted && updatedDay.tasks.length >= 2) {
                setTimeout(() => showIntervention('perfect-day'), 500);
            }

            return newData;
        });
    };

    const deleteTask = (dayIndex: number, taskId: string) => {
        setWeekData(prev => prev.map((day, i) =>
            i === dayIndex
                ? { ...day, tasks: day.tasks.filter(t => t.id !== taskId) }
                : day
        ));
    };

    const toggleHabitDay = (habitId: string, dayIndex: number) => {
        setHabits(prev => prev.map(h =>
            h.id === habitId
                ? { ...h, days: h.days.map((d, i) => i === dayIndex ? !d : d) }
                : h
        ));
    };

    const addHabit = () => {
        if (newHabitName.trim()) {
            setHabits(prev => [...prev, {
                id: generateId(),
                name: newHabitName.trim(),
                energy: newHabitEnergy,
                days: [false, false, false, false, false, false, false]
            }]);
            setNewHabitName('');
            setNewHabitEnergy('medium');
            setIsAddingHabit(false);
        }
    };

    const deleteHabit = (habitId: string) => {
        setHabits(prev => prev.filter(h => h.id !== habitId));
    };


    // Calculate stats - use demo data when in demo mode
    const activeWeekData = demoMode && demoWeekData ? demoWeekData : weekData;
    const totalTasks = activeWeekData.reduce((sum, day) => sum + day.tasks.length, 0);
    const completedTasks = activeWeekData.reduce((sum, day) => sum + day.tasks.filter(t => t.completed).length, 0);
    const overallPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    // Completed tasks per day (for bar chart) - from Day Cards
    const dailyCompletedCounts = activeWeekData.map(day => day.tasks.filter(t => t.completed).length);
    const barLabels = activeWeekData.map(day => day.dayName.slice(0, 3)); // Sun, Mon, Tue, etc.


    // Calculate Consistency Graph Data (Last 30 Days)
    const consistencyData = React.useMemo(() => {
        const data = [];
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);

        // Current week start (for comparing with weekData)
        const currentWeekStartStr = weekStart.toISOString().split('T')[0];

        for (let i = 29; i >= 0; i--) {
            const date = new Date(todayDate);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            // Get week start for this date
            const weekStartForDate = getStartOfWeek(date);
            const weekStartStr = weekStartForDate.toISOString().split('T')[0];

            let counts = { high: 0, medium: 0, low: 0 };

            // Check if this date is in the CURRENT week (use live weekData state)
            if (weekStartStr === currentWeekStartStr) {
                // Use live weekData for current week
                const dayOfWeek = date.getDay();
                const dayTasks = weekData[dayOfWeek]?.tasks || [];

                const completed = dayTasks.filter((t: Task) => t.completed);
                counts.high = completed.filter((t: Task) => t.energy === 'high').length;
                counts.medium = completed.filter((t: Task) => t.energy === 'medium').length;
                counts.low = completed.filter((t: Task) => t.energy === 'low').length;
            } else {
                // Use localStorage for past weeks
                const key = `weeklyTracker_${weekStartStr}`;
                const saved = localStorage.getItem(key);

                if (saved) {
                    try {
                        const parsed = JSON.parse(saved);
                        const dayOfWeek = date.getDay();
                        const dayTasks = parsed.tasks?.[dayOfWeek] || [];

                        const completed = dayTasks.filter((t: any) => t.completed);
                        counts.high = completed.filter((t: any) => t.energy === 'high').length;
                        counts.medium = completed.filter((t: any) => t.energy === 'medium').length;
                        counts.low = completed.filter((t: any) => t.energy === 'low').length;
                    } catch (e) { }
                }
            }

            data.push({
                date: dateStr,
                ...counts
            });
        }
        return data;
    }, [weekData, weekStart]); // Recalculate when weekData or weekStart changes



    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F5F9F2] via-[#FAFCF8] to-[#F0F7EB]">
            {/* Intervention Modal */}
            <AnimatePresence>
                {intervention && (
                    <InterventionModal type={intervention} onClose={closeIntervention} />
                )}
            </AnimatePresence>

            {/* Header */}
            <header className="bg-white/90 backdrop-blur-md border-b border-[#E8F5E0] sticky top-0 z-40 shadow-sm">
                <div className="max-w-[1800px] mx-auto px-4 md:px-6 py-3 md:py-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-[#7CBA59] to-[#5A9A3A] rounded-xl flex items-center justify-center shadow-lg shadow-[#7CBA59]/20 flex-shrink-0">
                                <Calendar className="text-white" size={22} />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-lg md:text-2xl font-bold text-[#5A9A3A] truncate">Weekly Task Tracker</h1>
                                <p className="text-xs md:text-sm text-gray-400 hidden sm:block">Plan your week, crush your tasks</p>
                            </div>
                        </div>
                        <Link
                            to="/app"
                            className="px-3 md:px-6 py-2 md:py-3 bg-gradient-to-r from-[#7CBA59] to-[#5A9A3A] text-white rounded-full text-xs md:text-sm font-semibold hover:shadow-lg hover:shadow-[#7CBA59]/30 transition-all flex items-center gap-1 md:gap-2 flex-shrink-0 whitespace-nowrap"
                        >
                            <Sparkles size={16} className="hidden sm:block" />
                            <span className="sm:hidden">Try Bounce</span>
                            <span className="hidden sm:inline">Get Personalized Habits</span>
                        </Link>
                    </div>
                </div>
            </header>
            <main className="max-w-[1800px] mx-auto px-6 py-8">
                {/* PERSONALIZED IDENTITY HOOK - Dynamic based on habits/tasks */}
                {!hideMirrorQuestion && (() => {
                    const allTasks = weekData.flatMap(d => d.tasks);
                    const inferredIdentity = inferIdentity(allTasks);
                    const totalTasksCount = allTasks.length;

                    return (
                        <div
                            className="bg-gradient-to-r from-[#F8FBF6] to-[#F0F7EB] border border-[#E8F5E0] rounded-xl md:rounded-2xl p-4 md:p-5 mb-6 md:mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4 relative"
                            onClick={isDev ? () => setHideMirrorQuestion(true) : undefined}
                            style={isDev ? { cursor: 'pointer' } : undefined}
                        >
                            {isDev && (
                                <span className="absolute top-2 right-2 text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Dev: click to hide</span>
                            )}
                            <div className="flex items-center gap-3 md:gap-4">
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-xl md:text-2xl flex-shrink-0">
                                    {inferredIdentity ? inferredIdentity.emoji : <Brain className="text-[#7CBA59]" size={20} />}
                                </div>
                                <div className="min-w-0">
                                    {inferredIdentity ? (
                                        <>
                                            <p className="text-sm md:text-base text-gray-800 font-medium">
                                                You're becoming <span className="text-[#5A9A3A] font-bold">{inferredIdentity.identity}</span>
                                            </p>
                                            <p className="text-xs md:text-sm text-gray-500">Get personalized habits in Bounce</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-sm md:text-base text-gray-800 font-medium">
                                                {totalTasksCount > 0 ? 'Add more tasks to discover your identity!' : 'Start tracking to find your identity'}
                                            </p>
                                            <p className="text-xs md:text-sm text-gray-500">Bounce analyzes your patterns</p>
                                        </>
                                    )}
                                </div>
                            </div>
                            <Link
                                to="/app"
                                className="flex items-center gap-1.5 md:gap-2 bg-[#5A9A3A] text-white px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-semibold hover:bg-[#4A8A2A] transition-colors whitespace-nowrap w-full md:w-auto justify-center md:justify-start"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {inferredIdentity ? 'See My Habits' : 'Get Started'}
                                <ArrowRight size={14} />
                            </Link>
                        </div>
                    );
                })()}

                {/* Demo Mode Button (Dev Only) - Below personalized habits, hidden during recording */}
                {isDev && (
                    <div className="mb-8 flex gap-2">
                        <button
                            onClick={startDemo}
                            disabled={demoMode && demoProgress !== 30}
                            className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                        >
                            {demoMode && demoProgress === -1 ? (
                                <>⏳ Starting in 1s...</>
                            ) : demoMode && demoProgress >= 0 && demoProgress < 30 ? (
                                <>📹 Recording... {demoProgress}/30</>
                            ) : (
                                <>🎬 Start Demo Animation</>
                            )}
                        </button>
                        {demoMode && (
                            <button
                                onClick={resetDemo}
                                className="py-3 px-6 bg-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-300 transition-all"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                )}

                {/* Week Navigation & Goal */}
                <div className="bg-white rounded-2xl shadow-sm border border-[#E8F5E0] p-6 mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        {/* Weekly Goal */}
                        <div className="flex-1">
                            {isEditingGoal ? (
                                <input
                                    type="text"
                                    value={weeklyGoal}
                                    onChange={(e) => setWeeklyGoal(e.target.value)}
                                    onBlur={() => setIsEditingGoal(false)}
                                    onKeyDown={(e) => e.key === 'Enter' && setIsEditingGoal(false)}
                                    className="w-full text-2xl font-medium text-gray-700 bg-transparent border-b-2 border-[#7CBA59] focus:outline-none"
                                    autoFocus
                                />
                            ) : (
                                <h2
                                    className="text-xl md:text-2xl font-medium text-gray-700 cursor-pointer hover:text-[#7CBA59] transition-colors flex items-center gap-3"
                                    onClick={() => setIsEditingGoal(true)}
                                >
                                    <Target size={22} className="text-[#7CBA59] flex-shrink-0" />
                                    <span className="truncate">"{weeklyGoal}"</span>
                                </h2>
                            )}
                        </div>

                        {/* Week Navigator */}
                        <div className="flex items-center justify-between gap-2 md:gap-4 bg-[#F8FBF6] rounded-2xl p-2 md:p-3">
                            <button
                                onClick={() => navigateWeek('prev')}
                                className="p-1.5 md:p-2 hover:bg-white rounded-xl transition-colors"
                            >
                                <ChevronLeft size={20} className="md:size-[24px] text-gray-600" />
                            </button>
                            <div className="text-center px-2 md:px-6">
                                <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider font-medium">Start of week</p>
                                <p className="font-bold text-base md:text-lg text-gray-800 whitespace-nowrap">
                                    {weekStart.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                </p>
                            </div>
                            <button
                                onClick={() => navigateWeek('next')}
                                className="p-1.5 md:p-2 hover:bg-white rounded-xl transition-colors"
                            >
                                <ChevronRight size={20} className="md:size-[24px] text-gray-600" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Grid: Progress + Habit Tracker */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-10">
                    {/* Overall Progress Section - Spacious */}
                    <div className="bg-white rounded-2xl shadow-sm border border-[#E8F5E0] p-4 md:p-6">
                        <h3 className="text-base md:text-lg font-bold text-[#5A9A3A] mb-4 md:mb-6 flex items-center gap-2">
                            <Trophy size={20} className="md:size-[22px]" />
                            Overall Progress
                        </h3>
                        <div className="flex flex-col lg:grid lg:grid-cols-5 gap-4 md:gap-6">
                            {/* Bar Chart */}
                            <div className="lg:col-span-3 bg-[#FAFCF8] rounded-xl p-4 md:p-5 border border-[#E8F5E0]">
                                <p className="text-xs md:text-sm text-gray-500 mb-3 md:mb-4 font-medium">Tasks Completed</p>
                                <BarChart data={dailyCompletedCounts} labels={barLabels} />
                            </div>

                            {/* Overall Ring */}
                            <div className="lg:col-span-2 flex flex-col items-center justify-center bg-[#FAFCF8] rounded-xl p-4 md:p-6 border border-[#E8F5E0]">
                                <CircularProgress percentage={overallPercentage} size={window.innerWidth < 768 ? 120 : 160} strokeWidth={window.innerWidth < 768 ? 12 : 14} />
                                <p className="mt-3 md:mt-4 text-xs md:text-sm text-gray-600 font-medium">
                                    {completedTasks} / {totalTasks} Completed
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Consistency Graph Section */}
                    <div className="xl:col-span-1">
                        <ConsistencyGraph data={demoMode && demoData.length > 0 ? demoData : consistencyData} />

                        {/* Bounce Upgrade Hint - PAIN POINT MESSAGING */}
                        <Link to="/app" className="block mt-4 pt-4 border-t border-[#E8F5E0] bg-gradient-to-r from-[#F8FBF6] to-transparent rounded-lg p-3 hover:bg-[#F0F7EB] transition-colors group">
                            <div className="flex items-start gap-3">
                                <Heart size={18} className="text-[#7CBA59] flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs text-gray-600">
                                        <span className="font-semibold text-[#5A9A3A]">Missed a day?</span> <span className="font-bold text-[#5A9A3A] underline group-hover:text-[#4A8A2A]">Bounce</span> gives you <span className="font-semibold">bonus points for bouncing back</span>. Because real life happens.
                                    </p>
                                </div>
                                <ArrowRight size={16} className="text-[#7CBA59] flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Day Cards Horizontal Scroll */}
                <div
                    className="flex gap-6 overflow-x-auto pb-8 -mx-6 px-6 snap-x"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    <style>{`
                        .hide-scroll::-webkit-scrollbar { display: none; }
                    `}</style>
                    {activeWeekData.map((day, index) => (
                        <div key={day.shortDate} className="min-w-[280px] sm:min-w-[320px] flex-1 snap-center sm:snap-start px-1 first:pl-0 last:pr-0">
                            <DayCard
                                day={day}
                                dayIndex={index}
                                onAddTask={addTask}
                                onToggleTask={toggleTask}
                                onDeleteTask={deleteTask}
                                isToday={day.date.getTime() === today.getTime()}
                            />
                        </div>
                    ))}
                </div>

                {/* CTA Section */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-12 md:mt-16 bg-gradient-to-br from-[#7CBA59] to-[#5A9A3A] rounded-2xl md:rounded-3xl p-6 md:p-10 text-white shadow-xl shadow-[#7CBA59]/20"
                >
                    <div className="max-w-3xl mx-auto text-center">
                        <h3 className="text-xl md:text-3xl font-bold mb-2 md:mb-3">This tracker shows WHAT you do.</h3>
                        <h3 className="text-xl md:text-3xl font-bold mb-4 md:mb-6 text-white/80">Bounce shows WHO you're becoming.</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8 text-left">
                            <div className="bg-white/10 rounded-xl p-4">
                                <Brain className="mb-2 size-5 md:size-6" />
                                <h4 className="font-semibold text-sm md:text-base mb-1">3 Focused Habits</h4>
                                <p className="text-xs md:text-sm text-white/80 leading-relaxed">AI picks just 3 habits aligned with your identity — no overwhelm</p>
                            </div>
                            <div className="bg-white/10 rounded-xl p-4">
                                <Heart className="mb-2 size-5 md:size-6" />
                                <h4 className="font-semibold text-sm md:text-base mb-1">Never Lose Streaks</h4>
                                <p className="text-xs md:text-sm text-white/80 leading-relaxed">Miss a day? Earn bonus points for bouncing back. Failure is fuel.</p>
                            </div>
                            <div className="bg-white/10 rounded-xl p-4">
                                <Zap className="mb-2 size-5 md:size-6" />
                                <h4 className="font-semibold text-sm md:text-base mb-1">4 Growth Stages</h4>
                                <p className="text-xs md:text-sm text-white/80 leading-relaxed">From Initiation to Maintenance — habits evolve as you grow</p>
                            </div>
                        </div>
                        <Link
                            to="/app"
                            className="inline-flex items-center justify-center gap-2 bg-white text-[#7CBA59] px-8 md:px-10 py-3 md:py-4 rounded-full font-bold text-base md:text-lg hover:shadow-lg hover:scale-105 transition-all w-full md:w-auto"
                        >
                            <Sparkles size={18} className="md:size-[22px]" />
                            Try Bounce Free
                        </Link>
                    </div>
                </motion.div>

                {/* Footer */}
                <footer className="mt-16 text-center text-gray-400 text-sm pb-8">
                    <p>Made with 💚 by <Link to="/" className="text-[#7CBA59] hover:underline">Bounce</Link> . The resilience-based habit tracker</p>
                </footer>
            </main >
        </div >
    );
};

export default WeeklyTracker;
