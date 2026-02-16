import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    ArrowLeft,
    ShoppingBag,
    ChevronRight,
    Download,
    Search,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle
} from 'lucide-react';
import { Order, getVendorOrders } from '../../services/orders';
import { Header } from '../../components/Header';
import { vendorAuthStateListener } from '../../services/vendorAuth';
import { OrderConfirmationModal } from '../../components/vendor/OrderConfirmationModal';
import { getProxiedImageUrl } from '../../utils/imageUrl';

const OrdersPage: React.FC = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [vendor, setVendor] = useState<any>(null);
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmingOrder, setConfirmingOrder] = useState<Order | null>(null);

    useEffect(() => {
        const unsubscribe = vendorAuthStateListener((currentVendor) => {
            if (!currentVendor) {
                navigate('/vendor/login');
                return;
            }
            setVendor(currentVendor);
            loadOrders(currentVendor.id);
        });

        return () => unsubscribe();
    }, [navigate]);

    const loadOrders = async (vendorId: string) => {
        setLoading(true);
        try {
            const data = await getVendorOrders(vendorId);
            setOrders(data);
        } catch (err) {
            console.error("Failed to load orders:", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        const matchesSearch = order.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.orderId.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    PENDING
                </span>;
            case 'confirmed':
                return <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3" />
                    CONFIRMED
                </span>;
            case 'cancelled':
                return <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <XCircle className="w-3 h-3" />
                    CANCELLED
                </span>;
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="flex items-center justify-center p-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <Link
                        to="/vendor/dashboard"
                        className="inline-flex items-center space-x-2 text-gray-600 hover:text-emerald-600 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back to Dashboard</span>
                    </Link>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Orders History</h1>
                        <p className="text-gray-500">Manage and track your sales performance</p>
                    </div>
                    <button className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search by order ID or product name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 placeholder:text-gray-400 text-sm"
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl w-full md:w-auto">
                        {(['all', 'pending', 'confirmed', 'cancelled'] as const).map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${statusFilter === status
                                    ? 'bg-white text-emerald-600 shadow-sm'
                                    : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Orders List */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/50">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Order & Date</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Product</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Amount</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center text-gray-400 italic">
                                            No orders found matching your criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOrders.map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-50 group transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-black text-gray-900">{order.orderId}</p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase">{order.createdAt.toLocaleDateString()}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                                        <img
                                                            src={getProxiedImageUrl(order.productImage) || order.productImage}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900 max-w-[200px] truncate">{order.productName}</p>
                                                        <p className="text-[10px] text-emerald-600 font-bold uppercase">{order.category}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(order.status)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-black text-gray-900">
                                                    ₦{(order.finalAmount || order.listedPrice).toLocaleString()}
                                                </p>
                                                {order.finalAmount && order.finalAmount !== order.listedPrice && (
                                                    <p className="text-[10px] text-orange-500 font-bold line-through">
                                                        ₦{order.listedPrice.toLocaleString()}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {order.status === 'pending' ? (
                                                    <button
                                                        onClick={() => setConfirmingOrder(order)}
                                                        className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-colors shadow-sm"
                                                    >
                                                        Confirm
                                                    </button>
                                                ) : (
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                                                            <ShoppingBag className="w-4 h-4" />
                                                        </button>
                                                        <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                                                            <ChevronRight className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Funnel Note */}
                <div className="mt-8 bg-blue-50 rounded-2xl p-6 border border-blue-100 flex items-start gap-4">
                    <div className="bg-blue-100 p-2 rounded-xl">
                        <AlertCircle className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h4 className="font-bold text-blue-900">Why confirm orders?</h4>
                        <p className="text-sm text-blue-700 mt-1">
                            Confirming sales helps us track your revenue performance and improves your store's ranking.
                            Orders confirmed within 24 hours receive a "Quick Responder" boost.
                        </p>
                    </div>
                </div>
            </main>

            {confirmingOrder && (
                <OrderConfirmationModal
                    order={confirmingOrder}
                    onClose={() => setConfirmingOrder(null)}
                    onConfirmed={() => {
                        if (vendor) loadOrders(vendor.id);
                        setConfirmingOrder(null);
                    }}
                />
            )}
        </div>
    );
};

export default OrdersPage;
