"use client";

import TimecodeDisplay from "./TimecodeDisplay";

export default function VideoPlayer({
  videoRef,
  videoSrc,
  currentTime,
  onTimeUpdate,
  theme = "dark",
}) {
  return (
    <div
      className={`flex flex-col backdrop-blur-xl border rounded-2xl p-4 shadow-xl flex-1 min-h-0 gap-3 transition-colors duration-200 ${
        theme === "dark"
          ? "bg-neutral-900/30 border-white/10"
          : "bg-neutral-200/80 border-neutral-300 shadow-neutral-300/40"
      }`}
    >
      <div className="flex justify-between items-center">
        <span
          className={`text-[11px] font-mono tracking-wider uppercase ${
            theme === "dark" ? "text-neutral-400" : "text-neutral-600"
          }`}
        >
          Monitor de Escena
        </span>
        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
            theme === "dark"
              ? "text-neutral-500 bg-neutral-900/80 border-white/5"
              : "text-neutral-600 bg-neutral-300/60 border-neutral-400/30"
          }`}
        >
          SMPTE Timecode
        </span>
      </div>

      {/* Pantalla del reproductor */}
      <div className="flex-1 flex items-center justify-center bg-black/80 border border-neutral-800/80 rounded-xl overflow-hidden relative shadow-inner min-h-[220px]">
        {videoSrc ? (
          <video
            ref={videoRef}
            src={videoSrc}
            controls
            onTimeUpdate={onTimeUpdate}
            className="w-full h-full max-h-[340px] object-contain"
          />
        ) : (
          <div className="text-center p-6">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-neutral-800/60 border border-neutral-700/50 flex items-center justify-center text-neutral-500">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-xs text-neutral-400 font-medium">
              Sube una escena para empezar
            </p>
          </div>
        )}
      </div>

      {/* Reloj Digital SMPTE Grande estilo Pro Tools */}
      <TimecodeDisplay currentTime={currentTime} fps={24} />
    </div>
  );
}
