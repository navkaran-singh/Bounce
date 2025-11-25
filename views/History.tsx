
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { useStore } from '../store';
import { DailyLog } from '../types';

export const History: React.FC = () => {
  const { setView, history } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Calendar Helpers
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const padding = Array.from({ length: firstDay }, (_, i) => i);

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getLogForDay = (day: number) => {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return history[dateStr];
  };

  const selectedLog = selectedDate ? history[selectedDate] : null;

  return (
    <div className="h-full flex flex-col relative bg-light-50 dark:bg-[#0F0F10] overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-light-50/90 dark:bg-[#0F0F10]/90 backdrop-blur-md z-20 flex items-center gap-4 border-b border-gray-200 dark:border-white/5">
            <button 
                onClick={() => setView('dashboard')}
                className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-800 dark:text-white"
            >
                <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">History</h1>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            
            {/* Calendar Controls */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{monthName} <span className="text-gray-400 dark:text-white/40">{year}</span></h2>
                <div className="flex gap-2">
                    <button onClick={handlePrevMonth} className="p-2 rounded-full bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                        <ChevronLeft size={20} className="text-gray-600 dark:text-white" />
                    </button>
                    <button onClick={handleNextMonth} className="p-2 rounded-full bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                        <ChevronRight size={20} className="text-gray-600 dark:text-white" />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 mb-8">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <div key={i} className="text-center text-xs font-bold text-gray-400 dark:text-white/30 py-2">{d}</div>
                ))}
                
                {padding.map((_, i) => <div key={`pad-${i}`} />)}

                {days.map((day) => {
                    const log = getLogForDay(day);
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isSelected = selectedDate === dateStr;
                    const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

                    return (
                        <motion.button
                            key={day}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setSelectedDate(dateStr)}
                            className={`
                                aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all
                                ${isSelected 
                                    ? 'ring-2 ring-primary-cyan ring-offset-2 ring-offset-[#0F0F10]' 
                                    : ''
                                }
                                ${log?.completedIndices?.length 
                                    ? 'bg-gradient-to-br from-primary-cyan/20 to-primary-purple/20 text-white' 
                                    : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-white/30'
                                }
                            `}
                        >
                            <span className={`text-sm font-medium ${isToday ? 'text-primary-cyan font-bold' : ''}`}>{day}</span>
                            {log?.completedIndices?.length ? (
                                <div className="flex gap-0.5 mt-1">
                                    <div className="w-1 h-1 rounded-full bg-primary-cyan" />
                                    {log.energy && <div className="w-1 h-1 rounded-full bg-primary-purple" />}
                                </div>
                            ) : null}
                        </motion.button>
                    );
                })}
            </div>

            {/* Selected Date Details */}
            <AnimatePresence mode="wait">
                {selectedDate && (
                    <motion.div
                        key={selectedDate}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="bg-white dark:bg-white/5 rounded-2xl p-5 border border-gray-200 dark:border-white/10"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-xs text-gray-500 dark:text-white/40 uppercase tracking-wider font-bold">
                                    {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                            {selectedLog?.completedIndices?.length ? (
                                <span className="bg-green-500/20 text-green-500 text-xs font-bold px-2 py-1 rounded-md">Completed</span>
                            ) : (
                                <span className="bg-gray-500/20 text-gray-500 text-xs font-bold px-2 py-1 rounded-md">Rest Day</span>
                            )}
                        </div>

                        {selectedLog ? (
                            <div className="space-y-4">
                                {selectedLog.energy && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-xl">
                                            {selectedLog.energy === 'high' ? '⚡' : selectedLog.energy === 'medium' ? '🌊' : '☁️'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white capitalize">{selectedLog.energy} Energy</p>
                                        </div>
                                    </div>
                                )}
                                
                                {selectedLog.note && (
                                    <div className="bg-gray-50 dark:bg-black/20 p-3 rounded-xl text-sm text-gray-700 dark:text-white/80 italic leading-relaxed border border-gray-100 dark:border-white/5">
                                        "{selectedLog.note}"
                                    </div>
                                )}

                                {!selectedLog.energy && !selectedLog.note && selectedLog.completedIndices?.length && (
                                    <p className="text-sm text-gray-400 dark:text-white/40 italic">No reflection recorded.</p>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <CalendarIcon size={32} className="mx-auto text-gray-300 dark:text-white/10 mb-2" />
                                <p className="text-sm text-gray-400 dark:text-white/40">No activity recorded for this day.</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    </div>
  );
};
