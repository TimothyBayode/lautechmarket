import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            // Prevent browser's default bar
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Show our custom banner after a delay
            setTimeout(() => setShowPrompt(true), 3000);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setShowPrompt(false);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the browser install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:w-80 bg-white rounded-2xl shadow-2xl border border-emerald-100 p-4 z-[9999] animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button
                onClick={() => setShowPrompt(false)}
                className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
                <X size={18} />
            </button>

            <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Download className="text-emerald-600" size={24} />
                </div>

                <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-900 mb-1">Install LAUTECH Market</h3>
                    <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                        Get the full experience with our app. Fast, easy, and works offline!
                    </p>

                    <button
                        onClick={handleInstallClick}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-all active:scale-95 shadow-lg shadow-emerald-200"
                    >
                        Install App
                    </button>
                </div>
            </div>
        </div>
    );
}
