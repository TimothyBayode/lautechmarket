import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, Eye, EyeOff, ShieldCheck, Chrome } from "lucide-react";
import {
  loginUser,
  isAdmin,
  verifyGoogleIdentity,
  verifyGoogleIdentityWithRedirect,
  handleGoogleRedirectResult,
  isGoogleIdentityVerified
} from "../services/auth";

export function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  useEffect(() => {
    if (isGoogleIdentityVerified()) {
      setStep(2);
      return;
    }

    // Check for redirect result
    const checkRedirect = async () => {
      setLoading(true);
      const success = await handleGoogleRedirectResult();
      if (success === true) {
        setStep(2);
      } else if (success === false) {
        setError("Identity Verification Failed: You must sign in with the authorized Google admin account.");
      }
      setLoading(false);
    };
    checkRedirect();
  }, []);

  const getFriendlyErrorMessage = (error: any): string => {
    const errorCode = error.code;

    switch (errorCode) {
      case "auth/invalid-credential":
        return "Invalid email or password.";
      case "auth/user-not-found":
        return "Account not found.";
      case "auth/wrong-password":
        return "Incorrect password.";
      case "auth/invalid-email":
        return "Invalid email address format.";
      case "auth/too-many-requests":
        return "Too many attempts. Please try again later.";
      case "auth/network-request-failed":
        return "Network error. Please check your internet connection.";
      default:
        return "Login failed. Please try again.";
    }
  };

  const handleVerifyIdentity = async () => {
    setError("");
    setLoading(true);
    try {
      const success = await verifyGoogleIdentity();
      if (success) {
        setStep(2);
      } else {
        setError("Identity Verification Failed: You must sign in with the authorized Google admin account.");
      }
    } catch (err: any) {
      console.error("Identity error:", err);
      if (err.code === "auth/unauthorized-domain") {
        setError("Domain Not Authorized: Please add 'www.lautechmarket.com.ng' to the Authorized Domains in your Firebase Console (Authentication -> Settings).");
      } else if (err.code === "auth/operation-not-allowed") {
        setError("Sign-in Method Disabled: Please enable 'Google' as a Sign-in provider in your Firebase Console (Authentication -> Sign-in method).");
      } else if (err.code === "auth/popup-closed-by-user") {
        setError("Popup Blocked or Closed: Your browser's security policy (COOP) blocked the login window. Please use the 'Try Redirect' option below.");
      } else {
        setError("Verification Error: " + (err.message || "An unexpected error occurred."));
      }
    }
    setLoading(false);
  };

  const handleVerifyWithRedirect = async () => {
    setError("");
    setLoading(true);
    try {
      await verifyGoogleIdentityWithRedirect();
    } catch (err: any) {
      console.error("Identity error (Redirect):", err);
      setError("Redirect Error: " + (err.message || "Could not initiate redirect."));
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await loginUser(email, password);

      // Secondary check: ensure the email is an authorized admin
      if (!isAdmin(user.email)) {
        console.warn("Unauthorized admin login attempted:", user.email);
        setError("Unauthorized: This account does not have admin privileges.");
        return;
      }

      console.log("Admin logged in:", user.email);
      navigate("/admin/dashboard");
    } catch (err: any) {
      console.error("Login error:", err);
      const friendlyError = getFriendlyErrorMessage(err);
      setError(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 group">
            <img src="/logo_icon.png" alt="LAUTECH Market Icon" className="w-10 h-10 object-contain" />
            <img src="/logo_text.png" alt="LAUTECH Market" className="h-8 object-contain dark:invert" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mt-4">Admin Security</h2>
          <p className="text-gray-600">Access the LAUTECH Market admin dashboard</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6 flex items-start">
              <ShieldCheck className="w-5 h-5 mr-3 shrink-0 mt-0.5 opacity-50" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-8 h-8 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Identity Verification</h3>
                  <p className="text-sm text-gray-500">Please verify your identity using your authorized Google account before accessing admin credentials.</p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleVerifyIdentity}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 text-gray-700 py-3.5 px-6 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all font-bold group shadow-sm hover:shadow-md"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Chrome className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
                      <span>Verify with Popup</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleVerifyWithRedirect}
                  disabled={loading}
                  className="w-full text-center text-[10px] text-gray-400 hover:text-emerald-600 font-bold uppercase tracking-widest transition-colors"
                >
                  Trouble with popups? Try Redirect
                </button>
              </div>

              <p className="text-[10px] text-center text-gray-400 font-medium italic">
                Authorized identity required
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Identity Verified</span>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2"
                >
                  Admin Credentials
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium"
                    placeholder="Enter admin email"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2"
                >
                  Admin Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 text-white py-4 px-6 rounded-xl hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all font-black uppercase tracking-widest text-sm shadow-md hover:shadow-lg active:scale-95"
              >
                {loading ? "Authenticating..." : "Enter Dashboard"}
              </button>

              <button
                type="button"
                onClick={() => {
                  sessionStorage.removeItem("admin_identity_verified");
                  setStep(1);
                }}
                className="w-full text-center text-[10px] text-gray-400 hover:text-emerald-600 font-bold uppercase tracking-widest transition-colors mt-2"
              >
                Reset Verification
              </button>
            </form>
          )}
        </div>

        <p className="text-center mt-8 text-gray-400 text-xs font-medium">
          &copy; {new Date().getFullYear()} LAUTECH Market. All rights reserved.
        </p>
      </div>
    </div>
  );
}