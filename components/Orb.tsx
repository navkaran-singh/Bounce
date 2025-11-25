import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

interface OrbProps {
  state: 'idle' | 'breathing' | 'healing' | 'frozen' | 'active' | 'success';
  size?: number;
  isFractured?: boolean;
}

export const Orb: React.FC<OrbProps> = ({ state, size = 280, isFractured = false }) => {
  
  // Dynamic styles based on state
  const getColors = () => {
    switch (state) {
      case 'frozen':
        return ['#4B5563', '#1F2937', '#111827']; // Grey/Cold
      case 'healing':
        return ['#FFD700', '#FFA500', '#FF4500']; // Gold/Healing
      case 'active':
        return ['#00FFFF', '#00BFFF', '#7F00FF']; // Bright Cyan/Blue
      case 'success':
        return ['#E0F2FE', '#0EA5E9', '#0284C7']; // White/Bright Blue (High Energy)
      default: // Breathing/Idle
        return ['#0dccf2', '#00BFFF', '#7F00FF']; // Default Teal/Purple
    }
  };

  const colors = getColors();

  const variants: Variants = {
    breathing: {
      scale: [1, 1.02, 1], 
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    active: {
      scale: 1.02,
      filter: "brightness(1.3)",
      transition: { duration: 0.3 }
    },
    frozen: {
      scale: 0.95,
      filter: "grayscale(1)",
      transition: { duration: 1 }
    },
    healing: {
      scale: [0.9, 1.2, 1],
      filter: ["brightness(1)", "brightness(2)", "brightness(1)"],
      transition: { duration: 1.5, ease: "circOut" }
    },
    success: {
      scale: [1, 1.05, 1], 
      filter: "brightness(1.2)",
      transition: { duration: 1.5, ease: "easeInOut" }
    }
  };

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      
      {/* Success Circumferential Glow Ring */}
      <AnimatePresence>
        {state === 'success' && (
            <motion.div
            className="absolute rounded-full z-0"
            style={{
                inset: -3, 
                background: `conic-gradient(from 0deg, transparent 0%, ${colors[1]} 10%, ${colors[0]} 50%, transparent 90%)`,
                filter: 'blur(12px)',
                opacity: 0.8
            }}
            initial={{ opacity: 0, rotate: 0 }}
            animate={{ opacity: 1, rotate: 360 }}
            exit={{ opacity: 0, transition: { duration: 0.8 } }} 
            transition={{ 
                rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                opacity: { duration: 0.3 }
            }}
            />
        )}
      </AnimatePresence>

      {/* Ambient Background Glow */}
      <motion.div
        className="absolute inset-0 rounded-full blur-[60px] z-0"
        style={{ 
            background: `radial-gradient(circle, ${colors[0]}, ${colors[2]})`,
            opacity: isFractured ? 0.3 : 0.4 
        }}
        animate={state === 'breathing' ? { scale: [1, 1.1, 1], opacity: isFractured ? [0.2, 0.3, 0.2] : [0.3, 0.5, 0.3] } : undefined}
        transition={{ duration: 4, repeat: Infinity }}
      />

      {/* Pulsing Border Glow */}
      <motion.div
        className="absolute inset-0 rounded-full z-0"
        style={{
          boxShadow: `0 0 20px 5px ${colors[0]}80`,
          opacity: 0.6
        }}
        animate={state === 'breathing' ? { scale: [1, 1.05, 1], opacity: [0.5, 0.8, 0.5] } : undefined}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Main Sphere Container */}
      <motion.div
        className="w-full h-full rounded-full relative overflow-hidden backdrop-blur-sm z-10"
        style={{
          background: `linear-gradient(135deg, ${colors[0]}20, ${colors[1]}40)`,
          boxShadow: `inset -10px -10px 40px ${colors[2]}40, inset 10px 10px 40px ${colors[0]}60`,
          border: isFractured ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.15)'
        }}
        variants={variants}
        animate={state}
      >
        {/* Fractured Overlay - ORGANIC TECTONIC STYLE */}
        {isFractured && state !== 'success' && (
            <div className="absolute inset-0 pointer-events-none z-20">
                 <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full drop-shadow-lg">
                    <defs>
                        {/* Blur filter to create the "light leaking" effect behind cracks */}
                        <filter id="glow-blur" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="1" result="blur" />
                        </filter>
                    </defs>

                    {/* LAYER 1: BACK GLOW 
                      Thicker, blurred lines behind the main cracks to make them look like they are glowing from inside
                    */}
                    <g filter="url(#glow-blur)" className="opacity-50 mix-blend-screen">
                        <path 
                            d="M55,0 L52,15 L58,30 L45,50 L52,75 L48,100" 
                            stroke={colors[0]} strokeWidth="2" fill="none" 
                        />
                        <path 
                            d="M45,50 L20,45 L5,60 M58,30 L80,35 L95,25" 
                            stroke={colors[0]} strokeWidth="1.5" fill="none" 
                        />
                    </g>

                    {/* LAYER 2: MAIN RIFT (The "Spine")
                      Jagged, organic line running top to bottom
                    */}
                    <path 
                      d="M55,0 L52,15 L58,30 L45,50 L52,75 L48,100" 
                      stroke="white" 
                      strokeWidth="1.2" 
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none" 
                      className="opacity-90" 
                    />

                    {/* LAYER 3: MAJOR BRANCHES (Tectonic Plates)
                      Connecting large areas to the spine
                    */}
                    <path 
                      d="M45,50 L20,45 L5,60 M58,30 L80,35 L95,25 M52,75 L75,80 L90,95" 
                      stroke="white" 
                      strokeWidth="0.8" 
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none" 
                      className="opacity-80" 
                    />

                    {/* LAYER 4: MICRO FRACTURES (Webbing)
                      Smaller lines creating the "mosaic" look
                    */}
                    <path 
                      d="M52,15 L30,10 M58,30 L70,15 M20,45 L25,25 M80,35 L85,55 M52,75 L35,85 M75,80 L70,60" 
                      stroke="white" 
                      strokeWidth="0.4" 
                      strokeLinecap="round"
                      fill="none" 
                      className="opacity-60" 
                    />
                 </svg>
                 
                 {/* Subtle texture overlay for the glass surface itself */}
                 <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white to-transparent opacity-5 mix-blend-overlay" />
            </div>
        )}

        {/* Internal Texture/Noise */}
        <motion.div 
          className="absolute inset-0 opacity-40 mix-blend-overlay"
          style={{
            backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")',
            backgroundSize: 'cover'
          }}
        />
        
        {/* Bioluminescent Pulse Core */}
        <motion.div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2/3 h-2/3 rounded-full blur-3xl"
            style={{ background: colors[0] }}
            animate={state === 'success' ? { scale: [1, 1.3, 1], opacity: 0.8 } : { opacity: isFractured ? [0.2, 0.4, 0.2] : [0.2, 0.6, 0.2] }}
            transition={state === 'success' ? { duration: 1.5, repeat: Infinity } : { duration: 3, repeat: Infinity }}
        />
      </motion.div>
    </div>
  );
};