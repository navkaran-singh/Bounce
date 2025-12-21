import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Check, RefreshCw } from 'lucide-react';
import { useStore } from '../store';

interface ProfileEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const DEFAULT_SEEDS = [
    'Felix', 'Aneka', 'Zoe', 'Midnight',
    'Bounce', 'Energy', 'Luna', 'Spark',
    'Gizmo', 'Bandit', 'Coco', 'Rocky',
    'Chester', 'Bear', 'Milo', 'Shadow'
];

export const ProfileEditorModal: React.FC<ProfileEditorModalProps> = ({ isOpen, onClose }) => {
    const { user, identity, updateProfilePhoto } = useStore();
    const [selectedImage, setSelectedImage] = useState<string | null>(user?.photoURL || null);
    const [previewSeed, setPreviewSeed] = useState<string>(identity);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize state when opening
    React.useEffect(() => {
        if (isOpen) {
            setSelectedImage(user?.photoURL || null);
            setPreviewSeed(identity);
        }
    }, [isOpen, user?.photoURL, identity]);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setSelectedImage(result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        // If selectedImage is null, we might want to revert to default (null)
        updateProfilePhoto(selectedImage);
        onClose();
    };

    const handleSelectDefault = (seed: string) => {
        const url = `https://api.dicebear.com/9.x/micah/svg?seed=${seed}`;
        setSelectedImage(url);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md bg-[#101f22] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0">
                            <h2 className="text-xl font-bold text-white">Edit Profile Picture</h2>
                            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white/60 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 overflow-y-auto">
                            {/* Preview Area */}
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative w-32 h-32 rounded-full border-4 border-[#0dccf2]/20 overflow-hidden bg-gray-800 shrink-0">
                                    <img
                                        src={selectedImage || `https://api.dicebear.com/9.x/micah/svg?seed=${identity}`}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {/* Upload Button */}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    accept="image/*"
                                    className="hidden"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full text-sm font-medium text-[#0dccf2] transition-colors border border-white/10"
                                >
                                    <Upload size={16} />
                                    Upload Custom Image
                                </button>
                            </div>

                            {/* Default Options */}
                            <div className="space-y-3">
                                <p className="text-sm text-white/50 font-medium px-1">Choose a Style</p>
                                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                                    {/* Option to revert to current identity */}
                                    <button
                                        onClick={() => setSelectedImage(null)}
                                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${selectedImage === null ? 'border-[#0dccf2]' : 'border-transparent hover:border-white/20'}`}
                                        title="Current Identity"
                                    >
                                        <img src={`https://api.dicebear.com/9.x/micah/svg?seed=${identity}`} alt="Current Identity" className="w-full h-full object-cover" />
                                        {selectedImage === null && <div className="absolute inset-0 bg-[#0dccf2]/20 flex items-center justify-center"><Check size={20} className="text-white drop-shadow-md" /></div>}
                                    </button>

                                    {/* Preset Seeds */}
                                    {DEFAULT_SEEDS.map((seed) => {
                                        const url = `https://api.dicebear.com/9.x/micah/svg?seed=${seed}`;
                                        const isSelected = selectedImage === url;
                                        return (
                                            <button
                                                key={seed}
                                                onClick={() => handleSelectDefault(seed)}
                                                className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${isSelected ? 'border-[#0dccf2]' : 'border-transparent hover:border-white/20'}`}
                                                title={seed}
                                            >
                                                <img src={url} alt={seed} className="w-full h-full object-cover" />
                                                {isSelected && <div className="absolute inset-0 bg-[#0dccf2]/20 flex items-center justify-center"><Check size={20} className="text-white drop-shadow-md" /></div>}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Save Button */}
                            <button
                                onClick={handleSave}
                                className="w-full py-3.5 bg-[#0dccf2] hover:bg-[#0bc2e6] text-[#101f22] font-bold rounded-xl transition-colors active:scale-[0.98]"
                            >
                                Save Photo
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
