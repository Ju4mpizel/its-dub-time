"use client";

import { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";

export default function Timeline({
  data,
  currentTime,
  activeId,
  onSelectDialogue,
  onSeek,
  theme = "dark",
}) {
  const duration = data?.duration || 60;
  const trackRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const charactersList = data?.characters ? Object.values(data.characters) : [];

  const calculateTimeFromEvent = useCallback(
    (e) => {
      if (!trackRef.current || duration <= 0) return 0;
      const rect = trackRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, clickX / rect.width));
      return ratio * duration;
    },
    [duration],
  );

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);

    const newTime = calculateTimeFromEvent(e);
    if (onSeek) onSeek(newTime);

    const handleMouseMove = (moveEvent) => {
      moveEvent.preventDefault();
      const scrubTime = calculateTimeFromEvent(moveEvent);
      if (onSeek) onSeek(scrubTime);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const playheadPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`backdrop-blur-xl border rounded-2xl p-4 shadow-2xl select-none flex flex-col gap-2 transition-colors duration-200 ${
        theme === "dark"
          ? "bg-neutral-900/40 border-white/10 text-neutral-400"
          : "bg-neutral-200/80 border-neutral-300 shadow-neutral-300/40 text-neutral-600"
      }`}
    >
      {/* Barra de control superior de la línea de tiempo */}
      <div className="flex justify-between items-center text-xs font-mono">
        <div className="flex items-center gap-3">
          <span
            className={`uppercase text-[11px] tracking-wider font-bold ${
              theme === "dark" ? "text-neutral-300" : "text-neutral-800"
            }`}
          >
            Pista NLE
          </span>

          {/* Botón de Expansión / Compresión Multipista */}
          {charactersList.length > 1 && (
            <button
              onClick={() => setIsExpanded((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-sans font-medium transition-all ${
                isExpanded
                  ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                  : theme === "dark"
                    ? "bg-neutral-800/60 border-white/10 text-neutral-300 hover:border-white/20"
                    : "bg-neutral-100 border-neutral-300 text-neutral-700 hover:bg-neutral-200"
              }`}
              title="Separar cada personaje en su propia pista"
            >
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-300 ${
                  isExpanded ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 8h16M4 16h16"
                />
              </svg>
              <span>
                {isExpanded ? "Pista Unificada" : "Expandir por Personaje"}
              </span>
            </button>
          )}

          <span className="text-[10px] text-neutral-500 hidden sm:inline font-sans">
            (Arrastra el cabezal para desplazarte)
          </span>
        </div>

        <span>Duración: {duration.toFixed(1)}s</span>
      </div>

      {/* Área interactiva global (Regla + Pistas) */}
      <div
        ref={trackRef}
        onMouseDown={handleMouseDown}
        className={`relative ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
      >
        {/* Regla de tiempos */}
        <div
          className={`relative h-6 mb-1 border-b text-[9px] font-mono flex items-end pb-1 ml-0 sm:ml-28 transition-all ${
            theme === "dark"
              ? "border-white/10 text-neutral-400 hover:bg-white/[0.02]"
              : "border-neutral-300 text-neutral-600 hover:bg-black/[0.02]"
          }`}
        >
          {[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].map((p) => (
            <div
              key={p}
              className="absolute bottom-0 flex flex-col items-center pointer-events-none transform -translate-x-1/2"
              style={{ left: `${p * 100}%` }}
            >
              <span className="text-[8px] text-neutral-500 mb-0.5">
                {(p * duration).toFixed(0)}s
              </span>
              <div
                className={`w-[1px] ${
                  theme === "dark"
                    ? p % 0.2 === 0
                      ? "h-2 bg-white/40"
                      : "h-1 bg-white/20"
                    : p % 0.2 === 0
                      ? "h-2 bg-neutral-600"
                      : "h-1 bg-neutral-400"
                }`}
              />
            </div>
          ))}
        </div>

        {/* Contenedor animado de pistas */}
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`relative border rounded-xl overflow-hidden shadow-inner backdrop-blur-md max-h-72 overflow-y-auto ${
            theme === "dark"
              ? "bg-neutral-950/70 border-white/10"
              : "bg-neutral-900 border-neutral-300"
          }`}
        >
          {/* MODO 1: PISTA UNIFICADA */}
          {!isExpanded && (
            <motion.div layout className="relative h-24 w-full">
              {data?.dialogues?.map((d) => {
                const char = data.characters[d.speaker];
                const leftPct = (d.start / duration) * 100;
                const widthPct = Math.max(
                  ((d.end - d.start) / duration) * 100,
                  1.2,
                );
                const isSelected = activeId === d.id;

                return (
                  <motion.div
                    layoutId={`block-${d.id}`}
                    key={d.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDialogue(d);
                    }}
                    style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                    className={`absolute top-3 bottom-3 rounded-xl cursor-pointer flex flex-col justify-center px-2.5 overflow-hidden border ${
                      char?.bg || "bg-neutral-600"
                    } ${
                      isSelected
                        ? "ring-2 ring-white border-white brightness-125 z-10 shadow-2xl scale-y-105"
                        : "opacity-85 hover:opacity-100 border-white/20"
                    }`}
                  >
                    <span className="text-[11px] font-extrabold text-black truncate leading-tight tracking-tight">
                      {char?.name || "Personaje"}
                    </span>
                    <span className="text-[9px] text-black/80 font-mono truncate leading-tight">
                      {d.start.toFixed(1)}s - {d.end.toFixed(1)}s
                    </span>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* MODO 2: MULTI-PISTA EXPANDIDA */}
          {isExpanded && (
            <motion.div
              layout
              className="flex flex-col divide-y divide-white/5"
            >
              {charactersList.map((char) => {
                const charDialogues =
                  data?.dialogues?.filter((d) => d.speaker === char.id) || [];

                return (
                  <div
                    key={char.id}
                    className="flex h-16 relative group/row hover:bg-white/[0.01] transition-colors"
                  >
                    {/* Encabezado lateral del personaje */}
                    <div className="w-28 shrink-0 flex items-center gap-2 px-3 border-r border-white/10 bg-neutral-900/80 backdrop-blur-md z-10">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${char.bg} shadow-sm shrink-0`}
                      />
                      <span
                        className="text-[11px] font-bold text-neutral-200 truncate"
                        title={char.name}
                      >
                        {char.name}
                      </span>
                    </div>

                    {/* Carril horizontal exclusivo del personaje */}
                    <div className="relative flex-1 h-full">
                      {charDialogues.map((d) => {
                        const leftPct = (d.start / duration) * 100;
                        const widthPct = Math.max(
                          ((d.end - d.start) / duration) * 100,
                          1.2,
                        );
                        const isSelected = activeId === d.id;

                        return (
                          <motion.div
                            layoutId={`block-${d.id}`}
                            key={d.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectDialogue(d);
                            }}
                            style={{
                              left: `${leftPct}%`,
                              width: `${widthPct}%`,
                            }}
                            className={`absolute top-2 bottom-2 rounded-lg cursor-pointer flex flex-col justify-center px-2 overflow-hidden border ${
                              char.bg
                            } ${
                              isSelected
                                ? "ring-2 ring-white border-white brightness-125 z-10 shadow-xl"
                                : "opacity-85 hover:opacity-100 border-white/20"
                            }`}
                          >
                            <span className="text-[10px] font-extrabold text-black truncate leading-tight">
                              {d.text}
                            </span>
                            <span className="text-[8px] text-black/80 font-mono truncate leading-tight">
                              {d.start.toFixed(1)}s - {d.end.toFixed(1)}s
                            </span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* Cabezal de reproducción (Playhead) */}
          {data?.duration > 0 && (
            <div
              className={`absolute top-0 bottom-0 pointer-events-none z-30 flex flex-col items-center ${
                isExpanded ? "left-[calc(7rem+var(--pct))]" : ""
              }`}
              style={{
                left: isExpanded
                  ? `calc(7rem + ${playheadPercent * 0.01} * (100% - 7rem))`
                  : `${playheadPercent}%`,
                transform: "translateX(-50%)",
              }}
            >
              <div
                className={`transition-transform duration-75 flex flex-col items-center ${
                  isDragging ? "scale-125 -translate-y-1" : "hover:scale-110"
                }`}
              >
                <div className="w-3.5 h-3.5 bg-red-500 rounded-t-sm shadow-md border border-red-300 flex items-center justify-center">
                  <div className="w-1.5 h-0.5 bg-white/80 rounded-full" />
                </div>
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-red-500" />
              </div>

              <div className="w-[2px] flex-1 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]" />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
