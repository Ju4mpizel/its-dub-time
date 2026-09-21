"use client";

import { motion, AnimatePresence } from "framer-motion";

export default function Toast({ toast, onClose }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl text-xs font-medium max-w-sm ${
            toast.type === "error"
              ? "bg-rose-500/10 border-rose-500/30 text-rose-300 shadow-rose-950/40"
              : toast.type === "warning"
                ? "bg-amber-500/10 border-amber-500/30 text-amber-300 shadow-amber-950/40"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-emerald-950/40"
          }`}
        >
          {/* Iconografía SVG en reemplazo de emojis */}
          <span className="shrink-0">
            {toast.type === "error" ? (
              <svg
                className="w-4 h-4 text-rose-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : toast.type === "warning" ? (
              <svg
                className="w-4 h-4 text-amber-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4 text-emerald-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </span>

          <p className="flex-1 leading-snug">{toast.message}</p>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors p-1"
          >
            ✕
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
