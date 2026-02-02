/**
 * VerificationRequestModal Component
 * 
 * Modal for vendors to submit verification requests.
 * Collects location, shows payment info, and uploads receipt.
 */

import { useState } from "react";
import { X, MapPin, Upload, CreditCard, Loader2, CheckCircle } from "lucide-react";
import { uploadImage } from "../services/storage";
import { submitVerificationRequest, hasPendingRequest } from "../services/verificationRequests";

interface VerificationRequestModalProps {
    vendorId: string;
    vendorName: string;
    vendorEmail: string;
    onClose: () => void;
    onSuccess: () => void;
}

export function VerificationRequestModal({
    vendorId,
    vendorName,
    vendorEmail,
    onClose,
    onSuccess,
}: VerificationRequestModalProps) {
    const [location, setLocation] = useState("");
    const [whatsappNumber, setWhatsappNumber] = useState("");
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [receiptPreview, setReceiptPreview] = useState("");
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // Handle receipt file selection
    const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setReceiptFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setReceiptPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validation
        if (!whatsappNumber.trim()) {
            setError("Please enter your WhatsApp number");
            return;
        }
        if (!location.trim()) {
            setError("Please enter your location");
            return;
        }
        if (!receiptFile) {
            setError("Please upload your payment receipt");
            return;
        }

        setSubmitting(true);

        try {
            // Check if already has pending request
            const hasPending = await hasPendingRequest(vendorId);
            if (hasPending) {
                setError("You already have a pending verification request. Please wait for admin review.");
                setSubmitting(false);
                return;
            }

            // Upload receipt image
            setUploading(true);
            const uploadResult = await uploadImage(receiptFile);
            setUploading(false);

            if (!uploadResult.url) {
                setError("Failed to upload receipt. Please try again.");
                setSubmitting(false);
                return;
            }

            // Submit verification request
            await submitVerificationRequest(
                vendorId,
                vendorName,
                vendorEmail,
                `+234${whatsappNumber.trim()}`,
                location.trim(),
                uploadResult.url
            );

            setSuccess(true);
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 2000);
        } catch (err) {
            console.error("Error submitting verification request:", err);
            setError("Failed to submit request. Please try again.");
        } finally {
            setSubmitting(false);
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">Get Verified</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {success ? (
                    <div className="p-8 text-center">
                        <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            Request Submitted!
                        </h3>
                        <p className="text-gray-600">
                            Your verification request has been sent to the admin for review.
                            You'll be notified once it's approved.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-4 space-y-6">
                        {/* Payment Info */}
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                                <CreditCard className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold text-emerald-800 mb-2">
                                        Verification Fee: ₦2,000
                                    </h3>
                                    <div className="text-sm text-emerald-700 space-y-1">
                                        <p><strong>Bank:</strong> [Your Bank Name]</p>
                                        <p><strong>Account Number:</strong> 1234567890</p>
                                        <p><strong>Account Name:</strong> LAUTECH Market</p>
                                    </div>
                                    <p className="mt-2 text-xs text-emerald-600">
                                        Transfer ₦2,000 to the account above and upload your receipt below.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Physical Verification Notice */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                            If this is your first time we will contact you to verify your store location before we approve your verification.
                        </div>

                        {/* WhatsApp Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                WhatsApp Number
                            </label>
                            <div className="flex w-full">
                                <span className="inline-flex items-center px-3 py-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-600 font-medium text-sm flex-shrink-0">
                                    +234
                                </span>
                                <input
                                    type="tel"
                                    value={whatsappNumber}
                                    onChange={(e) => {
                                        let value = e.target.value.replace(/\D/g, ''); // Only digits
                                        if (value.startsWith('0')) {
                                            value = value.substring(1); // Remove leading 0
                                        }
                                        if (value.length <= 10) {
                                            setWhatsappNumber(value);
                                        }
                                    }}
                                    maxLength={10}
                                    placeholder="8012345678"
                                    className="w-full min-w-0 px-4 py-3 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Location Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Your Location / Address
                            </label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="e.g. B.O.T Hostel, LAUTECH Campus"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Receipt Upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Upload Payment Receipt
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-emerald-400 transition-colors">
                                {receiptPreview ? (
                                    <div className="space-y-3">
                                        <img
                                            src={receiptPreview}
                                            alt="Receipt preview"
                                            className="max-h-40 mx-auto rounded-lg"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setReceiptFile(null);
                                                setReceiptPreview("");
                                            }}
                                            className="text-sm text-red-600 hover:text-red-700"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <label className="cursor-pointer block">
                                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm text-gray-600">
                                            Click to upload receipt
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            PNG, JPG up to 5MB
                                        </p>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleReceiptChange}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || uploading}
                                className="flex-1 bg-emerald-600 text-white px-4 py-3 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                            >
                                {submitting || uploading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>{uploading ? "Uploading..." : "Submitting..."}</span>
                                    </>
                                ) : (
                                    <span>Submit Request</span>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
