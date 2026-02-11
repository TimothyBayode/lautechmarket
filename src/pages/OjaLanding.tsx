import { useState } from "react";
import {
    Send,
    CheckCircle2,
    ArrowRight,
    Building2,
    Users,
    Globe2,
    MessageSquare,
    Sparkles,
    Shield
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { submitExpansionResponse } from "../services/expansion";
import { toast } from "react-hot-toast";

type UsageOption = 'buy' | 'sell' | 'audience' | 'partner' | 'interested';
type IntentStrength = 'definitely' | 'very_likely' | 'maybe' | 'curious';

export function OjaLanding() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        fullName: "",
        whatsappNumber: "",
        email: "",
        city: "",
        state: "",
        country: "Nigeria",
        usagePlan: [] as UsageOption[],
        businessName: "",
        businessType: "",
        whatsappBusinessNumber: "",
        currentOperatingCity: "",
        hasAudience: false,
        audiencePlatform: "",
        audienceSize: "small" as any,
        intentStrength: "very_likely" as IntentStrength,
        wantsEarlyAccess: true,
        openToHelping: false
    });

    const isBusinessUser = formData.usagePlan.some(u => ['sell', 'partner'].includes(u));

    const handleUsageToggle = (option: UsageOption) => {
        setFormData(prev => ({
            ...prev,
            usagePlan: prev.usagePlan.includes(option)
                ? prev.usagePlan.filter(u => u !== option)
                : [...prev.usagePlan, option]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.usagePlan.length === 0) {
            toast.error("Please select how you plan to use Lautech Market");
            return;
        }

        setIsSubmitting(true);
        try {
            await submitExpansionResponse({
                ...formData,
                audienceSize: formData.hasAudience ? formData.audienceSize : undefined,
                audiencePlatform: formData.hasAudience ? formData.audiencePlatform : undefined,
                businessName: isBusinessUser ? formData.businessName : undefined,
                businessType: isBusinessUser ? formData.businessType : undefined,
                whatsappBusinessNumber: isBusinessUser ? formData.whatsappBusinessNumber : undefined,
                currentOperatingCity: isBusinessUser ? formData.currentOperatingCity : undefined,
                source: 'oja_form'
            });
            setIsSuccess(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            toast.error("Failed to submit. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white rounded-[3rem] p-12 text-center shadow-[0_32px_64px_-16px_rgba(180,83,9,0.1)] animate-scale-in border border-[#B45309]/5">
                    <div className="w-24 h-24 bg-[#14532D]/10 rounded-full flex items-center justify-center mx-auto mb-8">
                        <CheckCircle2 className="w-12 h-12 text-[#14532D]" />
                    </div>
                    <h2 className="text-3xl font-black text-[#1a1a1a] mb-4 tracking-tight">You're in the Circle!</h2>
                    <p className="text-[#4a4a4a] mb-10 leading-relaxed text-lg">
                        Thank you for helping us grow. We'll reach out on WhatsApp as soon as we're ready to launch in <span className="font-bold text-[#B45309]">{formData.city}</span>.
                    </p>
                    <button
                        onClick={() => navigate("/")}
                        className="w-full py-5 bg-[#B45309] text-white rounded-2xl font-bold hover:bg-[#92400e] transition-all shadow-xl shadow-[#B45309]/20 active:scale-[0.98]"
                    >
                        Back to Marketplace
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAF7F2] text-[#1a1a1a] selection:bg-[#B45309]/20 font-sans">
            {/* Navigation */}
            <nav className="absolute top-0 left-0 right-0 p-8 flex justify-end items-center z-20 max-w-7xl mx-auto">
                <button
                    onClick={() => navigate("/")}
                    className="px-6 py-3 bg-white hover:bg-[#FAF7F2] border border-[#B45309]/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-[#B45309] transition-all shadow-sm flex items-center gap-3 group"
                >
                    <span>Experience market</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
            </nav>

            {/* Hero Section */}
            <div className="relative overflow-hidden pt-40 pb-20 px-6">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-[#B45309]/5 blur-[160px] rounded-full pointer-events-none" />

                <div className="max-w-4xl mx-auto text-center relative">
                    <div className="inline-flex items-center space-x-3 px-5 py-2.5 bg-[#B45309]/10 border border-[#B45309]/10 rounded-full text-[#B45309] text-[10px] font-black uppercase tracking-[0.2em] mb-10 animate-fade-in">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>OJA Expansion Circle</span>
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black mb-8 tracking-tighter leading-[0.95] text-[#1a1a1a]">
                        Bringing <span className="text-[#B45309]">OJA</span> to your city.
                    </h1>

                    <p className="text-xl md:text-2xl text-[#4a4a4a] mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
                        Join the waitlist and help us decide where to expand next. Direct access to student-led commerce, simplified.
                    </p>

                    <div className="flex flex-wrap justify-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-[#1a1a1a]/40">
                        <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            <span>Powered by OJA</span>
                        </div>
                        <div className="w-1.5 h-1.5 bg-[#B45309]/20 rounded-full self-center" />
                        <span>Built for Expansion</span>
                    </div>
                </div>
            </div>

            {/* Form Section */}
            <div className="max-w-2xl mx-auto px-6 pb-32">
                <form onSubmit={handleSubmit} className="bg-white rounded-[4rem] p-10 md:p-16 text-[#1a1a1a] shadow-[0_48px_96px_-24px_rgba(180,83,9,0.08)] space-y-16 border border-[#B45309]/5">

                    {/* Section 1: Identity */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-5 mb-4">
                            <div className="w-12 h-12 bg-[#FAF7F2] rounded-2xl flex items-center justify-center text-[#B45309] border border-[#B45309]/10">
                                <Users className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-black tracking-tight">Who are you?</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a1a1a]/40 ml-1">Full Name</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Samuel Adeniran"
                                    className="w-full px-6 py-5 bg-[#FAF7F2] border border-transparent rounded-[1.5rem] focus:ring-2 focus:ring-[#B45309] focus:bg-white outline-none transition-all placeholder:text-[#1a1a1a]/20"
                                    value={formData.fullName}
                                    onChange={e => setFormData(p => ({ ...p, fullName: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a1a1a]/40 ml-1">WhatsApp Number</label>
                                <input
                                    required
                                    type="tel"
                                    placeholder="081..."
                                    className="w-full px-6 py-5 bg-[#FAF7F2] border border-transparent rounded-[1.5rem] focus:ring-2 focus:ring-[#B45309] focus:bg-white outline-none transition-all font-mono placeholder:text-[#1a1a1a]/20"
                                    value={formData.whatsappNumber}
                                    onChange={e => setFormData(p => ({ ...p, whatsappNumber: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a1a1a]/40 ml-1">Email (Optional)</label>
                            <input
                                type="email"
                                placeholder="hello@example.com"
                                className="w-full px-6 py-5 bg-[#FAF7F2] border border-transparent rounded-[1.5rem] focus:ring-2 focus:ring-[#B45309] focus:bg-white outline-none transition-all placeholder:text-[#1a1a1a]/20"
                                value={formData.email}
                                onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                            />
                        </div>
                    </div>

                    {/* Section 2: Location */}
                    <div className="space-y-8 pt-10 border-t border-[#FAF7F2]">
                        <div className="flex items-center gap-5 mb-4">
                            <div className="w-12 h-12 bg-[#FAF7F2] rounded-2xl flex items-center justify-center text-[#B45309] border border-[#B45309]/10">
                                <Globe2 className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-black tracking-tight">Expansion Location</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a1a1a]/40 ml-1">City / Town</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Ogbomoso"
                                    className="w-full px-6 py-5 bg-[#FAF7F2] border border-transparent rounded-[1.5rem] focus:ring-2 focus:ring-[#B45309] focus:bg-white outline-none transition-all placeholder:text-[#1a1a1a]/20"
                                    value={formData.city}
                                    onChange={e => setFormData(p => ({ ...p, city: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a1a1a]/40 ml-1">State</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Oyo"
                                    className="w-full px-6 py-5 bg-[#FAF7F2] border border-transparent rounded-[1.5rem] focus:ring-2 focus:ring-[#B45309] focus:bg-white outline-none transition-all placeholder:text-[#1a1a1a]/20"
                                    value={formData.state}
                                    onChange={e => setFormData(p => ({ ...p, state: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Usage Plan */}
                    <div className="space-y-8 pt-10 border-t border-[#FAF7F2]">
                        <div className="flex items-center gap-5 mb-4">
                            <div className="w-12 h-12 bg-[#FAF7F2] rounded-2xl flex items-center justify-center text-[#B45309] border border-[#B45309]/10">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-black tracking-tight">How will you use the platform?</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {[
                                { id: 'buy', label: 'I want to buy products', icon: ArrowRight },
                                { id: 'sell', label: 'I want to sell products', icon: Building2 },
                                { id: 'audience', label: 'I have an audience / community', icon: Users },
                                { id: 'partner', label: 'I run a business that can partner', icon: Shield },
                                { id: 'interested', label: "I'm just interested / exploring", icon: Globe2 },
                            ].map((option) => (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => handleUsageToggle(option.id as UsageOption)}
                                    className={`flex items-center justify-between p-6 rounded-[1.5rem] border-2 transition-all text-left ${formData.usagePlan.includes(option.id as UsageOption)
                                        ? "border-[#B45309] bg-[#FAF7F2] text-[#B45309]"
                                        : "border-transparent bg-[#FAF7F2] text-[#4a4a4a] hover:border-[#B45309]/20"
                                        }`}
                                >
                                    <div className="flex items-center gap-5">
                                        <option.icon className={`w-6 h-6 ${formData.usagePlan.includes(option.id as UsageOption) ? 'text-[#B45309]' : 'text-[#1a1a1a]/20'}`} />
                                        <span className="font-bold text-lg">{option.label}</span>
                                    </div>
                                    <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${formData.usagePlan.includes(option.id as UsageOption)
                                        ? "bg-[#B45309] border-[#B45309]"
                                        : "bg-white border-[#FAF7F2]"
                                        }`}>
                                        {formData.usagePlan.includes(option.id as UsageOption) && <CheckCircle2 className="w-4 h-4 text-white" />}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Section 4: Business Details (Conditional) */}
                    {isBusinessUser && (
                        <div className="space-y-8 pt-10 border-t border-[#FAF7F2] animate-fade-in">
                            <div className="flex items-center gap-5 mb-4">
                                <div className="w-12 h-12 bg-[#FAF7F2] rounded-2xl flex items-center justify-center text-[#B45309] border border-[#B45309]/10">
                                    <Building2 className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-black tracking-tight">Business Profile</h3>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a1a1a]/40 ml-1">Business Name</label>
                                    <input
                                        type="text"
                                        className="w-full px-6 py-5 bg-[#FAF7F2] border border-transparent rounded-[1.5rem] focus:ring-2 focus:ring-[#B45309] focus:bg-white outline-none transition-all placeholder:text-[#1a1a1a]/20"
                                        value={formData.businessName}
                                        onChange={e => setFormData(p => ({ ...p, businessName: e.target.value }))}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a1a1a]/40 ml-1">Business Type</label>
                                        <div className="relative">
                                            <select
                                                className="w-full px-6 py-5 bg-[#FAF7F2] border border-transparent rounded-[1.5rem] focus:ring-2 focus:ring-[#B45309] focus:bg-white outline-none transition-all appearance-none text-[#1a1a1a]"
                                                value={formData.businessType}
                                                onChange={e => setFormData(p => ({ ...p, businessType: e.target.value }))}
                                            >
                                                <option value="">Select Type</option>
                                                <option value="fashion">Fashion & Lifestyle</option>
                                                <option value="food">Food & Drinks</option>
                                                <option value="electronics">Electronics & Gadgets</option>
                                                <option value="services">Professional Services</option>
                                                <option value="others">Other Ventures</option>
                                            </select>
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                                                <ArrowRight className="w-4 h-4 rotate-90" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a1a1a]/40 ml-1">Current Operating City</label>
                                        <input
                                            type="text"
                                            className="w-full px-6 py-5 bg-[#FAF7F2] border border-transparent rounded-[1.5rem] focus:ring-2 focus:ring-[#B45309] focus:bg-white outline-none transition-all placeholder:text-[#1a1a1a]/20"
                                            value={formData.currentOperatingCity}
                                            onChange={e => setFormData(p => ({ ...p, currentOperatingCity: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Section 5: Audience Power */}
                    <div className="space-y-8 pt-10 border-t border-[#FAF7F2]">
                        <div className="flex items-center gap-5 mb-4">
                            <div className="w-12 h-12 bg-[#FAF7F2] rounded-2xl flex items-center justify-center text-[#B45309] border border-[#B45309]/10">
                                <Users className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-black tracking-tight">Audience Power</h3>
                        </div>

                        <div className="space-y-6">
                            <label className="flex items-center gap-5 cursor-pointer p-6 bg-[#FAF7F2] rounded-[1.5rem] border border-transparent hover:border-[#B45309]/20 transition-all">
                                <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${formData.hasAudience ? 'bg-[#B45309] border-[#B45309]' : 'bg-white border-[#B45309]/10'}`}>
                                    {formData.hasAudience && <CheckCircle2 className="w-4 h-4 text-white" />}
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={formData.hasAudience}
                                        onChange={e => setFormData(p => ({ ...p, hasAudience: e.target.checked }))}
                                    />
                                </div>
                                <span className="font-bold text-lg text-[#1a1a1a]">Do you have an online or offline audience?</span>
                            </label>

                            {formData.hasAudience && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-scale-in">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a1a1a]/40 ml-1">Platform</label>
                                        <div className="relative">
                                            <select
                                                className="w-full px-6 py-5 bg-[#FAF7F2] border border-transparent rounded-[1.5rem] focus:ring-2 focus:ring-[#B45309] focus:bg-white outline-none transition-all appearance-none"
                                                value={formData.audiencePlatform}
                                                onChange={e => setFormData(p => ({ ...p, audiencePlatform: e.target.value }))}
                                            >
                                                <option value="">Select Platform</option>
                                                <option value="Instagram">Instagram / TikTok</option>
                                                <option value="WhatsApp">WhatsApp Community</option>
                                                <option value="Campus">Campus Influence</option>
                                                <option value="Church">Church / Organization</option>
                                                <option value="others">Others</option>
                                            </select>
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                                                <ArrowRight className="w-4 h-4 rotate-90" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a1a1a]/40 ml-1">Estimated Size</label>
                                        <div className="relative">
                                            <select
                                                className="w-full px-6 py-5 bg-[#FAF7F2] border border-transparent rounded-[1.5rem] focus:ring-2 focus:ring-[#B45309] focus:bg-white outline-none transition-all appearance-none"
                                                value={formData.audienceSize}
                                                onChange={e => setFormData(p => ({ ...p, audienceSize: e.target.value }))}
                                            >
                                                <option value="small">Under 100</option>
                                                <option value="medium">100 - 1,000</option>
                                                <option value="large">1,000 - 5,000</option>
                                                <option value="massive">5,000+</option>
                                            </select>
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                                                <ArrowRight className="w-4 h-4 rotate-90" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section 6: Serious Level */}
                    <div className="space-y-8 pt-10 border-t border-[#FAF7F2]">
                        <div className="flex items-center gap-5 mb-4">
                            <div className="w-12 h-12 bg-[#FAF7F2] rounded-2xl flex items-center justify-center text-[#B45309] border border-[#B45309]/10">
                                <MessageSquare className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-black tracking-tight">How serious are you?</h3>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { id: 'definitely', label: 'Definitely' },
                                { id: 'very_likely', label: 'Very likely' },
                                { id: 'maybe', label: 'Maybe' },
                                { id: 'curious', label: 'Just curious' },
                            ].map((option) => (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => setFormData(p => ({ ...p, intentStrength: option.id as IntentStrength }))}
                                    className={`p-6 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all border-2 ${formData.intentStrength === option.id
                                        ? "border-[#B45309] bg-[#FAF7F2] text-[#B45309]"
                                        : "border-transparent bg-[#FAF7F2] text-[#1a1a1a]/40 hover:border-[#B45309]/10"
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Section 7: Final Step */}
                    <div className="space-y-6 pt-10 border-t border-[#FAF7F2]">
                        <label className="flex items-center gap-5 cursor-pointer p-6 bg-[#FAF7F2] rounded-[1.5rem] border border-transparent hover:border-[#B45309]/20 transition-all">
                            <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${formData.wantsEarlyAccess ? 'bg-[#14532D] border-[#14532D]' : 'bg-white border-[#B45309]/10'}`}>
                                {formData.wantsEarlyAccess && <CheckCircle2 className="w-4 h-4 text-white" />}
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={formData.wantsEarlyAccess}
                                    onChange={e => setFormData(p => ({ ...p, wantsEarlyAccess: e.target.checked }))}
                                />
                            </div>
                            <span className="font-bold text-lg text-[#1a1a1a]">I want early access when Lautech Market launches in my area</span>
                        </label>
                        <label className="flex items-center gap-5 cursor-pointer p-6 bg-[#FAF7F2] rounded-[1.5rem] border border-transparent hover:border-[#B45309]/20 transition-all">
                            <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${formData.openToHelping ? 'bg-[#14532D] border-[#14532D]' : 'bg-white border-[#B45309]/10'}`}>
                                {formData.openToHelping && <CheckCircle2 className="w-4 h-4 text-white" />}
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={formData.openToHelping}
                                    onChange={e => setFormData(p => ({ ...p, openToHelping: e.target.checked }))}
                                />
                            </div>
                            <span className="font-bold text-lg text-[#1a1a1a]">I’m open to helping with launch or awareness (Optional)</span>
                        </label>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-7 bg-[#B45309] text-white rounded-[2.5rem] font-black text-xl tracking-tight hover:bg-[#92400e] transition-all flex items-center justify-center gap-4 shadow-[0_24px_48px_-12px_rgba(180,83,9,0.3)] disabled:opacity-70 active:scale-[0.98] group"
                    >
                        {isSubmitting ? (
                            <div className="w-7 h-7 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>Join Expansion Circle</span>
                                <Send className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </>
                        )}
                    </button>

                    <div className="text-center pt-8 border-t border-[#FAF7F2]">
                        <p className="text-[10px] text-[#1a1a1a]/20 font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3">
                            <span>Powered by</span>
                            <span className="text-[#B45309]">OJA Expansion</span>
                            <span className="opacity-40">•</span>
                            <span>Created by the Lautech market developer</span>
                        </p>
                    </div>

                </form>
            </div>

            {/* Footer Branding */}
            <div className="max-w-2xl mx-auto px-6 pb-32 text-center opacity-30">
                <div className="flex items-center justify-center gap-4 mb-10">
                    <div className="w-16 h-[1px] bg-[#B45309]/20" />
                    <Sparkles className="w-6 h-6 text-[#B45309]" />
                    <div className="w-16 h-[1px] bg-[#B45309]/20" />
                </div>
                <p className="text-lg font-bold leading-relaxed max-w-lg mx-auto">
                    Lautech Market is expanding. We're bridging the gap between student demand and premium supply.
                    Be the first to know when we arrive.
                </p>
            </div>
        </div>
    );
}
