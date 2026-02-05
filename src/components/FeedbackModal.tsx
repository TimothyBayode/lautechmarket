/**
 * Feedback Modal Component
 * Collects student feedback about vendor interactions
 */

import React, { useState } from 'react';
import { X, Clock, ThumbsUp, ShoppingBag } from 'lucide-react';
import { submitContactFeedback } from '../services/vendorContacts';
import { ContactFeedback } from '../types';

interface FeedbackModalProps {
    contact: {
        id: string;
        vendorId: string;
        vendorName?: string;
        contactedAt: Date;
    };
    onClose: () => void;
    onSubmit: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ contact, onClose, onSubmit }) => {
    const [responseTime, setResponseTime] = useState<string>('');
    const [wasHelpful, setWasHelpful] = useState<boolean | null>(null);
    const [purchaseMade, setPurchaseMade] = useState<boolean | null>(null);
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!responseTime || wasHelpful === null || purchaseMade === null) {
            alert('Please answer all questions');
            return;
        }

        setSubmitting(true);
        try {
            const feedback: ContactFeedback = {
                responseTime: responseTime as any,
                wasHelpful,
                purchaseMade,
                note
            };

            await submitContactFeedback(contact.id, feedback);
            onSubmit();
            onClose();
        } catch (error) {
            console.error('Error submitting feedback:', error);
            alert('Failed to submit feedback. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const responseOptions = [
        { value: 'under_30min', label: '⚡ Super fast (under 30 min)', color: 'emerald' },
        { value: '30min_2hr', label: '✅ Quick (30 min - 2 hrs)', color: 'green' },
        { value: '2hr_24hr', label: '🕐 Slow (2-24 hrs)', color: 'yellow' },
        { value: 'over_24hr', label: '😴 Very slow (over 24 hrs)', color: 'orange' },
        { value: 'no_response', label: '❌ No response', color: 'red' }
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Quick Feedback</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Vendor Info */}
                <div className="bg-emerald-50 rounded-lg p-4 mb-6">
                    <p className="text-sm text-gray-600">How was your experience with</p>
                    <p className="font-semibold text-gray-900">{contact.vendorName || 'this vendor'}?</p>
                    <p className="text-xs text-gray-500 mt-1">
                        Contacted {contact.contactedAt.toLocaleDateString()}
                    </p>
                </div>

                {/* Question 1: Response Time */}
                <div className="mb-6">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                        <Clock className="w-4 h-4" />
                        How quickly did they respond?
                    </label>
                    <div className="space-y-2">
                        {responseOptions.map(option => (
                            <button
                                key={option.value}
                                onClick={() => setResponseTime(option.value)}
                                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${responseTime === option.value
                                        ? `border-${option.color}-500 bg-${option.color}-50`
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <span className="text-sm">{option.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Question 2: Helpful */}
                <div className="mb-6">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                        <ThumbsUp className="w-4 h-4" />
                        Was the vendor helpful?
                    </label>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setWasHelpful(true)}
                            className={`flex-1 py-3 rounded-lg border-2 transition-all ${wasHelpful === true
                                    ? 'border-emerald-500 bg-emerald-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <span className="text-sm font-medium">👍 Yes</span>
                        </button>
                        <button
                            onClick={() => setWasHelpful(false)}
                            className={`flex-1 py-3 rounded-lg border-2 transition-all ${wasHelpful === false
                                    ? 'border-red-500 bg-red-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <span className="text-sm font-medium">👎 No</span>
                        </button>
                    </div>
                </div>

                {/* Question 3: Purchase */}
                <div className="mb-6">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                        <ShoppingBag className="w-4 h-4" />
                        Did you make a purchase?
                    </label>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setPurchaseMade(true)}
                            className={`flex-1 py-3 rounded-lg border-2 transition-all ${purchaseMade === true
                                    ? 'border-emerald-500 bg-emerald-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <span className="text-sm font-medium">✅ Yes</span>
                        </button>
                        <button
                            onClick={() => setPurchaseMade(false)}
                            className={`flex-1 py-3 rounded-lg border-2 transition-all ${purchaseMade === false
                                    ? 'border-gray-500 bg-gray-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <span className="text-sm font-medium">❌ No</span>
                        </button>
                    </div>
                </div>

                {/* Optional Note */}
                <div className="mb-6">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Anything else? (Optional)
                    </label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Any additional feedback..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                        rows={3}
                    />
                </div>

                {/* Submit Button */}
                <button
                    onClick={handleSubmit}
                    disabled={submitting || !responseTime || wasHelpful === null || purchaseMade === null}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
                >
                    {submitting ? 'Submitting...' : 'Submit Feedback'}
                </button>

                <p className="text-xs text-gray-500 text-center mt-4">
                    Your feedback helps other students make better decisions 🙏
                </p>
            </div>
        </div>
    );
};
