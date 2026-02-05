import { useState } from "react";
import { Trophy, RotateCcw } from "lucide-react";
import { VendorVisitData, resetVisits, getVisitsLeaderboard } from "../services/vendorVisits";

interface AdminLeaderboardProps {
    initialLeaderboard: VendorVisitData[];
}

export function AdminLeaderboard({ initialLeaderboard }: AdminLeaderboardProps) {
    const [leaderboard, setLeaderboard] = useState<VendorVisitData[]>(initialLeaderboard);
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetPeriodName, setResetPeriodName] = useState("");
    const [resetting, setResetting] = useState(false);
    const [showAllLeaderboard, setShowAllLeaderboard] = useState(false);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <h2 className="text-lg font-bold text-gray-900">Top Visits</h2>
                </div>
                <button
                    onClick={() => setShowResetModal(true)}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-gray-50 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset</span>
                </button>
            </div>

            {leaderboard.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                    No store visits recorded yet.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Rank</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Vendor</th>
                                <th className="text-right px-6 py-4 text-sm font-medium text-gray-600">Visits</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(showAllLeaderboard ? leaderboard : leaderboard.slice(0, 23)).map((item) => (
                                <tr key={item.vendorId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="text-base font-medium">
                                            {item.rank === 1 && "🥇"}
                                            {item.rank === 2 && "🥈"}
                                            {item.rank === 3 && "🥉"}
                                            {item.rank && item.rank > 3 && item.rank}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900">{item.vendorName}</td>
                                    <td className="px-6 py-4 text-right text-gray-700 font-semibold">{item.count.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {leaderboard.length > 23 && (
                        <button
                            onClick={() => setShowAllLeaderboard(!showAllLeaderboard)}
                            className="w-full py-4 text-sm text-emerald-600 hover:text-emerald-700 hover:bg-gray-50 transition-colors font-medium border-t border-gray-100"
                        >
                            <span>{showAllLeaderboard ? '▲ Show Less' : `▼ Show ${leaderboard.length - 23} more`}</span>
                        </button>
                    )}
                </div>
            )}

            {/* Reset Leaderboard Modal */}
            {showResetModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Reset Leaderboard</h3>
                        <p className="text-gray-600 mb-6">
                            This will archive the current leaderboard and reset all counts to 0.
                        </p>
                        <div className="space-y-4">
                            <input
                                type="text"
                                value={resetPeriodName}
                                onChange={(e) => setResetPeriodName(e.target.value)}
                                placeholder="Period name (e.g., January 2026)"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowResetModal(false);
                                        setResetPeriodName("");
                                    }}
                                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!resetPeriodName.trim()) return;
                                        setResetting(true);
                                        const success = await resetVisits(resetPeriodName);
                                        if (success) {
                                            const newLeaderboard = await getVisitsLeaderboard();
                                            setLeaderboard(newLeaderboard);
                                        }
                                        setResetting(false);
                                        setShowResetModal(false);
                                        setResetPeriodName("");
                                    }}
                                    disabled={!resetPeriodName.trim() || resetting}
                                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:bg-gray-400 font-semibold shadow-lg shadow-red-200"
                                >
                                    {resetting ? "Resetting..." : "Reset & Archive"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
