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
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-xl text-xs font-medium max-w-sm ${
            toast.type === "error"
              ? "bg-rose-500/10 border-rose-500/30 text-rose-300 shadow-rose-950/40"
              : toast.type === "warning"
                ? "bg-amber-500/10 border-amber-500/30 text-amber-300 shadow-amber-950/40"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-emerald-950/40"
          }`}
        >
          <span className="text-base">
            {toast.type === "error"
              ? "⚠️"
              : toast.type === "warning"
                ? "⏳"
                : "✅"}
          </span>
          <p className="flex-1 leading-snug">{toast.message}</p>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
