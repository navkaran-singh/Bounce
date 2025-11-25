
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Monitor, X, CloudRain, Trees, Waves, Save, Download, Upload, Check } from 'lucide-react';
import { useStore } from '../store';
import { Theme, SoundType } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme, soundType, setSoundType, identity, setIdentity, microHabits, setMicroHabits, importData } = useStore();
  
  const [localIdentity, setLocalIdentity] = useState(identity);
  const [localHabits, setLocalHabits] = useState([...microHabits]);
  const [hasChanges, setHasChanges] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
      if (isOpen) {
          setLocalIdentity(identity);
          setLocalHabits([...microHabits]);
          setHasChanges(false);
      }
  }, [isOpen, identity, microHabits]);

  const handleSave = () => {
      setIdentity(localIdentity);
      setMicroHabits(localHabits);
      setHasChanges(false);
      onClose();
  };

  const handleExport = () => {
      const data = localStorage.getItem('bounce_state');
      if (data) {
          const blob = new Blob([data], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `bounce-data-${new Date().toISOString().split('T')[0]}.json`;
          a.click();
          URL.revokeObjectURL(url);
      }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
              const content = event.target?.result as string;
              const success = importData(content);
              setImportStatus(success ? 'success' : 'error');
              setTimeout(() => setImportStatus('idle'), 3000);
          };
          reader.readAsText(file);
      }
  };

  const themes: { id: Theme; label: string; icon: React.ReactNode }[] = [
    { id: 'dark', label: 'Bioluminescent', icon: <Moon size={18} /> },
    { id: 'light', label: 'Daylight', icon: <Sun size={18} /> },
    { id: 'system', label: 'System', icon: <Monitor size={18} /> },
  ];

  const sounds: { id: SoundType; label: string; icon: React.ReactNode }[] = [
      { id: 'rain', label: 'Rain', icon: <CloudRain size={18} /> },
      { id: 'forest', label: 'Forest', icon: <Trees size={18} /> },
      { id: 'stream', label: 'Stream', icon: <Waves size={18} /> },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
          
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
          />

          {/* Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-dark-800 dark:bg-dark-800 bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl pointer-events-auto relative overflow-y-auto max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-gray-500 dark:text-white/60"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-8">
                {/* Identity Section */}
                <div>
                     <h3 className="text-sm font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider mb-4">Identity & Habits</h3>
                     <div className="space-y-4">
                         <div>
                             <label className="text-xs text-gray-400 dark:text-white/30 mb-1 block">I am becoming...</label>
                             <input 
                                type="text" 
                                value={localIdentity} 
                                onChange={(e) => { setLocalIdentity(e.target.value); setHasChanges(true); }}
                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary-cyan"
                             />
                         </div>
                         <div className="space-y-2">
                             <label className="text-xs text-gray-400 dark:text-white/30 mb-1 block">My Micro-Habits</label>
                             {localHabits.map((h, i) => (
                                 <input 
                                    key={i}
                                    type="text" 
                                    value={h} 
                                    onChange={(e) => {
                                        const newH = [...localHabits];
                                        newH[i] = e.target.value;
                                        setLocalHabits(newH);
                                        setHasChanges(true);
                                    }}
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary-cyan"
                                    placeholder={`Variation ${i+1}`}
                                 />
                             ))}
                         </div>
                         {hasChanges && (
                             <button 
                                onClick={handleSave}
                                className="w-full py-3 bg-primary-cyan text-black font-bold rounded-xl flex items-center justify-center gap-2"
                             >
                                 <Save size={16} /> Save Changes
                             </button>
                         )}
                     </div>
                </div>

                {/* Theme Section */}
                <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider mb-4">Appearance</h3>
                <div className="grid grid-cols-3 gap-3">
                    {themes.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className={`
                        flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all duration-200
                        ${theme === t.id 
                            ? 'bg-primary-cyan/10 border-primary-cyan text-primary-cyan dark:text-primary-cyan' 
                            : 'bg-gray-50 dark:bg-white/5 border-transparent text-gray-600 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/10'
                        }
                        `}
                    >
                        {t.icon}
                        <span className="text-xs font-medium">{t.label}</span>
                    </button>
                    ))}
                </div>
                </div>

                {/* Sound Section */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider mb-4">Soundscape</h3>
                    <div className="grid grid-cols-3 gap-3">
                        {sounds.map((s) => (
                        <button
                            key={s.id}
                            onClick={() => setSoundType(s.id)}
                            className={`
                            flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all duration-200
                            ${soundType === s.id 
                                ? 'bg-primary-cyan/10 border-primary-cyan text-primary-cyan dark:text-primary-cyan' 
                                : 'bg-gray-50 dark:bg-white/5 border-transparent text-gray-600 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/10'
                            }
                            `}
                        >
                            {s.icon}
                            <span className="text-xs font-medium">{s.label}</span>
                        </button>
                        ))}
                    </div>
                </div>

                {/* Data Sovereignty Section */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider mb-4">Data Sovereignty</h3>
                    <div className="flex gap-3">
                        <button 
                            onClick={handleExport}
                            className="flex-1 flex items-center justify-center gap-2 p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 text-xs font-medium"
                        >
                            <Download size={14} /> Export Data
                        </button>
                        <label className="flex-1 flex items-center justify-center gap-2 p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 text-xs font-medium cursor-pointer relative">
                             {importStatus === 'success' ? (
                                <Check size={14} className="text-green-500" />
                             ) : importStatus === 'error' ? (
                                <X size={14} className="text-red-500" />
                             ) : (
                                <Upload size={14} />
                             )}
                             <span>Import</span>
                             <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                        </label>
                    </div>
                    {importStatus === 'success' && <p className="text-green-500 text-[10px] mt-2 text-center">Data imported successfully!</p>}
                    {importStatus === 'error' && <p className="text-red-500 text-[10px] mt-2 text-center">Invalid file format.</p>}
                </div>

            </div>

            {/* Footer */}
            <div className="text-center mt-8">
                <p className="text-xs text-gray-400 dark:text-white/20">Bounce v1.3.0 &bull; Organic Habit Tracker</p>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
