import React, { useState, useEffect, useCallback } from 'react';

export interface ToastMessage {
    id: string;
    message: string;
    type?: 'success' | 'error' | 'info';
    duration?: number;
}

export const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success', duration: number = 2000) => {
    const event = new CustomEvent('show-toast', {
        detail: { message, type, duration }
    });
    window.dispatchEvent(event);
};

export const ToastContainer: React.FC = () => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    useEffect(() => {
        const handleShowToast = (e: Event) => {
            const { message, type, duration } = (e as CustomEvent).detail;
            const id = Math.random().toString(36).substring(2, 9);

            setToasts((prev) => [...prev, { id, message, type, duration }]);

            setTimeout(() => {
                removeToast(id);
            }, duration || 2000);
        };

        window.addEventListener('show-toast', handleShowToast);
        return () => window.removeEventListener('show-toast', handleShowToast);
    }, [removeToast]);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`
            pointer-events-auto
            px-6 py-3 rounded-xl shadow-2xl 
            animate-in fade-in slide-in-from-right-4 duration-300
            ${toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}
            text-white font-bold flex items-center space-x-2
          `}
                >
                    {toast.type === 'success' && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                    <span>{toast.message}</span>
                </div>
            ))}
        </div>
    );
};
