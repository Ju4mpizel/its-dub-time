"use client";

export default function Header({
  loading,
  videoSrc,
  onFileUpload,
  theme,
  onToggleTheme,
  showRecordingStudio,
  onToggleRecordingStudio,
  // Nuevas props
  canUndo = false,
  onUndo,
  hasOriginalData = false,
  onResetToOriginal,
}) {
  return (
    <header
      className={`flex items-center justify-between px-4 py-3 rounded-2xl border backdrop-blur-xl transition-colors duration-200 ${
        theme === "dark"
          ? "bg-neutral-900/60 border-white/10"
          : "bg-white/80 border-neutral-300 shadow-sm"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
          <h1
            className={`font-mono text-sm font-bold tracking-wider uppercase ${
              theme === "dark" ? "text-neutral-100" : "text-neutral-900"
            }`}
          >
            ADR Studio Pro
          </h1>
        </div>

        {/* Acciones de Historial: Deshacer y Restaurar */}
        {hasOriginalData && (
          <div className="flex items-center gap-1.5 ml-2 pl-3 border-l border-white/10">
            {/* Botón Deshacer */}
            <button
              onClick={onUndo}
              disabled={!canUndo}
              title="Deshacer último cambio (Ctrl + Z)"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono border transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${
                canUndo
                  ? theme === "dark"
                    ? "bg-neutral-800/80 hover:bg-neutral-700/80 border-white/15 text-neutral-200"
                    : "bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-700"
                  : "border-transparent text-neutral-500"
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
                  d="M3 10h10a5 5 0 015 5v2m-15-7l4-4m-4 4l4 4"
                />
              </svg>
              <span className="hidden sm:inline">Deshacer</span>
            </button>

            {/* Botón Restaurar a Original */}
            <button
              onClick={onResetToOriginal}
              title="Restaurar guión y tiempos originales de la IA"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono border transition-all active:scale-95 ${
                theme === "dark"
                  ? "bg-rose-950/20 hover:bg-rose-900/30 border-rose-500/20 text-rose-300"
                  : "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700"
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span className="hidden md:inline">Restaurar Original</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Input de archivo */}
        <label
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-medium cursor-pointer border transition-all active:scale-95 ${
            loading ? "opacity-50 pointer-events-none" : ""
          } ${
            theme === "dark"
              ? "bg-neutral-800/80 hover:bg-neutral-700/80 border-white/10 text-neutral-200"
              : "bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-800"
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
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <span>
            {loading
              ? "Procesando..."
              : videoSrc
                ? "Cambiar Video"
                : "Subir Escena"}
          </span>
          <input
            type="file"
            accept="video/*,audio/*"
            onChange={onFileUpload}
            className="hidden"
          />
        </label>

        {/* Toggle Panel Estudio ADR */}
        <button
          onClick={onToggleRecordingStudio}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all active:scale-95 ${
            showRecordingStudio
              ? "bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]"
              : theme === "dark"
                ? "bg-neutral-800/80 hover:bg-neutral-700/80 border-white/10 text-neutral-300"
                : "bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-700"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span>{showRecordingStudio ? "Cerrar ADR" : "Estudio ADR"}</span>
        </button>

        {/* Toggle Tema Claro/Oscuro */}
        <button
          onClick={onToggleTheme}
          title="Cambiar tema"
          className={`p-2 rounded-xl border transition-all active:scale-95 ${
            theme === "dark"
              ? "bg-neutral-800/80 border-white/10 text-neutral-300 hover:text-white"
              : "bg-neutral-100 border-neutral-300 text-neutral-700 hover:text-black"
          }`}
        >
          {theme === "dark" ? (
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
                d="M12 3v1m0 16v1m9-9h-1M4 9h-1m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          ) : (
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
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
