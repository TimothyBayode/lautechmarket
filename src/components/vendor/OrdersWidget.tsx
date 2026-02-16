import React from 'react';
import { Package, ChevronRight, Clock, AlertCircle } from 'lucide-react';
import { Order } from '../../services/orders';

interface OrdersWidgetProps {
    pendingOrders: Order[];
    onReview: () => void;
}

export const OrdersWidget: React.FC<OrdersWidgetProps> = ({
    pendingOrders,
    onReview
}) => {
    if (pendingOrders.length === 0) return null;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-amber-100 dark:border-amber-900/30 overflow-hidden mb-8 animate-in slide-in-from-right fade-in duration-500">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start space-x-4">
                        <div className="bg-amber-100 dark:bg-amber-900/40 p-3 rounded-2xl">
                            <Package className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                {pendingOrders.length} Pending Confirmations
                                <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-ping"></span>
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                                Students clicked "Order Now" on your products. Confirm if sales were completed to build your trust score!
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onReview}
                        className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                        Review Orders
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Quick Pulse */}
            <div className="px-4 py-3 bg-amber-50/50 dark:bg-amber-950/10 border-t border-amber-100 dark:border-amber-900/20 flex items-center justify-between">
                <div className="flex items-center space-x-8">
                    <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-semibold text-amber-700 dark:text-amber-500 uppercase tracking-wider">
                            Real-time pipeline
                        </span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-semibold text-amber-700 dark:text-amber-500 uppercase tracking-wider">
                            LM-REF required
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
