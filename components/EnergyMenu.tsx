import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Battery, BatteryCharging, BatteryLow, CalendarClock } from 'lucide-react'; // 👈 Added CalendarClock
import { useStore } from '../store';
import { useCalendar } from '../hooks/useCalendar'; // 👈 Added Hook
import { EnergyLevel } from '../types';

interface EnergyMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

export const EnergyMenu: React.FC<EnergyMenuProps> = ({ isOpen, onClose }) => {
    const { setEnergyLevel, currentEnergyLevel } = useStore();
    const { downloadCalendarFile } = useCalendar(); // 👈 Initialize Calendar Hook

    const handleSelect = (level: EnergyLevel) => {
        setEnergyLevel(level);
        onClose();
    };

    const handleTimeBlock = () => {
        downloadCalendarFile();
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 10 }}
                        className="absolute top-20 right-6 z-50 bg-white dark:bg-dark-800 rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 p-2 w-48 overflow-hidden"
                    >
                        <div className="px-3 py-2 border-b border-gray-100 dark:border-white/5 mb-1">
                            <h3 className="text-[10px] font-bold uppercase text-gray-400 dark:text-white/40 tracking-wider">Energy Check-in</h3>
                        </div>

                        <div className="flex flex-col gap-1">
                            <button
                                onClick={() => handleSelect('high')}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${currentEnergyLevel === 'high' ? 'bg-green-500/10 text-green-600' : 'hover:bg-gray-100 dark:hover:bg-white/5'}`}
                            >
                                <BatteryCharging size={18} className="text-green-500" />
                                <div className="text-left">
                                    <span className="block text-xs font-bold text-gray-800 dark:text-white">Full Charge</span>
                                    <span className="block text-[9px] text-gray-400 dark:text-white/40">Ready for a challenge</span>
                                </div>
                            </button>

                            <button
                                onClick={() => handleSelect('medium')}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${currentEnergyLevel === 'medium' ? 'bg-yellow-500/10 text-yellow-600' : 'hover:bg-gray-100 dark:hover:bg-white/5'}`}
                            >
                                <Battery size={18} className="text-yellow-500" />
                                <div className="text-left">
                                    <span className="block text-xs font-bold text-gray-800 dark:text-white">Steady</span>
                                    <span className="block text-[9px] text-gray-400 dark:text-white/40">Standard pace</span>
                                </div>
                            </button>

                            <button
                                onClick={() => handleSelect('low')}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${currentEnergyLevel === 'low' ? 'bg-red-500/10 text-red-600' : 'hover:bg-gray-100 dark:hover:bg-white/5'}`}
                            >
                                <BatteryLow size={18} className="text-red-500" />
                                <div className="text-left">
                                    <span className="block text-xs font-bold text-gray-800 dark:text-white">Low Battery</span>
                                    <span className="block text-[9px] text-gray-400 dark:text-white/40">Auto-shrink habit</span>
                                </div>
                            </button>
                        </div>

                        {/* 👇 NEW SECTION: Time Blocker Divider & Button */}
                        <div className="my-1 h-px bg-gray-100 dark:bg-white/5" />

                        <button
                            onClick={handleTimeBlock}
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors w-full"
                        >
                            <CalendarClock size={18} className="text-blue-400" />
                            <div className="text-left">
                                <span className="block text-xs font-bold text-gray-800 dark:text-white">Time Block It</span>
                                <span className="block text-[9px] text-gray-400 dark:text-white/40">Add to Calendar</span>
                            </div>
                        </button>

                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};