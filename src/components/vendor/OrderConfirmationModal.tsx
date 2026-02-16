import React, { useState } from 'react';
import { X, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Order, confirmOrder } from '../../services/orders';

interface OrderConfirmationModalProps {
    order: Order;
    onClose: () => void;
    onConfirmed: () => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
    order,
    onClose,
    onConfirmed
}) => {
    const [isCompleted, setIsCompleted] = useState<boolean | null>(null);
    const [finalAmount, setFinalAmount] = useState<number>(order.listedPrice);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isCompleted === null) return;

        setLoading(true);
        setError(null);

        try {
            await confirmOrder(order.id, isCompleted, isCompleted ? finalAmount : undefined);
            onConfirmed();
            onClose();
        } catch (err) {
            console.error("Error confirming order:", err);
            setError("Failed to update order status. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-950/20">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Confirm Order</h2>
                        <p className="text-sm text-emerald-600 font-mono">{order.orderId}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Product Summary */}
                    <div className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800">
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-white">
                            <img
                                src={order.productImage}
                                alt={order.productName}
                                className="w-full h-full object-cover"
                                onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/150")}
                            />
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white truncate">{order.productName}</p>
                            <p className="text-sm text-gray-500">Listed: ₦{order.listedPrice.toLocaleString()}</p>
                            <p className="text-xs text-gray-400">Created: {order.createdAt.toLocaleDateString()}</p>
                        </div>
                    </div>

                    {/* Question 1 */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            Was this sale completed?
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setIsCompleted(true)}
                                className={`py-3 px-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 font-medium ${isCompleted === true
                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20'
                                        : 'border-gray-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800'
                                    }`}
                            >
                                <CheckCircle className={`w-4 h-4 ${isCompleted === true ? 'text-emerald-500' : 'text-gray-400'}`} />
                                Yes
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsCompleted(false)}
                                className={`py-3 px-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 font-medium ${isCompleted === false
                                        ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20'
                                        : 'border-gray-100 dark:border-slate-800 hover:border-red-200 dark:hover:border-red-800'
                                    }`}
                            >
                                <XCircle className={`w-4 h-4 ${isCompleted === false ? 'text-red-500' : 'text-gray-400'}`} />
                                No
                            </button>
                        </div>
                    </div>

                    {/* Question 2 - Amount (Only if YES) */}
                    {isCompleted === true && (
                        <div className="space-y-3 animate-in slide-in-from-top-4 fade-in duration-300">
                            <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                                Final amount paid by student:
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₦</span>
                                <input
                                    type="number"
                                    value={finalAmount}
                                    onChange={(e) => setFinalAmount(Number(e.target.value))}
                                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 transition-all outline-none font-bold text-lg"
                                    placeholder="Enter actual price"
                                    required
                                />
                            </div>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                If price was negotiated, enter the actual paid amount.
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900 text-red-600 text-sm rounded-lg flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isCompleted === null || loading}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 dark:disabled:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                            {loading ? "Updating..." : "Confirm & Save"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
