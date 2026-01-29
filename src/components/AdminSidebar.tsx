import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
    BarChart2,
    Users,
    Megaphone,
    Tag,
    ShieldCheck,
    Trophy,
    LogOut,
    X
} from "lucide-react";

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
        { id: "vendors", label: "Vendors", icon: Users },
        { id: "banners", label: "Homepage Banners", icon: Megaphone },
        { id: "categories", label: "Categories", icon: Tag },
        { id: "verification", label: "Verification", icon: ShieldCheck },
        { id: "leaderboard", label: "Top Visits", icon: Trophy },
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
                <nav className="flex-1 py-6 px-3 space-y-1">
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
