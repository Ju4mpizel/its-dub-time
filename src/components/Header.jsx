"use client";

import { useRef } from "react";

export default function Header({
  loading,
  videoSrc,
  onFileUpload,
  theme,
  onToggleTheme,
  showRecordingStudio,
  onToggleRecordingStudio,
}) {
  const fileInputRef = useRef(null);

  return (
    <header
      className={`flex justify-between items-center px-5 py-2.5 rounded-2xl border transition-colors duration-200 shadow-xl ${
        theme === "dark"
          ? "bg-neutral-900/60 backdrop-blur-xl border-white/10"
          : "bg-white/80 backdrop-blur-xl border-neutral-300 shadow-neutral-300/40"
      }`}
    >
      {/* 1. Lado Izquierdo: Branding & Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.2"
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z"
              />
            </svg>
          </div>
          <div className="flex flex-col">
            <span
              className={`font-black text-sm tracking-wider uppercase leading-none ${
                theme === "dark" ? "text-neutral-100" : "text-neutral-900"
              }`}
            >
              ItsDubTime
            </span>
            <span className="text-[10px] font-mono text-cyan-400 font-medium tracking-tight">
              ADR Studio NLE
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-white/10">
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
              theme === "dark"
                ? "text-neutral-400 border-neutral-800 bg-neutral-950/50"
                : "text-neutral-600 border-neutral-300 bg-neutral-100"
            }`}
          >
            Vercel Safe: 4.5 MB
          </span>

          {loading && (
            <div className="flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[11px] text-cyan-400 font-mono animate-pulse">
              <svg
                className="animate-spin h-3 w-3"
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
              <span>Diarizando personajes...</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Centro / Acciones Principales */}
      <div className="flex items-center gap-2.5">
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileUpload}
          accept="video/mp4,video/webm,video/quicktime,audio/mp3,audio/wav,audio/m4a"
          className="hidden"
        />

        {/* Botón de Importar Archivo */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all active:scale-95 disabled:opacity-50 ${
            videoSrc
              ? theme === "dark"
                ? "bg-neutral-800/80 hover:bg-neutral-700/80 border-white/10 text-neutral-200"
                : "bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-800"
              : "bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white border-cyan-400/30 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
          }`}
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
          <span>{videoSrc ? "Reemplazar Clip" : "Cargar Escena"}</span>
        </button>

        {/* Botón de Estudio de Grabación */}
        <button
          onClick={onToggleRecordingStudio}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${
            showRecordingStudio
              ? "bg-rose-500/20 border-rose-500 text-rose-300 shadow-[0_0_18px_rgba(244,63,94,0.35)] ring-1 ring-rose-500/50"
              : theme === "dark"
                ? "bg-neutral-800/50 hover:bg-neutral-800 border-white/10 text-neutral-300 hover:border-white/20"
                : "bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-700"
          }`}
        >
          <span className="relative flex h-2 w-2">
            {showRecordingStudio && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                showRecordingStudio ? "bg-rose-500" : "bg-neutral-500"
              }`}
            />
          </span>
          <span>Estudio ADR</span>
        </button>
      </div>

      {/* 3. Lado Derecho: Utilidades */}
      <div className="flex items-center gap-2 pl-2">
        <button
          onClick={onToggleTheme}
          className={`p-2 rounded-xl border transition-all active:scale-90 ${
            theme === "dark"
              ? "bg-neutral-800/60 border-white/10 text-neutral-300 hover:text-white hover:bg-neutral-800"
              : "bg-neutral-100 border-neutral-300 text-neutral-700 hover:bg-neutral-200"
          }`}
          title={
            theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
          }
        >
          {theme === "dark" ? (
            /* Icono de Sol */
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
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          ) : (
            /* Icono de Luna */
            <svg
              className="w-4 h-4 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
