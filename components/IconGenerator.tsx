import { useRef } from 'react';
import { Download } from 'lucide-react';

export const IconGenerator = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const generateAndDownload = (size: number, fileName: string, isApple = false) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Resize canvas for high-res generation
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 1. Background (Dark Void)
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, size, size);

        // 2. Bioluminescent Glow (Gradient)
        // Create a radial gradient from center
        const gradient = ctx.createRadialGradient(size / 2, size / 2, size * 0.1, size / 2, size / 2, size * 0.6);
        gradient.addColorStop(0, 'rgba(13, 204, 242, 0.4)'); // Primary Cyan
        gradient.addColorStop(0.6, 'rgba(127, 0, 255, 0.1)'); // Purple fade
        gradient.addColorStop(1, 'rgba(10, 10, 10, 0)');     // Transparent

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);

        // 3. The "B" Logo
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${size * 0.6}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Add a subtle text shadow for depth
        ctx.shadowColor = 'rgba(13, 204, 242, 0.8)';
        ctx.shadowBlur = size * 0.1;
        ctx.fillText('B', size / 2, size / 2 + (size * 0.05)); // Slight Y offset for visual centering

        // 4. Download
        const link = document.createElement('a');
        link.download = fileName;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    const handleGenerateAll = () => {
        // Generate the 3 Holy Grails of PWA
        setTimeout(() => generateAndDownload(192, 'pwa-192x192.png'), 100);
        setTimeout(() => generateAndDownload(512, 'pwa-512x512.png'), 600);
        setTimeout(() => generateAndDownload(180, 'apple-touch-icon.png', true), 1100);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl">
            <div className="bg-dark-800 p-8 rounded-3xl border border-white/10 text-center flex flex-col items-center gap-6">
                <h2 className="text-2xl font-bold text-white">Icon Factory</h2>
                <p className="text-white/50 max-w-xs">
                    Generates all PWA assets instantly.
                </p>

                {/* Preview Canvas (Hidden or scaled down for display) */}
                <canvas
                    ref={canvasRef}
                    className="w-32 h-32 rounded-2xl border border-white/10 shadow-[0_0_30px_rgba(13,204,242,0.3)]"
                />

                <button
                    onClick={handleGenerateAll}
                    className="flex items-center gap-2 px-6 py-3 bg-primary-cyan text-black font-bold rounded-full hover:scale-105 transition-transform"
                >
                    <Download size={20} />
                    Download All Assets
                </button>

                <p className="text-xs text-white/30">
                    Files will download automatically.
                    <br />Move them to your <code>/public</code> folder.
                </p>
            </div>
        </div>
    );
};