import React, { useState } from 'react';
import { MessageCircle, X, Bot } from 'lucide-react';

const BOTPRESS_CHAT_URL = import.meta.env.VITE_BOTPRESS_CHAT_URL;

export function ChatbotButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-all duration-300 flex items-center justify-center z-40 hover:scale-110 group"
        aria-label="Open chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed bottom-5 right-6 w-80 sm:w-96 h-[500px] bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-scale-in flex flex-col">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-500 p-2 rounded-full">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">LAUTECH Market Help Bot</h3>
                <p className="text-emerald-100 text-sm">AI Powered Real-time assistance</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-emerald-100 hover:text-white transition-colors p-1"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            <iframe
              src={BOTPRESS_CHAT_URL}
              className="w-full h-full border-0"
              title="LAUTECH Market AI Assistant"
              allow="microphone"
              loading="lazy"
            />
          </div>
        </div>
      )}
    </>
  );
}