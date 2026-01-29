/**
 * AdminVerificationRequests Component
 * 
 * Admin panel for viewing and managing vendor verification requests.
 */

import { useState, useEffect } from "react";
import {
    ShieldCheck,
    X,
    Eye,
    MapPin,
    Clock,
    ExternalLink,
    CheckCircle,
    XCircle,
} from "lucide-react";
import {
    VerificationRequest,
    getPendingVerificationRequests,
    deleteVerificationRequest,
    updateVerificationRequestStatus,
} from "../services/verificationRequests";
import { updateVendorProfile } from "../services/vendorAuth";

interface AdminVerificationRequestsProps {
    onClose?: () => void;
}

export function AdminVerificationRequests({ onClose }: AdminVerificationRequestsProps) {
    const [requests, setRequests] = useState<VerificationRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
    const [processing, setProcessing] = useState(false);

    // Load pending requests
    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        try {
            setLoading(true);
            const data = await getPendingVerificationRequests();
            setRequests(data);
        } catch (err) {
            console.error("Error loading verification requests:", err);
        } finally {
            setLoading(false);
        }
    };

    // Handle approve request
    const handleApprove = async (request: VerificationRequest) => {
        if (!window.confirm(`Approve verification for "${request.vendorName}"? This will mark them as verified.`)) {
            return;
        }

        setProcessing(true);
        try {
            // Update vendor as verified
            await updateVendorProfile(request.vendorId, {
                isVerified: true,
                verifiedAt: new Date(),
                storeAddress: request.location,
            });

            // Update request status
            await updateVerificationRequestStatus(request.id, 'approved');

            // Remove from list
            setRequests((prev) => prev.filter((r) => r.id !== request.id));
            setSelectedRequest(null);

            alert(`${request.vendorName} has been verified!`);
        } catch (err) {
            console.error("Error approving request:", err);
            alert("Failed to approve request. Please try again.");
        } finally {
            setProcessing(false);
        }
    };

    // Handle dismiss/reject request
    const handleDismiss = async (request: VerificationRequest) => {
        if (!window.confirm(`Dismiss verification request from "${request.vendorName}"? This will delete the request.`)) {
            return;
        }

        setProcessing(true);
        try {
            await deleteVerificationRequest(request.id);
            setRequests((prev) => prev.filter((r) => r.id !== request.id));
            setSelectedRequest(null);
        } catch (err) {
            console.error("Error dismissing request:", err);
            alert("Failed to dismiss request. Please try again.");
        } finally {
            setProcessing(false);
        }
    };

    // Format date
    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 font-bold" />
                    <h3 className="text-lg font-bold text-gray-900">
                        Verification Requests ({requests.length})
                    </h3>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            <div className="p-4">
                {requests.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No pending verification requests</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {requests.map((request) => (
                            <div
                                key={request.id}
                                className="border border-gray-200 rounded-xl p-4 hover:border-emerald-300 hover:shadow-sm transition-all bg-white"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                    <div className="flex-1 space-y-1">
                                        <h4 className="font-bold text-gray-900 text-base">
                                            {request.vendorName}
                                        </h4>
                                        <div className="flex flex-col gap-0.5">
                                            <p className="text-sm text-gray-500 font-medium">
                                                {request.vendorEmail}
                                            </p>
                                            <p className="text-sm text-gray-500 font-medium">
                                                {request.whatsappNumber}
                                            </p>
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600 pt-1">
                                            <MapPin className="w-4 h-4 mr-1 text-emerald-500" />
                                            {request.location}
                                        </div>
                                        <div className="flex items-center text-xs text-gray-400">
                                            <Clock className="w-3.5 h-3.5 mr-1" />
                                            {formatDate(request.createdAt)}
                                        </div>
                                    </div>
                                    <div className="flex items-center sm:flex-col gap-2 pt-3 sm:pt-0 border-t sm:border-none border-gray-100">
                                        <button
                                            onClick={() => setSelectedRequest(request)}
                                            className="flex-1 sm:w-10 sm:h-10 flex items-center justify-center p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all"
                                            title="View receipt"
                                        >
                                            <Eye className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleApprove(request)}
                                            disabled={processing}
                                            className="flex-1 sm:w-10 sm:h-10 flex items-center justify-center p-2.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all disabled:opacity-50"
                                            title="Approve"
                                        >
                                            <CheckCircle className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDismiss(request)}
                                            disabled={processing}
                                            className="flex-1 sm:w-10 sm:h-10 flex items-center justify-center p-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all disabled:opacity-50"
                                            title="Dismiss"
                                        >
                                            <XCircle className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Receipt Preview Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h3 className="font-semibold text-gray-900">
                                Receipt from {selectedRequest.vendorName}
                            </h3>
                            <button
                                onClick={() => setSelectedRequest(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4">
                            <div className="mb-4 space-y-2">
                                <p className="text-sm">
                                    <strong>Vendor:</strong> {selectedRequest.vendorName}
                                </p>
                                <p className="text-sm">
                                    <strong>Email:</strong> {selectedRequest.vendorEmail}
                                </p>
                                <p className="text-sm">
                                    <strong>WhatsApp:</strong> {selectedRequest.whatsappNumber}
                                </p>
                                <p className="text-sm">
                                    <strong>Location:</strong> {selectedRequest.location}
                                </p>
                                <p className="text-sm">
                                    <strong>Submitted:</strong> {formatDate(selectedRequest.createdAt)}
                                </p>
                            </div>
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <img
                                    src={selectedRequest.receiptUrl}
                                    alt="Payment receipt"
                                    className="w-full"
                                />
                            </div>
                            <a
                                href={selectedRequest.receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center space-x-2 mt-4 text-emerald-600 hover:text-emerald-700"
                            >
                                <ExternalLink className="w-4 h-4" />
                                <span>Open full image</span>
                            </a>
                            <div className="flex space-x-3 mt-6">
                                <button
                                    onClick={() => handleDismiss(selectedRequest)}
                                    disabled={processing}
                                    className="flex-1 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                                >
                                    Dismiss
                                </button>
                                <button
                                    onClick={() => handleApprove(selectedRequest)}
                                    disabled={processing}
                                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                                >
                                    Approve & Verify
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
