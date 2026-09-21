"use client";

import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const smoothEase = [0.16, 1, 0.3, 1];

export default function Timeline({
  data,
  currentTime,
  activeId,
  onSelectDialogue,
  onSeek,
  theme = "dark",
  selectedCharacterId = null,
  takesByCharacter = {},
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
          ? "bg-neutral-900/60 border-white/10 text-neutral-400"
          : "bg-white/80 border-neutral-300 shadow-neutral-300/30 text-neutral-600"
      }`}
    >
      {/* Controles de cabecera */}
      <div className="flex justify-between items-center text-xs font-mono shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span
              className={`uppercase text-[11px] tracking-wider font-bold ${
                theme === "dark" ? "text-neutral-200" : "text-neutral-800"
              }`}
            >
              Línea de Tiempo NLE
            </span>
          </div>

          {charactersList.length > 1 && (
            <button
              onClick={() => setIsExpanded((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-sans font-medium transition-all duration-200 ${
                isExpanded
                  ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                  : theme === "dark"
                    ? "bg-neutral-800/60 border-white/10 text-neutral-300 hover:border-white/25"
                    : "bg-neutral-100 border-neutral-300 text-neutral-700 hover:bg-neutral-200"
              }`}
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
              <span>{isExpanded ? "Pista Unificada" : "Expandir Pistas"}</span>
            </button>
          )}

          <span className="text-[10px] text-neutral-500 hidden sm:inline font-sans">
            (Arrastra el cabezal para desplazarte)
          </span>
        </div>

        <span>Duración: {duration.toFixed(1)}s</span>
      </div>

      <div className="flex w-full">
        {/* Encabezado lateral animado en modo expandido */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "7.5rem", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: smoothEase }}
              className="shrink-0 flex flex-col justify-end overflow-hidden"
            >
              <div className="h-6 mb-1 border-b border-white/10" />
              <div className="flex flex-col divide-y divide-white/10 bg-neutral-950/80 border border-r-0 border-white/10 rounded-l-xl overflow-hidden backdrop-blur-md">
                {charactersList.map((char) => {
                  const isMyChar =
                    selectedCharacterId === null ||
                    char.id === selectedCharacterId;
                  return (
                    <div
                      key={char.id}
                      className={`h-16 flex items-center gap-2 px-3 select-none transition-opacity duration-200 ${
                        isMyChar ? "opacity-100" : "opacity-35"
                      }`}
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${char.bg} shadow-sm shrink-0`}
                      />
                      <span
                        className="text-[11px] font-mono font-bold text-neutral-200 truncate"
                        title={char.name}
                      >
                        {char.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Área interactiva de la pista */}
        <div
          ref={trackRef}
          onMouseDown={handleMouseDown}
          className={`relative flex-1 min-w-0 ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
        >
          {/* Regla temporal */}
          <div
            className={`relative h-6 mb-1 border-b text-[9px] font-mono flex items-end pb-1 transition-all ${
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
                    p % 0.2 === 0
                      ? "h-2.5 bg-neutral-400"
                      : "h-1 bg-neutral-600"
                  }`}
                />
              </div>
            ))}
          </div>

          {/* Contenedor de carriles con bordes redondeados orgánicos */}
          <motion.div
            layout="position"
            transition={{ duration: 0.35, ease: smoothEase }}
            className={`relative border overflow-hidden shadow-inner backdrop-blur-md max-h-72 overflow-y-auto ${
              isExpanded ? "rounded-r-xl border-l-0" : "rounded-xl"
            } ${
              theme === "dark"
                ? "bg-neutral-950/70 border-white/10"
                : "bg-neutral-900 border-neutral-300"
            }`}
          >
            <AnimatePresence mode="wait" initial={false}>
              {/* VISTA 1: PISTA UNIFICADA */}
              {!isExpanded ? (
                <motion.div
                  key="unified"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="relative h-24 w-full"
                >
                  {data?.dialogues?.map((d) => {
                    const char = data.characters[d.speaker];
                    const leftPct = (d.start / duration) * 100;
                    const widthPct = Math.max(
                      ((d.end - d.start) / duration) * 100,
                      1.2,
                    );
                    const isSelected = activeId === d.id;
                    const isMyCharacter =
                      selectedCharacterId === null ||
                      d.speaker === selectedCharacterId;

                    return (
                      <div
                        key={d.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDialogue(d);
                        }}
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                        }}
                        className={`absolute top-2.5 bottom-2.5 rounded-xl cursor-pointer flex flex-col justify-center px-2.5 overflow-hidden border transition-all duration-200 ${
                          isMyCharacter
                            ? `${char?.bg || "bg-neutral-600"} border-white/20`
                            : "bg-neutral-800/80 border-neutral-700/50 opacity-25 grayscale brightness-50"
                        } ${
                          isSelected
                            ? "ring-2 ring-white border-white brightness-125 z-10 shadow-2xl scale-y-105"
                            : isMyCharacter
                              ? "opacity-90 hover:opacity-100"
                              : ""
                        }`}
                      >
                        <span className="text-[11px] font-extrabold text-black truncate leading-tight tracking-tight font-sans">
                          {char?.name || "Personaje"}
                        </span>
                        <span className="text-[9px] text-black/80 font-mono truncate leading-tight">
                          {d.start.toFixed(1)}s - {d.end.toFixed(1)}s
                        </span>
                      </div>
                    );
                  })}
                </motion.div>
              ) : (
                /* VISTA 2: MULTI-PISTA EXPANDIDA */
                <motion.div
                  key="expanded"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col divide-y divide-white/5"
                >
                  {charactersList.map((char) => {
                    const charDialogues =
                      data?.dialogues?.filter((d) => d.speaker === char.id) ||
                      [];
                    const isMyCharacter =
                      selectedCharacterId === null ||
                      char.id === selectedCharacterId;

                    return (
                      <div
                        key={char.id}
                        className={`h-16 relative group/row transition-colors ${
                          isMyCharacter ? "hover:bg-white/[0.01]" : "opacity-35"
                        }`}
                      >
                        {charDialogues.map((d) => {
                          const leftPct = (d.start / duration) * 100;
                          const widthPct = Math.max(
                            ((d.end - d.start) / duration) * 100,
                            1.2,
                          );
                          const isSelected = activeId === d.id;

                          return (
                            <div
                              key={d.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectDialogue(d);
                              }}
                              style={{
                                left: `${leftPct}%`,
                                width: `${widthPct}%`,
                              }}
                              className={`absolute top-2 bottom-2 rounded-lg cursor-pointer flex flex-col justify-center px-2 overflow-hidden border transition-all duration-200 ${
                                isMyCharacter
                                  ? `${char.bg} border-white/20`
                                  : "bg-neutral-800 border-neutral-700 opacity-30 grayscale"
                              } ${
                                isSelected
                                  ? "ring-2 ring-white border-white brightness-125 z-10 shadow-xl"
                                  : "opacity-85 hover:opacity-100"
                              }`}
                            >
                              <span className="text-[10px] font-extrabold text-black truncate leading-tight font-sans">
                                {d.text}
                              </span>
                              <span className="text-[8px] text-black/80 font-mono truncate leading-tight">
                                {d.start.toFixed(1)}s - {d.end.toFixed(1)}s
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sub-carriles de voz grabada */}
            {Object.keys(takesByCharacter).map((speakerId) => {
              const char = data?.characters?.[speakerId];

              return (
                <div
                  key={speakerId}
                  className="h-6 w-full bg-emerald-950/40 border-t border-emerald-500/30 flex items-center px-3 gap-2"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${char?.bg || "bg-emerald-400"} shadow-sm`}
                  />
                  <span className="text-[10px] font-mono text-emerald-300 font-semibold truncate">
                    Toma ADR Activa: {char?.name || "Personaje"}
                  </span>
                </div>
              );
            })}

            {/* Cabezal de reproducción rojo */}
            {data?.duration > 0 && (
              <div
                className="absolute top-0 bottom-0 pointer-events-none z-30 flex flex-col items-center"
                style={{
                  left: `${playheadPercent}%`,
                  transform: "translateX(-50%)",
                }}
              >
                <div
                  className={`transition-transform duration-75 flex flex-col items-center ${
                    isDragging ? "scale-125 -translate-y-1" : "hover:scale-110"
                  }`}
                >
                  <div className="w-3 h-3 bg-red-500 rounded-t-sm shadow-md border border-red-300 flex items-center justify-center">
                    <div className="w-1.5 h-0.5 bg-white/80 rounded-full" />
                  </div>
                  <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-red-500" />
                </div>
                <div className="w-[1.5px] flex-1 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]" />
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
