import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { List, Sprout, BarChart3, ThermometerSnowflake } from 'lucide-react';
import { useStore } from '../store';
import { useResilienceEngine } from '../hooks/useResilienceEngine';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { usePlatform } from '../hooks/usePlatform';

export const BottomNav: React.FC = () => {
    const { currentView, setView, zenMode } = useStore();
    const { actions } = useResilienceEngine();
    const { isNative } = usePlatform();

    const triggerHaptic = async () => {
        try {
            if (isNative) {
                await Haptics.impact({ style: ImpactStyle.Light });
            } else if (navigator.vibrate) {
                navigator.vibrate(10);
            }
        } catch (e) {
            if (navigator.vibrate) navigator.vibrate(10);
        }
    };

    const handleFreeze = async () => {
        await triggerHaptic();
        // Just call the action, the modal/logic is handled by the store/engine
        // We'll trust the Engine to handle the freeze toggle or modal
        // In Dashboard logic, this opened a modal or toggled state
        // We'll trigger the freeze action directly here
        actions.toggleFreeze(true);
    };

    return (
        <AnimatePresence>
            {!zenMode && (
                <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        transition={{ duration: 0.3, ease: 'circOut' }}
                        className="pointer-events-auto bg-white/80 dark:bg-[#0F0F10]/90 backdrop-blur-xl border-t border-gray-200 dark:border-white/10 px-6 py-4 pb-8"
                    >
                        <div className="max-w-lg mx-auto flex justify-between items-center">
                            <NavItem
                                icon={<List size={24} />}
                                label="Habits"
                                active={currentView === 'dashboard'}
                                onClick={() => {
                                    triggerHaptic();
                                    setView('dashboard');
                                }}
                            />
                            <NavItem
                                icon={<Sprout size={24} />}
                                label="Growth"
                                active={currentView === 'growth'}
                                onClick={() => {
                                    triggerHaptic();
                                    setView('growth');
                                }}
                            />
                            <NavItem
                                icon={<BarChart3 size={24} />}
                                label="Stats"
                                active={currentView === 'stats'}
                                onClick={() => {
                                    triggerHaptic();
                                    setView('stats');
                                }}
                            />

                            {/* Freeze Button - Only available if premium feature or logic permits - but for now consistent */}
                            <button
                                onClick={handleFreeze}
                                className="flex flex-col items-center gap-1 text-red-500 dark:text-red-400 opacity-70 hover:opacity-100 transition-opacity"
                            >
                                <ThermometerSnowflake size={24} />
                                <span className="text-[10px] font-medium">Freeze</span>
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

const NavItem = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-primary-cyan' : 'text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/60'}`}
    >
        {icon}
        <span className="text-[10px] font-medium">{label}</span>
    </button>
);
