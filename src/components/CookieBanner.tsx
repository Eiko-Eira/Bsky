import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('cookiesAccepted');
    if (!accepted) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookiesAccepted', 'true');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4"
        >
          <div className="max-w-4xl mx-auto border-2 border-black bg-white p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="font-mono text-sm text-gray-800">
              <strong>We value your privacy.</strong> We use cookies to enhance your browsing experience, serve secure login sessions, and analyze our traffic. By clicking "Accept", you consent to our use of cookies.
            </p>
            <button 
              onClick={handleAccept}
              className="bg-black text-white px-6 py-3 font-bold uppercase tracking-widest text-sm whitespace-nowrap hover:bg-gray-800 transition-colors"
            >
              Accept
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
