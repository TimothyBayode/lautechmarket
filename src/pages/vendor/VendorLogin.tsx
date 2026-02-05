import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Lock, Mail, Store, Loader2 } from "lucide-react";
import { loginVendor, sendVendorPasswordReset } from "../../services/vendorAuth";
import { trackVendorActivity } from "../../services/vendorActivity";
import { auth } from "../../firebase";

/**
 * VendorLogin Component
 * 
 * Login page for existing vendors to access their dashboard.
 */
export function VendorLogin() {
    const navigate = useNavigate();

    // Form state
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // UI state
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Forgot password state
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState("");
    const [resetLoading, setResetLoading] = useState(false);
    const [resetMessage, setResetMessage] = useState("");
    const [resetError, setResetError] = useState("");

    // Get user-friendly error message
    const getFriendlyErrorMessage = (error: any): string => {
        const message = error.message || "";

        if (message.includes("No account found")) {
            return "No account found with this email.";
        }
        if (message.includes("Invalid password")) {
            return "Incorrect password. Please try again.";
        }
        return "Login failed. Please try again.";
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await loginVendor(email, password);
            // Track activity
            if (auth.currentUser) {
                await trackVendorActivity(auth.currentUser.uid);
            }
            navigate("/vendor/dashboard");
        } catch (err: any) {
            console.error("Login error:", err);
            const friendlyError = getFriendlyErrorMessage(err);
            setError(friendlyError);
        } finally {
            setLoading(false);
        }
    };

    // Handle forgot password
    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setResetError("");
        setResetMessage("");
        setResetLoading(true);

        try {
            await sendVendorPasswordReset(resetEmail);
            setResetMessage("Password reset email sent! Check your inbox.");
            setResetEmail("");
        } catch (err: any) {
            setResetError(err.message || "Failed to send reset email.");
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                {/* Header Section */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600 rounded-full mb-4">
                        <Store className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Vendor Login
                    </h1>
                    <p className="text-gray-600">
                        Access your vendor dashboard
                    </p>
                </div>

                {/* Login Form Card */}
                <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {/* Email Input */}
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    placeholder="vendor@example.com"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    placeholder="Enter your password"
                                />
                            </div>
                        </div>

                        {/* Forgot Password Link */}
                        <div className="text-right">
                            <button
                                type="button"
                                onClick={() => setShowForgotPassword(true)}
                                className="text-sm text-emerald-600 hover:text-emerald-700"
                            >
                                Forgot Password?
                            </button>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-600 text-white py-3 px-6 rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                            {loading ? "Signing In..." : "Sign In"}
                        </button>
                    </form>

                    {/* Register Link */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-600">
                            Don't have an account?{" "}
                            <Link
                                to="/vendor/register"
                                className="text-emerald-600 hover:text-emerald-700 font-medium"
                            >
                                Create Account
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Back to Home Link */}
                <div className="mt-6 text-center">
                    <Link
                        to="/"
                        className="text-gray-600 hover:text-emerald-600 transition-colors"
                    >
                        Back to Home
                    </Link>
                </div>
            </div>

            {/* Forgot Password Modal */}
            {showForgotPassword && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            Reset Password
                        </h2>
                        <p className="text-gray-600 text-sm mb-4">
                            Enter your email address and we'll send you a link to reset your password.
                        </p>

                        {/* Spam tip at top */}
                        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm mb-4">
                            <strong>Can't find the email?</strong> Check your spam/junk folder.
                        </div>

                        <form onSubmit={handleForgotPassword} className="space-y-4">
                            {resetMessage && (
                                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                                    {resetMessage}
                                </div>
                            )}
                            {resetError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                    {resetError}
                                </div>
                            )}

                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    placeholder="Enter your email"
                                />
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForgotPassword(false);
                                        setResetEmail("");
                                        setResetMessage("");
                                        setResetError("");
                                    }}
                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={resetLoading}
                                    className="flex-1 bg-emerald-600 text-white px-4 py-3 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center"
                                >
                                    {resetLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        "Send Reset Link"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
