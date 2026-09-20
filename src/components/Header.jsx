"use client";

import { useRef } from "react";

export default function Header({
  loading,
  videoSrc,
  onFileUpload,
  theme,
  onToggleTheme,
}) {
  const fileInputRef = useRef(null);

  return (
    <header
      className={`flex justify-between items-center px-6 py-3 rounded-2xl border transition-colors duration-200 shadow-lg ${
        theme === "dark"
          ? "bg-neutral-900/40 backdrop-blur-xl border-white/10"
          : "bg-neutral-200/80 backdrop-blur-xl border-neutral-300 shadow-neutral-300/40"
      }`}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 animate-pulse" />
          <span
            className={`font-black text-sm tracking-wider uppercase ${
              theme === "dark" ? "text-neutral-100" : "text-neutral-800"
            }`}
          >
            ItsDubTime
          </span>
        </div>

        <span
          className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border ${
            theme === "dark"
              ? "text-neutral-400 border-neutral-800 bg-neutral-800/40"
              : "text-neutral-600 border-neutral-300 bg-neutral-300/50"
          }`}
        >
          Máx. 4.5 MB
        </span>

        {loading && (
          <div className="flex items-center gap-2 text-xs text-cyan-500 font-mono animate-pulse">
            <svg
              className="animate-spin h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Analizando escena...
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onToggleTheme}
          className={`p-2 rounded-xl border text-sm transition-all ${
            theme === "dark"
              ? "bg-neutral-800/60 border-white/10 text-amber-300 hover:bg-neutral-800"
              : "bg-neutral-300/70 border-neutral-400/40 text-neutral-800 hover:bg-neutral-300"
          }`}
          title={
            theme === "dark" ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"
          }
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileUpload}
          accept="video/mp4,video/webm,video/quicktime,audio/mp3,audio/wav,audio/m4a"
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="relative group overflow-hidden px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 border border-white/20 shadow-md transition-all active:scale-95 disabled:opacity-50"
        >
          {videoSrc ? "Cambiar Video" : "Subir Escena (.mp4)"}
        </button>
      </div>
    </header>
  );
}
