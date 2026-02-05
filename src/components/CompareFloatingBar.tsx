
import React from 'react';
import { ArrowRightLeft } from 'lucide-react';

interface CompareFloatingBarProps {
    count: number;
    onClear: () => void;
    onCompare: () => void;
}

export const CompareFloatingBar: React.FC<CompareFloatingBarProps> = ({ count, onClear, onCompare }) => {
    if (count === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 animate-fade-in-up">
            <div className="bg-emerald-900 text-white rounded-full shadow-2xl px-6 py-3 flex items-center gap-6 border border-emerald-700">
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-700 px-3 py-1 rounded-full text-xs font-bold text-emerald-100">
                        {count} / 3 Selected
                    </div>
                    <span className="text-sm font-medium text-emerald-100 hidden sm:inline">
                        Select up to 3 products to compare
                    </span>
                </div>

                <div className="flex items-center gap-2 border-l border-emerald-700 pl-6">
                    <button
                        onClick={onClear}
                        className="text-xs text-emerald-300 hover:text-white transition-colors mr-2 font-medium"
                    >
                        Clear
                    </button>
                    <button
                        onClick={onCompare}
                        disabled={count < 2}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all ${count >= 2
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg transform hover:-translate-y-0.5'
                            : 'bg-emerald-800 text-emerald-400 cursor-not-allowed'
                            }`}
                    >
                        {count >= 2 ? (
                            <>
                                Compare Now <ArrowRightLeft className="w-4 h-4" />
                            </>
                        ) : (
                            'Select ' + (2 - count) + ' more'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
