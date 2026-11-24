import React, { useEffect, useState } from 'react';

// Full-screen brand loader. When `done` becomes true it fades out, then unmounts.
export default function Loader({ done = false }) {

    const [visible, setVisible] = useState(true);

    useEffect(() => {
        if (!done) return undefined;
        const timer = setTimeout(() => setVisible(false), 500); // matches duration-500
        return () => clearTimeout(timer);
    }, [done]);

    if (!visible) return null;

    return (
        <div
            role="status"
            aria-live="polite"
            className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0B0F14] transition-opacity duration-500 ${
                done ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
        >

            {/* Logo */}
            <div className="text-5xl font-black tracking-tighter text-white" aria-label="Trend Jr">
                TREND<span className="text-[#B6F23A]">JR</span>
            </div>

            <p className="mt-3 text-xs tracking-[0.35em] text-gray-400">
                DISCOVER YOUR NEXT TREND
            </p>

            {/* Loading Bar */}
            <div className="mt-9 h-1 w-48 overflow-hidden rounded-full bg-white/10">

                <div className="h-full w-1/2 animate-[loading_1.4s_ease-in-out_infinite] motion-reduce:animate-none rounded-full bg-[#B6F23A]" />

            </div>

            <p className="mt-5 text-[10px] tracking-[0.3em] text-gray-500">
                LOADING EXPERIENCE...
            </p>

            <style>{`
                @keyframes loading {
                    0% {
                        transform: translateX(-110%);
                    }
                    100% {
                        transform: translateX(210%);
                    }
                }
            `}</style>

        </div>
    );
}
