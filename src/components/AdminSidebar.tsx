import {
    BarChart2,
    Users,
    Megaphone,
    Tag,
    ShieldCheck,
    Trophy,
    LogOut,
    X,
    PieChart,
    Search,
    Flame,
    Activity,
    MoveDown,
    Star,
    Mail,
    Globe2
} from "lucide-react";
import { getCurrentUser } from "../services/auth";

interface AdminSidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    onLogout: () => void;
    isOpen?: boolean;
    onClose?: () => void;
}

export function AdminSidebar({ activeTab, onTabChange, onLogout, isOpen, onClose }: AdminSidebarProps) {
    const menuItems = [
        { id: "overview", label: "Overview", icon: BarChart2 },
        { id: "category-stats", label: "Category Stats", icon: PieChart },
        { id: "market-intelligence", label: "Market Intelligence", icon: Activity },
        { id: "demand-gap", label: "Demand Gap", icon: MoveDown },
        { id: "search-analytics", label: "Search Analytics", icon: Search },
        { id: "product-interactions", label: "Product Hotlist", icon: Flame },
        { id: "vendors", label: "Vendors", icon: Users },
        { id: "banners", label: "Homepage Banners", icon: Megaphone },
        { id: "categories", label: "Categories", icon: Tag },
        { id: "expansion-circle", label: "Expansion Circle", icon: Globe2 },
        { id: "curation", label: "Curation & Top 3", icon: Star },
        { id: "verification", label: "Verification", icon: ShieldCheck },
        { id: "leaderboard", label: "Top Visits", icon: Trophy },
        { id: "audit-logs", label: "Audit Logs", icon: ShieldCheck },
    ];

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-[#0a4d3c] text-white flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
                {/* Header/Brand */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-bold">Admin Panel</h1>
                        <p className="text-xs text-white/60">Manage your marketplace</p>
                    </div>
                    <button onClick={onClose} className="lg:hidden p-2 hover:bg-white/10 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto scrollbar-hide">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    onTabChange(item.id);
                                    onClose?.();
                                }}
                                className={`
                  w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                  ${isActive
                                        ? "bg-white/20 text-white shadow-lg shadow-black/10"
                                        : "text-white/70 hover:bg-white/10 hover:text-white"
                                    }
                `}
                            >
                                <Icon className="w-5 h-5" />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* User Info */}
                <div className="px-6 py-4 border-t border-white/10 bg-black/10">
                    <div className="flex items-center space-x-3 mb-1">
                        <Mail className="w-4 h-4 text-white/40" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Logged in as</span>
                    </div>
                    <p className="text-xs font-bold truncate text-emerald-400">
                        {getCurrentUser()?.email || "Unknown Admin"}
                    </p>
                </div>

                {/* Footer/Logout */}
                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
