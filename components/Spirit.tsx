
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface SpiritProps {
  streak: number;
  size?: number;
}

export const Spirit: React.FC<SpiritProps> = ({ streak, size = 300 }) => {
  // Determine Stage based on Streak
  const stage = useMemo(() => {
    if (streak < 3) return 1; // Spark
    if (streak < 7) return 2; // Strand
    if (streak < 14) return 3; // Weave
    if (streak < 30) return 4; // Resonance
    return 5; // Ascendance
  }, [streak]);

  // Color Palette - Ethereal, light-based
  const colors = {
    core: '#FFFFFF',
    glow: '#0dccf2', // Cyan
    secondary: '#7F00FF', // Purple
    tertiary: '#FF00AA', // Magenta hint for higher levels
  };

  const center = size / 2;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      
      {/* BACKGROUND AMBIENCE */}
      <motion.div 
        className="absolute inset-0 rounded-full blur-[80px] opacity-30"
        style={{ background: `radial-gradient(circle, ${colors.glow}, ${colors.secondary})` }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        <defs>
            <filter id="spirit-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>

        {/* STAGE 1: THE SPARK (Core Breath) */}
        <motion.circle
            cx={center} cy={center} r={size * 0.1}
            fill={colors.core}
            filter="url(#spirit-glow)"
            animate={{ 
                r: [size * 0.08, size * 0.12, size * 0.08],
                opacity: [0.8, 1, 0.8]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.circle
            cx={center} cy={center} r={size * 0.15}
            stroke={colors.glow} strokeWidth="1" fill="none"
            opacity={0.5}
            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
        />

        {/* STAGE 2: THE STRAND (Orbiting Lines) */}
        {stage >= 2 && (
            <motion.g animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}>
                {[0, 120, 240].map((deg, i) => (
                    <motion.ellipse
                        key={`s2-${i}`}
                        cx={center} cy={center} rx={size * 0.25} ry={size * 0.05}
                        stroke="url(#spirit-gradient-1)" strokeWidth="1.5" fill="none"
                        style={{ transformOrigin: `${center}px ${center}px`, rotate: deg }}
                        opacity={0.6}
                    />
                ))}
            </motion.g>
        )}

        {/* STAGE 3: THE WEAVE (Interlaced Flow) */}
        {stage >= 3 && (
            <motion.g animate={{ rotate: -360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }}>
                 {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                    <motion.path
                        key={`s3-${i}`}
                        d={`M ${center} ${center - size * 0.3} Q ${center + size * 0.1} ${center} ${center} ${center + size * 0.3} Q ${center - size * 0.1} ${center} ${center} ${center - size * 0.3}`}
                        stroke={colors.secondary} strokeWidth="0.5" fill="none"
                        style={{ transformOrigin: `${center}px ${center}px`, rotate: deg }}
                        opacity={0.4}
                    />
                 ))}
            </motion.g>
        )}

        {/* STAGE 4: THE RESONANCE (Sacred Geometry) */}
        {stage >= 4 && (
             <motion.g>
                {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
                    <motion.rect
                        key={`s4-${i}`}
                        x={center - size * 0.2} y={center - size * 0.2}
                        width={size * 0.4} height={size * 0.4}
                        stroke={colors.glow} strokeWidth="0.5" fill="none"
                        style={{ transformOrigin: `${center}px ${center}px`, rotate: deg }}
                        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 4, repeat: Infinity, delay: i * 0.1 }}
                    />
                ))}
             </motion.g>
        )}

         {/* STAGE 5: THE ASCENDANCE (Radiant Rays) */}
         {stage >= 5 && (
            <motion.g animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }}>
                {Array.from({ length: 24 }).map((_, i) => (
                     <motion.line
                        key={`s5-${i}`}
                        x1={center} y1={center}
                        x2={center} y2={center - size * 0.45}
                        stroke={colors.core} strokeWidth="0.5"
                        style={{ transformOrigin: `${center}px ${center}px`, rotate: i * 15 }}
                        opacity={0.2}
                        strokeDasharray="2 4"
                     />
                ))}
            </motion.g>
        )}

        <linearGradient id="spirit-gradient-1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.glow} stopOpacity="0" />
            <stop offset="50%" stopColor={colors.glow} stopOpacity="1" />
            <stop offset="100%" stopColor={colors.glow} stopOpacity="0" />
        </linearGradient>
      </svg>
    </div>
  );
};
