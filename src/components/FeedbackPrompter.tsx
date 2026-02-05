import React, { useEffect, useState } from 'react';
import { getStudentId } from '../utils/studentId';
import { getPendingFeedback } from '../services/vendorContacts';
import { FeedbackModal } from './FeedbackModal';
import { VendorContact } from '../types';

export const FeedbackPrompter: React.FC = () => {
    const [pendingContacts, setPendingContacts] = useState<VendorContact[]>([]);
    const [currentContact, setCurrentContact] = useState<VendorContact | null>(null);

    // Check for pending feedback on mount and every hour
    useEffect(() => {
        const checkFeedback = async () => {
            try {
                const studentId = getStudentId();
                if (!studentId) return;

                console.log('Checking for feedback for student:', studentId);
                const contacts = await getPendingFeedback(studentId);

                if (contacts.length > 0) {
                    console.log('Pending feedback found:', contacts.length);
                    setPendingContacts(contacts);
                    // Show the first one
                    setCurrentContact(contacts[0]);
                }
            } catch (error) {
                console.error('Error checking feedback:', error);
            }
        };

        checkFeedback();

        // Check every hour
        const interval = setInterval(checkFeedback, 60 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const handleFeedbackSubmit = () => {
        if (!currentContact) return;

        // Remove the completed contact from the list
        const remainingContacts = pendingContacts.filter(c => c.id !== currentContact.id);
        setPendingContacts(remainingContacts);

        // If there are more, show the next one after a short delay
        // Otherwise close
        setCurrentContact(null);

        if (remainingContacts.length > 0) {
            setTimeout(() => {
                setCurrentContact(remainingContacts[0]);
            }, 1000);
        }
    };

    const handleClose = () => {
        // If the user closes without submitting, close it for this session
        setCurrentContact(null);
        setPendingContacts([]);
    };

    if (!currentContact) return null;

    return (
        <FeedbackModal
            contact={currentContact}
            onClose={handleClose}
            onSubmit={handleFeedbackSubmit}
        />
    );
};
