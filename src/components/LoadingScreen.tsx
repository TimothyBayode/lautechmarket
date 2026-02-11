import { Sparkles } from 'lucide-react';

export const LoadingScreen = () => {
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#f9fafb] overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 blur-[100px] rounded-full animate-pulse" />

            <div className="relative flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-700">
                {/* Animated Logo/Symbol */}
                <div className="relative">
                    <div className="w-24 h-24 rounded-3xl bg-white border border-emerald-100 flex items-center justify-center animate-bounce-gentle shadow-xl shadow-emerald-500/5">
                        <img
                            src="/logo.svg"
                            alt="Lautech Market"
                            className="w-16 h-16 object-contain"
                        />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                        <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
                    </div>
                </div>

                {/* Text Content */}
                <div className="text-center space-y-3">
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter uppercase">
                        LAUTECH <span className="text-emerald-600">MARKET</span>
                    </h1>
                    <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800/40">Powered by</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">OJA</span>
                    </div>
                </div>

                {/* Loading Indicator */}
                <div className="w-48 h-1.5 bg-emerald-100 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-emerald-500 rounded-full animate-loading-bar shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                </div>
            </div>

            <style>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0); }
          100% { transform: translateX(100%); }
        }
        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(-5%); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); }
          50% { transform: translateY(0); animation-timing-function: cubic-bezier(0, 0, 0.2, 1); }
        }
        .animate-loading-bar {
          animation: loading-bar 2s infinite ease-in-out;
        }
        .animate-bounce-gentle {
          animation: bounce-gentle 2s infinite;
        }
      `}</style>
        </div>
    );
};
