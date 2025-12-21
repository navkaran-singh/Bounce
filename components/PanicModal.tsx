import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';

export const PanicModal: React.FC = () => {
  const { isFrozen, toggleFreeze, cancelFreeze } = useStore();
  const [timeLeft, setTimeLeft] = useState({ h: 24, m: 0, s: 0 });

  // Reset countdown when freeze is cancelled (isFrozen becomes false)
  useEffect(() => {
    if (!isFrozen) {
      setTimeLeft({ h: 24, m: 0, s: 0 });
    }
  }, [isFrozen]);

  // Logic: Countdown simulation
  useEffect(() => {
    if (!isFrozen) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.s > 0) return { ...prev, s: prev.s - 1 };
        if (prev.m > 0) return { ...prev, m: prev.m - 1, s: 59 };
        if (prev.h > 0) return { ...prev, h: prev.h - 1, m: 59, s: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isFrozen]);

  // Design Constants from provided HTML
  const colors = {
    backgroundDark: '#101f22',
    primary: '#0dccf2',
  };

  const sphereImage = "https://lh3.googleusercontent.com/aida-public/AB6AXuA6TaDn-0bfwc34lMup2RAgK_dTDk1LomIlmpLqZ-XDalBDKfG3ta6LRRnkKlUmmd1OfDpxnfXuDdwuqLL1H2szTlvCXXd_rYR3hFYG9rr2X-bc5jxEzG2mPGchP2JjzlQ5eoCu_gmLD9E4D0t6epl5tAxUv_N2geu_PBxtZke5QEl04Ppm_Tiwuisx0_P6ZOMC0kJ-Q89BbGpB-B0jxtf4zUUToPFDalObhcbqb59TRfgNCdp5UlfgP4Ec79gQZjb7RhdIVdAqxzM";

  return (
    <AnimatePresence>
      {isFrozen && (
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-between min-h-screen w-full p-6 text-white overflow-y-auto"
          style={{ backgroundColor: colors.backgroundDark }}
        >
          <div className="flex-grow flex flex-col items-center justify-center w-full mt-8">
            {/* Central Visual Anchor */}
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 mb-8 flex items-center justify-center">
              <div
                className="absolute inset-0 rounded-full blur-2xl"
                style={{ backgroundColor: 'rgba(13, 204, 242, 0.1)' }}
              />
              <motion.div
                className="w-full h-full bg-center bg-no-repeat bg-cover rounded-full"
                // UPDATED: Rotates 360 degrees continuously
                animate={{ rotate: 360 }}
                // UPDATED: Linear ease for smooth infinite looping, slow duration for "slight" feel
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                style={{
                  backgroundImage: `url("${sphereImage}")`,
                  // REMOVED: boxShadow has been removed as requested
                }}
              ></motion.div>
            </div>

            {/* HeadlineText */}
            <h1 className="text-white tracking-tight text-[32px] font-bold leading-tight px-4 text-center pb-3">
              Freeze Protocol Activated
            </h1>

            {/* BodyText */}
            <p className="text-white text-base font-normal leading-normal pb-3 pt-1 px-4 text-center max-w-md">
              Your Resilience Orb is safely paused. Your progress is secure. It's okay to take the space you need.
            </p>

            {/* Timer */}
            <div className="flex gap-4 py-6 px-4 w-full max-w-sm">
              <TimeBlock value={timeLeft.h} label="Hours" />
              <TimeBlock value={timeLeft.m} label="Minutes" />
              <TimeBlock value={timeLeft.s} label="Seconds" />
            </div>

            {/* MetaText */}
            <p className="text-white/50 text-sm font-normal leading-normal pb-3 pt-1 px-4 text-center">
              All tracking will resume in 24 hours, or when you're ready.
            </p>
          </div>

          {/* CTA Button */}
          <div className="w-full flex justify-center pt-6 pb-4 mb-4 px-4">
            <button
              onClick={() => cancelFreeze()}
              className="flex items-center justify-center gap-2 h-14 w-full max-w-sm rounded-full bg-[#0dccf2] px-6 text-center font-bold text-[#101f22] transition-transform duration-200 ease-in-out hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="text-lg">Cancel Freeze</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const TimeBlock = ({ value, label }: { value: number; label: string }) => (
  <div className="flex grow basis-0 flex-col items-stretch gap-2">
    <div className="flex h-14 grow items-center justify-center rounded-lg px-3 bg-white/5">
      <p className="text-white text-lg font-bold leading-tight tracking-[-0.015em]">
        {value.toString().padStart(2, '0')}
      </p>
    </div>
    <div className="flex items-center justify-center">
      <p className="text-white/70 text-sm font-normal leading-normal">{label}</p>
    </div>
  </div>
);