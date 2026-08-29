'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

interface ConvertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConvertModal({ isOpen, onClose }: ConvertModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.button
          type="button"
          aria-label="Close conversion dialog"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        <motion.section
          role="dialog"
          aria-modal="true"
          aria-labelledby="convert-title"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-violet-300/20 bg-[#121022] shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-violet-300/10 p-6">
            <h2 id="convert-title" className="text-xl font-bold text-white">Convert</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close conversion dialog"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-[#C3BBD0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A995FF]"
            >
              <X size={22} aria-hidden="true" />
            </button>
          </div>
          <div className="space-y-4 p-6">
            <p className="text-sm leading-6 text-[#C3BBD0]">
              Conversion quotes are unavailable until the backend returns an authoritative rate.
            </p>
            <button
              type="button"
              disabled
              className="min-h-11 w-full rounded-xl border border-violet-300/15 bg-[#21152F] px-4 font-semibold text-[#8C8299] disabled:cursor-not-allowed"
            >
              Conversion unavailable
            </button>
          </div>
        </motion.section>
      </div>
    </AnimatePresence>
  );
}
