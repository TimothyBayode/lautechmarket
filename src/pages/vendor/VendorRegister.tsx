import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Mail, Lock, Phone, Store, MapPin, Eye, EyeOff } from "lucide-react";
import { registerVendor } from "../../services/vendorAuth";

/**
 * VendorRegister Component
 * 
 * Registration page for new vendors to create an account.
 * Collects name, email, password, WhatsApp number, and business name.
 */
export function VendorRegister() {
    const navigate = useNavigate();

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        whatsappNumber: "",
        businessName: "",
        description: "",
        storeAddress: "",
    });

    // UI state
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Handle input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Validate form before submission
    const validateForm = (): string | null => {
        if (!formData.name.trim()) {
            return "Please enter your full name";
        }
        if (!formData.email.trim()) {
            return "Please enter your email address";
        }
        if (!formData.email.includes("@")) {
            return "Please enter a valid email address";
        }
        if (formData.password.length < 6) {
            return "Password must be at least 6 characters";
        }
        if (formData.password !== formData.confirmPassword) {
            return "Passwords do not match";
        }
        if (!formData.whatsappNumber.trim()) {
            return "Please enter your WhatsApp number";
        }
        if (!formData.businessName.trim()) {
            return "Please enter your business name";
        }
        if (formData.description.trim() && formData.description.trim().length < 80) {
            return "Store description must be at least 80 characters";
        }
        return null;
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");

        // Validate form
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);

        try {
            await registerVendor(
                formData.name,
                formData.email,
                formData.password,
                `+234${formData.whatsappNumber}`,
                formData.businessName,
                formData.description,
                formData.storeAddress
            );
            navigate("/vendor/dashboard");
        } catch (err: any) {
            console.error("Registration error:", err);
            setError(err.message || "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center px-4 py-8">
            <div className="max-w-md w-full">
                {/* Header Section */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600 rounded-full mb-4">
                        <Store className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Become a Vendor
                    </h1>
                    <p className="text-gray-600">
                        Create an account to start selling on LAUTECH Market
                    </p>
                </div>

                {/* Registration Form Card */}
                <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {/* Full Name Input */}
                        <div>
                            <label
                                htmlFor="name"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Full Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>

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
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
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
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password Input */}
                        <div>
                            <label
                                htmlFor="confirmPassword"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    placeholder="Confirm your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* WhatsApp Number Input */}
                        <div>
                            <label
                                htmlFor="whatsappNumber"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                WhatsApp Number
                            </label>
                            <div className="flex w-full">
                                <span className="inline-flex items-center px-3 py-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-600 font-medium text-sm flex-shrink-0">
                                    +234
                                </span>
                                <input
                                    id="whatsappNumber"
                                    name="whatsappNumber"
                                    type="tel"
                                    value={formData.whatsappNumber}
                                    onChange={(e) => {
                                        let value = e.target.value.replace(/\D/g, ''); // Only digits
                                        if (value.startsWith('0')) {
                                            value = value.substring(1); // Remove leading 0
                                        }
                                        if (value.length <= 10) {
                                            setFormData(prev => ({ ...prev, whatsappNumber: value }));
                                        }
                                    }}
                                    required
                                    maxLength={10}
                                    className="w-full min-w-0 px-4 py-3 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    placeholder="8012345678"
                                />
                            </div>
                        </div>

                        {/* Business Name Input */}
                        <div>
                            <label
                                htmlFor="businessName"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Business Name
                            </label>
                            <div className="relative">
                                <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    id="businessName"
                                    name="businessName"
                                    type="text"
                                    value={formData.businessName}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    placeholder="Your Store Name"
                                />
                            </div>
                        </div>

                        {/* Description Input */}
                        <div>
                            <label
                                htmlFor="description"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Store Description (Min 80 characters)
                            </label>
                            <div className="relative">
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    placeholder="Describe what you do, where you’re located, and why students trust you."
                                />
                            </div>
                        </div>

                        {/* Store Address Input */}
                        <div>
                            <label
                                htmlFor="storeAddress"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Store Address / Location (Optional)
                            </label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    id="storeAddress"
                                    name="storeAddress"
                                    type="text"
                                    value={formData.storeAddress}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    placeholder="e.g. B.O.T Hostel, LAUTECH Campus"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-600 text-white py-3 px-6 rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                            {loading ? "Creating Account..." : "Create Account"}
                        </button>
                    </form>

                    {/* Login Link */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-600">
                            Already have an account?{" "}
                            <Link
                                to="/vendor/login"
                                className="text-emerald-600 hover:text-emerald-700 font-medium"
                            >
                                Sign In
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
        </div>
    );
}
