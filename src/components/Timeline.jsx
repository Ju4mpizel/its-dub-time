"use client";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

const smoothEase = [0.16, 1, 0.3, 1];
const SNAP_THRESHOLD_SECONDS = 0.25;

const ZOOM_LEVELS = [0.5, 1, 2, 3];

export default function Timeline({
  data,
  currentTime,
  activeId,
  onSelectDialogue,
  onSeek,
  theme = "dark",
  selectedCharacterId = null,
  takesByCharacter = {},
  onUpdateDialogueTimes,
  onAddDialogue,
  onDeleteDialogue,
}) {
  const duration = data?.duration || 60;
  const trackAreaRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const [zoomLevel, setZoomLevel] = useState(1);

  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [trimmingState, setTrimmingState] = useState(null);
  const [drawingState, setDrawingState] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const [isSnapEnabled, setIsSnapEnabled] = useState(true);
  const [isDrawModeEnabled, setIsDrawModeEnabled] = useState(false);

  const [snapLineTime, setSnapLineTime] = useState(null);

  const charactersList = data?.characters ? Object.values(data.characters) : [];

  const rulerTicks = useMemo(() => {
    const count = Math.max(5, Math.round(10 * zoomLevel));
    const ticks = [];
    for (let i = 0; i <= count; i++) {
      ticks.push((i / count) * duration);
    }
    return ticks;
  }, [duration, zoomLevel]);

  const getTimeFromClientX = useCallback(
    (clientX) => {
      if (!trackAreaRef.current || duration <= 0) return 0;
      const rect = trackAreaRef.current.getBoundingClientRect();
      const clickX = clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, clickX / rect.width));
      return ratio * duration;
    },
    [duration],
  );

  useEffect(() => {
    const handleWheelZoom = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoomLevel((prev) => {
          const currentIndex = ZOOM_LEVELS.indexOf(prev);
          if (e.deltaY < 0) {
            return ZOOM_LEVELS[
              Math.min(ZOOM_LEVELS.length - 1, currentIndex + 1)
            ];
          } else if (e.deltaY > 0) {
            return ZOOM_LEVELS[Math.max(0, currentIndex - 1)];
          }
          return prev;
        });
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheelZoom, { passive: false });
    }
    return () => {
      if (container) {
        container.removeEventListener("wheel", handleWheelZoom);
      }
    };
  }, []);

  const handleStartPlayheadDrag = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDraggingPlayhead(true);
  };

  const handleRulerClick = (e) => {
    e.stopPropagation();
    const newTime = getTimeFromClientX(e.clientX);
    if (onSeek) onSeek(newTime);
  };

  const handleStartTrim = (e, dialogue, edge) => {
    e.stopPropagation();
    e.preventDefault();
    setTrimmingState({
      id: dialogue.id,
      edge,
      start: dialogue.start,
      end: dialogue.end,
    });
  };

  const handleStartDraw = (e, speakerId) => {
    if (
      !isDrawModeEnabled ||
      e.button !== 0 ||
      trimmingState ||
      isDraggingPlayhead
    )
      return;
    const time = getTimeFromClientX(e.clientX);

    const hasCollision = data?.dialogues?.some(
      (d) => d.speaker === speakerId && time >= d.start && time <= d.end,
    );
    if (hasCollision) return;

    setDrawingState({
      speakerId,
      startTime: time,
      currentTime: time,
    });
  };

  const handleBlockAuxClick = (e, dialogueId) => {
    if (e.button === 1) {
      e.preventDefault();
      e.stopPropagation();
      if (onDeleteDialogue) onDeleteDialogue(dialogueId);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === "Delete" || e.key === "Backspace") && activeId) {
        if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName))
          return;
        if (onDeleteDialogue) onDeleteDialogue(activeId);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeId, onDeleteDialogue]);

  const calculateMagneticTime = useCallback(
    (rawTime, currentId = null) => {
      if (!isSnapEnabled) return { time: rawTime, snapped: false };

      let closestSnap = null;
      let minDistance = SNAP_THRESHOLD_SECONDS / zoomLevel;

      if (data?.dialogues) {
        data.dialogues.forEach((d) => {
          if (d.id === currentId) return;

          const distStart = Math.abs(rawTime - d.start);
          if (distStart < minDistance) {
            minDistance = distStart;
            closestSnap = d.start;
          }

          const distEnd = Math.abs(rawTime - d.end);
          if (distEnd < minDistance) {
            minDistance = distEnd;
            closestSnap = d.end;
          }
        });
      }

      rulerTicks.forEach((tickTime) => {
        const distTick = Math.abs(rawTime - tickTime);
        if (distTick < minDistance) {
          minDistance = distTick;
          closestSnap = tickTime;
        }
      });

      const distPlayhead = Math.abs(rawTime - currentTime);
      if (distPlayhead < minDistance) {
        minDistance = distPlayhead;
        closestSnap = currentTime;
      }

      if (closestSnap !== null) {
        return { time: closestSnap, snapped: true };
      }
      return { time: rawTime, snapped: false };
    },
    [data?.dialogues, rulerTicks, currentTime, isSnapEnabled, zoomLevel],
  );

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingPlayhead) {
        const scrubTime = getTimeFromClientX(e.clientX);
        if (onSeek) onSeek(scrubTime);
        return;
      }

      if (trimmingState) {
        const rawMouseTime = getTimeFromClientX(e.clientX);
        const { time: magneticTime, snapped } = calculateMagneticTime(
          rawMouseTime,
          trimmingState.id,
        );

        setSnapLineTime(snapped ? magneticTime : null);

        setTrimmingState((prev) => {
          if (!prev) return null;
          if (prev.edge === "start") {
            const safeStart = Math.max(
              0,
              Math.min(magneticTime, prev.end - 0.2),
            );
            return { ...prev, start: safeStart };
          } else {
            const safeEnd = Math.min(
              duration,
              Math.max(magneticTime, prev.start + 0.2),
            );
            return { ...prev, end: safeEnd };
          }
        });
        return;
      }

      if (drawingState) {
        const rawMouseTime = getTimeFromClientX(e.clientX);
        const { time: magneticTime, snapped } =
          calculateMagneticTime(rawMouseTime);

        setSnapLineTime(snapped ? magneticTime : null);
        setDrawingState((prev) =>
          prev ? { ...prev, currentTime: magneticTime } : null,
        );
      }
    };

    const handleMouseUp = () => {
      setSnapLineTime(null);

      if (isDraggingPlayhead) {
        setIsDraggingPlayhead(false);
      }

      if (trimmingState) {
        if (onUpdateDialogueTimes) {
          onUpdateDialogueTimes(
            trimmingState.id,
            trimmingState.start,
            trimmingState.end,
          );
        }
        setTrimmingState(null);
      }

      if (drawingState) {
        const start = Math.min(
          drawingState.startTime,
          drawingState.currentTime,
        );
        const end = Math.max(drawingState.startTime, drawingState.currentTime);

        const collides = data?.dialogues?.some(
          (d) =>
            d.speaker === drawingState.speakerId &&
            !(end <= d.start || start >= d.end),
        );

        if (!collides && end - start >= 0.25 && onAddDialogue) {
          onAddDialogue(drawingState.speakerId, start, end);
        }
        setDrawingState(null);
      }
    };

    if (isDraggingPlayhead || trimmingState || drawingState) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    isDraggingPlayhead,
    trimmingState,
    drawingState,
    getTimeFromClientX,
    calculateMagneticTime,
    onSeek,
    duration,
    onUpdateDialogueTimes,
    onAddDialogue,
    data?.dialogues,
  ]);

  const playheadPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const snapLinePercent =
    snapLineTime !== null && duration > 0
      ? (snapLineTime / duration) * 100
      : null;

  return (
    <div
      className={`backdrop-blur-xl border rounded-2xl p-4 shadow-2xl select-none flex flex-col gap-2 transition-colors duration-200 shrink-0 ${
        theme === "dark"
          ? "bg-neutral-900/60 border-white/10 text-neutral-400"
          : "bg-white/80 border-neutral-300 shadow-neutral-300/30 text-neutral-600"
      }`}
    >
      {/* Controles de cabecera */}
      <div className="flex justify-between items-center text-xs font-mono shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span
              className={`uppercase text-[11px] tracking-wider font-bold ${
                theme === "dark" ? "text-neutral-200" : "text-neutral-800"
              }`}
            >
              Línea NLE
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
              <span>{isExpanded ? "Pistas Separadas" : "Pista Única"}</span>
            </button>
          )}

          {/* Selector de Zoom */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg border border-white/10 bg-neutral-950/40">
            <div
              className="flex items-center gap-1 px-1.5 text-neutral-400"
              title="Zoom de Escala (Ctrl + Rueda)"
            >
              <svg
                className="w-3.5 h-3.5 text-cyan-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 4h18v4H3V4zm0 8h12v4H3v-4zm0 8h6v4H3v-4z"
                />
              </svg>
              <span className="text-[10px] font-bold">Zoom:</span>
            </div>

            {ZOOM_LEVELS.map((lvl) => (
              <button
                key={lvl}
                onClick={() => setZoomLevel(lvl)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  zoomLevel === lvl
                    ? "bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {lvl}x
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsSnapEnabled((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all ${
              isSnapEnabled
                ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.2)]"
                : "bg-neutral-800/40 border-white/10 text-neutral-500 hover:text-neutral-300"
            }`}
            title="Activar/Desactivar alineación magnética"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isSnapEnabled ? "bg-cyan-400 animate-pulse" : "bg-neutral-600"
              }`}
            />
            <span>Imán {isSnapEnabled ? "ON" : "OFF"}</span>
          </button>

          {isExpanded && (
            <button
              onClick={() => setIsDrawModeEnabled((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all ${
                isDrawModeEnabled
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.2)]"
                  : "bg-neutral-800/40 border-white/10 text-neutral-500 hover:text-neutral-300"
              }`}
              title="Permite arrastrar sobre un carril vacío para crear un diálogo nuevo"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>
                {isDrawModeEnabled ? "Modo Lápiz: Listo" : "+ Crear Bloque"}
              </span>
            </button>
          )}
        </div>

        <span>Duración: {duration.toFixed(1)}s</span>
      </div>

      <div className="flex w-full">
        {/* Encabezado lateral */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "7.5rem", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: smoothEase }}
              className="shrink-0 flex flex-col justify-end overflow-hidden z-20"
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

        {/* Contenedor exterior estabilizado (altura y scroll fijos, evita saltos de layout) */}
        <div
          ref={scrollContainerRef}
          className="relative flex-1 min-w-0 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent [scrollbar-gutter:stable]"
        >
          {/* Pista interactiva */}
          <div
            ref={trackAreaRef}
            style={{ width: `${zoomLevel * 100}%` }}
            className="relative transition-[width] duration-150"
          >
            {/* Regla temporal */}
            <div
              onClick={handleRulerClick}
              className={`relative h-6 mb-1 border-b text-[9px] font-mono flex items-end pb-1 cursor-pointer transition-colors ${
                theme === "dark"
                  ? "border-white/10 text-neutral-400 hover:bg-white/[0.04]"
                  : "border-neutral-300 text-neutral-600 hover:bg-black/[0.03]"
              }`}
            >
              {rulerTicks.map((tickTime, idx) => {
                const pct = (tickTime / duration) * 100;
                return (
                  <div
                    key={idx}
                    className="absolute bottom-0 flex flex-col items-center pointer-events-none transform -translate-x-1/2"
                    style={{ left: `${pct}%` }}
                  >
                    <span className="text-[8px] text-neutral-500 mb-0.5">
                      {tickTime.toFixed(0)}s
                    </span>
                    <div
                      className={`w-[1px] ${
                        idx % 2 === 0
                          ? "h-2.5 bg-neutral-400"
                          : "h-1 bg-neutral-600"
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            {/* Carriles */}
            <div
              className={`relative border overflow-hidden shadow-inner backdrop-blur-md max-h-72 overflow-y-auto ${
                isExpanded ? "rounded-r-xl border-l-0" : "rounded-xl"
              } ${
                theme === "dark"
                  ? "bg-neutral-950/70 border-white/10"
                  : "bg-neutral-900 border-neutral-300"
              }`}
            >
              <AnimatePresence mode="wait" initial={false}>
                {!isExpanded ? (
                  <div className="relative h-24 w-full">
                    {data?.dialogues?.map((d) => {
                      const char = data.characters[d.speaker];
                      const isSelected = activeId === d.id;
                      const isBeingTrimmed = trimmingState?.id === d.id;

                      const currentStart = isBeingTrimmed
                        ? trimmingState.start
                        : d.start;
                      const currentEnd = isBeingTrimmed
                        ? trimmingState.end
                        : d.end;

                      const leftPct = (currentStart / duration) * 100;
                      const widthPct = Math.max(
                        ((currentEnd - currentStart) / duration) * 100,
                        1.2,
                      );
                      const isMyCharacter =
                        selectedCharacterId === null ||
                        d.speaker === selectedCharacterId;

                      return (
                        <div
                          key={d.id}
                          onMouseDown={(e) => handleBlockAuxClick(e, d.id)}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!trimmingState) onSelectDialogue(d);
                          }}
                          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                          className={`absolute top-2.5 bottom-2.5 rounded-xl cursor-pointer flex flex-col justify-center px-2.5 overflow-visible border select-none group ${
                            isBeingTrimmed
                              ? "transition-none"
                              : "transition-[border-color,background-color,box-shadow]"
                          } ${
                            isMyCharacter
                              ? `${char?.bg || "bg-neutral-600"} border-white/20`
                              : "bg-neutral-800/80 border-neutral-700/50 opacity-25 grayscale brightness-50"
                          } ${
                            isSelected
                              ? "ring-2 ring-white border-white brightness-125 z-20 shadow-2xl scale-y-105"
                              : isMyCharacter
                                ? "opacity-90 hover:opacity-100"
                                : ""
                          }`}
                          title="Clic rueda del ratón o Supr para borrar"
                        >
                          <span className="text-[11px] font-extrabold text-black truncate leading-tight tracking-tight font-sans pointer-events-none">
                            {char?.name || "Personaje"}
                          </span>
                          <span className="text-[9px] text-black/80 font-mono truncate leading-tight pointer-events-none">
                            {currentStart.toFixed(1)}s - {currentEnd.toFixed(1)}
                            s
                          </span>

                          {isSelected && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onDeleteDialogue) onDeleteDialogue(d.id);
                              }}
                              title="Eliminar este bloque"
                              className="absolute -top-2 right-1 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[9px] font-bold shadow-md hover:scale-110 z-30"
                            >
                              ✕
                            </button>
                          )}

                          {isSelected && (
                            <>
                              <div
                                onMouseDown={(e) =>
                                  handleStartTrim(e, d, "start")
                                }
                                title="Arrastra para ajustar inicio"
                                className="absolute -left-2 top-0 bottom-0 w-4 cursor-ew-resize flex items-center justify-center z-30 touch-none"
                              >
                                <div className="w-1.5 h-6 bg-white rounded-full shadow-lg border border-black/50 hover:scale-125 transition-transform" />
                              </div>

                              <div
                                onMouseDown={(e) =>
                                  handleStartTrim(e, d, "end")
                                }
                                title="Arrastra para ajustar fin"
                                className="absolute -right-2 top-0 bottom-0 w-4 cursor-ew-resize flex items-center justify-center z-30 touch-none"
                              >
                                <div className="w-1.5 h-6 bg-white rounded-full shadow-lg border border-black/50 hover:scale-125 transition-transform" />
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-white/5">
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
                          onMouseDown={(e) => handleStartDraw(e, char.id)}
                          className={`h-16 relative transition-colors ${
                            isMyCharacter
                              ? isDrawModeEnabled
                                ? "hover:bg-cyan-500/[0.04] cursor-crosshair"
                                : "hover:bg-white/[0.02]"
                              : "opacity-35 pointer-events-none"
                          }`}
                        >
                          {charDialogues.map((d) => {
                            const isSelected = activeId === d.id;
                            const isBeingTrimmed = trimmingState?.id === d.id;

                            const currentStart = isBeingTrimmed
                              ? trimmingState.start
                              : d.start;
                            const currentEnd = isBeingTrimmed
                              ? trimmingState.end
                              : d.end;

                            const leftPct = (currentStart / duration) * 100;
                            const widthPct = Math.max(
                              ((currentEnd - currentStart) / duration) * 100,
                              1.2,
                            );

                            return (
                              <div
                                key={d.id}
                                onMouseDown={(e) =>
                                  handleBlockAuxClick(e, d.id)
                                }
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!trimmingState) onSelectDialogue(d);
                                }}
                                style={{
                                  left: `${leftPct}%`,
                                  width: `${widthPct}%`,
                                }}
                                className={`absolute top-2 bottom-2 rounded-lg cursor-pointer flex flex-col justify-center px-2 overflow-visible border select-none group ${
                                  isBeingTrimmed
                                    ? "transition-none"
                                    : "transition-[border-color,background-color,box-shadow]"
                                } ${
                                  isMyCharacter
                                    ? `${char.bg} border-white/20`
                                    : "bg-neutral-800 border-neutral-700 opacity-30 grayscale"
                                } ${
                                  isSelected
                                    ? "ring-2 ring-white border-white brightness-125 z-20 shadow-xl"
                                    : "opacity-85 hover:opacity-100"
                                }`}
                                title="Clic rueda del ratón o Supr para borrar"
                              >
                                <span className="text-[10px] font-extrabold text-black truncate leading-tight font-sans pointer-events-none">
                                  {d.text}
                                </span>
                                <span className="text-[8px] text-black/80 font-mono truncate leading-tight pointer-events-none">
                                  {currentStart.toFixed(1)}s -{" "}
                                  {currentEnd.toFixed(1)}s
                                </span>

                                {isSelected && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (onDeleteDialogue)
                                        onDeleteDialogue(d.id);
                                    }}
                                    title="Eliminar este bloque"
                                    className="absolute -top-1.5 right-1 w-3.5 h-3.5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[8px] font-bold shadow hover:scale-110 z-30"
                                  >
                                    ✕
                                  </button>
                                )}

                                {isSelected && (
                                  <>
                                    <div
                                      onMouseDown={(e) =>
                                        handleStartTrim(e, d, "start")
                                      }
                                      className="absolute -left-2 top-0 bottom-0 w-4 cursor-ew-resize flex items-center justify-center z-30 touch-none"
                                    >
                                      <div className="w-1.5 h-5 bg-white rounded-full shadow-lg border border-black/50 hover:scale-125 transition-transform" />
                                    </div>
                                    <div
                                      onMouseDown={(e) =>
                                        handleStartTrim(e, d, "end")
                                      }
                                      className="absolute -right-2 top-0 bottom-0 w-4 cursor-ew-resize flex items-center justify-center z-30 touch-none"
                                    >
                                      <div className="w-1.5 h-5 bg-white rounded-full shadow-lg border border-black/50 hover:scale-125 transition-transform" />
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })}

                          {drawingState &&
                            drawingState.speakerId === char.id && (
                              <div
                                style={{
                                  left: `${(Math.min(drawingState.startTime, drawingState.currentTime) / duration) * 100}%`,
                                  width: `${(Math.abs(drawingState.currentTime - drawingState.startTime) / duration) * 100}%`,
                                }}
                                className="absolute top-2 bottom-2 rounded-lg border-2 border-dashed border-cyan-300 bg-cyan-500/20 backdrop-blur-sm pointer-events-none z-30 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                              />
                            )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </AnimatePresence>

              {Object.keys(takesByCharacter).map((speakerId) => {
                const char = data?.characters?.[speakerId];

                return (
                  <div
                    key={speakerId}
                    className="h-6 w-full bg-emerald-950/40 border-t border-emerald-500/30 flex items-center px-3 gap-2 pointer-events-none"
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

              {snapLinePercent !== null && (
                <div
                  className="absolute top-0 bottom-0 pointer-events-none z-50 flex flex-col items-center"
                  style={{
                    left: `${snapLinePercent}%`,
                    transform: "translateX(-50%)",
                  }}
                >
                  <div className="w-2.5 h-2.5 bg-cyan-400 rotate-45 shadow-[0_0_12px_rgba(6,182,212,1)]" />
                  <div className="w-[2px] flex-1 bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,1)]" />
                </div>
              )}

              {data?.duration > 0 && (
                <div
                  className="absolute top-0 bottom-0 pointer-events-none z-40 flex flex-col items-center"
                  style={{
                    left: `${playheadPercent}%`,
                    transform: "translateX(-50%)",
                  }}
                >
                  <div
                    onMouseDown={handleStartPlayheadDrag}
                    title="Arrastra para mover el cabezal"
                    className={`pointer-events-auto cursor-ew-resize transition-transform duration-75 flex flex-col items-center p-1 -mt-1 group touch-none ${
                      isDraggingPlayhead ? "scale-125" : "hover:scale-115"
                    }`}
                  >
                    <div className="w-3.5 h-3 bg-red-500 rounded-t-sm shadow-md border border-red-300 flex items-center justify-center">
                      <div className="w-1.5 h-0.5 bg-white/80 rounded-full" />
                    </div>
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-red-500" />
                  </div>

                  <div className="w-[1.5px] flex-1 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)] pointer-events-none" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
