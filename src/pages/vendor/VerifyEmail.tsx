import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, RefreshCw, CheckCircle, LogOut } from "lucide-react";
import { auth } from "../../firebase";
import { sendEmailVerification, onAuthStateChanged } from "firebase/auth";
import { logoutVendor } from "../../services/vendorAuth";

/**
 * VerifyEmail Component
 * 
 * Page shown to vendors who haven't verified their email yet.
 * Blocks access to dashboard until email is verified.
 */
export function VerifyEmail() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [checking, setChecking] = useState(false);

    // Check if email is verified on mount and periodically
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                navigate("/vendor/login");
            } else if (user.emailVerified) {
                navigate("/vendor/dashboard");
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    // Resend verification email
    const handleResendEmail = async () => {
        setLoading(true);
        setMessage("");
        setError("");

        try {
            if (auth.currentUser) {
                await sendEmailVerification(auth.currentUser);
                setMessage("Verification email sent! Check your inbox.");
            }
        } catch (err: any) {
            console.error("Error sending verification email:", err);
            if (err.code === "auth/too-many-requests") {
                setError("Too many requests. Please wait a few minutes before trying again.");
            } else {
                setError("Failed to send email. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    // Check verification status
    const handleCheckVerification = async () => {
        setChecking(true);
        setError("");

        try {
            if (auth.currentUser) {
                await auth.currentUser.reload();
                if (auth.currentUser.emailVerified) {
                    navigate("/vendor/dashboard");
                } else {
                    setError("Email not verified yet. Please check your inbox and click the verification link.");
                }
            }
        } catch (err) {
            console.error("Error checking verification:", err);
            setError("Failed to check verification status.");
        } finally {
            setChecking(false);
        }
    };

    // Handle logout
    const handleLogout = async () => {
        try {
            await logoutVendor();
            navigate("/vendor/login");
        } catch (err) {
            console.error("Logout error:", err);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 rounded-full mb-4">
                        <Mail className="w-10 h-10 text-amber-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Verify Your Email
                    </h1>
                    <p className="text-gray-600">
                        We've sent a verification link to your email address.
                        Please check your inbox and click the link to verify.
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
                    {/* Spam tip at top */}
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm mb-6">
                        <strong>Can't find the email?</strong> Check your spam/junk folder.
                    </div>

                    {/* Email display */}
                    <div className="text-center mb-6">
                        <p className="text-sm text-gray-500">Verification sent to:</p>
                        <p className="font-semibold text-gray-900">
                            {auth.currentUser?.email}
                        </p>
                    </div>

                    {/* Messages */}
                    {message && (
                        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {message}
                        </div>
                    )}
                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="space-y-3">
                        <button
                            onClick={handleCheckVerification}
                            disabled={checking}
                            className="w-full bg-emerald-600 text-white py-3 px-6 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors font-medium flex items-center justify-center"
                        >
                            {checking ? (
                                <>
                                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                    Checking...
                                </>
                            ) : (
                                "I've Verified My Email"
                            )}
                        </button>

                        <button
                            onClick={handleResendEmail}
                            disabled={loading}
                            className="w-full border border-emerald-600 text-emerald-600 py-3 px-6 rounded-lg hover:bg-emerald-50 disabled:opacity-50 transition-colors font-medium flex items-center justify-center"
                        >
                            {loading ? (
                                <>
                                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Mail className="w-5 h-5 mr-2" />
                                    Resend Verification Email
                                </>
                            )}
                        </button>

                        <button
                            onClick={handleLogout}
                            className="w-full text-gray-500 hover:text-gray-700 py-2 transition-colors flex items-center justify-center"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Sign Out
                        </button>
                    </div>


                </div>

                {/* Back to Home */}
                <div className="mt-6 text-center">
                    <Link
                        to="/"
                        className="text-gray-600 hover:text-emerald-600 transition-colors"
                    >
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
