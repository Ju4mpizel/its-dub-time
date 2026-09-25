"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

const smoothEase = [0.16, 1, 0.3, 1];

export default function ScriptPanel({
  data,
  activeId,
  onSelectDialogue,
  theme = "dark",
  selectedCharacterId = null,
  onUpdateDialogueText,
  onReassignSpeaker,
}) {
  const dialogues = data?.dialogues || [];
  const charactersList = data?.characters ? Object.values(data.characters) : [];

  // Estados locales para la edición en caliente
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [changingSpeakerId, setChangingSpeakerId] = useState(null);

  // Referencias para el Auto-Scroll inteligente
  const listContainerRef = useRef(null);
  const itemRefs = useRef({});

  // Auto-scroll suave centrado en la frase activa
  useEffect(() => {
    // Si se está editando una frase, no mover el scroll para no desconcentrar
    if (editingId !== null) return;

    if (activeId && itemRefs.current[activeId]) {
      itemRefs.current[activeId].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeId, editingId]);

  const startEditingText = (d, e) => {
    e.stopPropagation();
    setEditingId(d.id);
    setEditText(d.text);
    setChangingSpeakerId(null);
  };

  const saveText = (id) => {
    if (onUpdateDialogueText && editText.trim()) {
      onUpdateDialogueText(id, editText.trim());
    }
    setEditingId(null);
  };

  const handleKeyDown = (e, id) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      saveText(id);
    } else if (e.key === "Escape") {
      setEditingId(null);
    }
  };

  return (
    <motion.div
      layout="position"
      transition={{ duration: 0.35, ease: smoothEase }}
      className={`flex flex-col backdrop-blur-xl border rounded-2xl p-4 shadow-xl flex-1 min-h-0 overflow-hidden transition-colors duration-200 ${
        theme === "dark"
          ? "bg-neutral-900/60 border-white/10"
          : "bg-white/80 border-neutral-300 shadow-neutral-300/30"
      }`}
    >
      {/* Encabezado */}
      <div className="flex justify-between items-center pb-3 border-b border-white/10 mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
          <span
            className={`font-mono text-xs font-bold tracking-wider uppercase ${
              theme === "dark" ? "text-neutral-200" : "text-neutral-800"
            }`}
          >
            Guión Técnico
          </span>
        </div>
        <span className="text-[11px] font-mono text-neutral-500">
          {dialogues.length} intervenciones
        </span>
      </div>

      {/* Lista de diálogos con scroll asistido */}
      <div
        ref={listContainerRef}
        className="flex-1 overflow-y-auto space-y-2 pr-1 select-none scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent"
      >
        {dialogues.length === 0 ? (
          <div className="h-full flex items-center justify-center text-neutral-500 text-xs font-mono">
            Esperando archivo multimedia...
          </div>
        ) : (
          dialogues.map((d) => {
            const char = data?.characters?.[d.speaker];
            const isActive = activeId === d.id;
            const isMyCharacter =
              selectedCharacterId === null || d.speaker === selectedCharacterId;
            const isEditingThis = editingId === d.id;
            const isPickingSpeaker = changingSpeakerId === d.id;

            return (
              <div
                key={d.id}
                ref={(el) => (itemRefs.current[d.id] = el)}
                onClick={() => onSelectDialogue(d)}
                className={`p-3 rounded-xl border cursor-pointer transition-all duration-300 ${
                  isActive
                    ? "bg-cyan-500/15 border-cyan-400 ring-1 ring-inset ring-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)] scale-[1.01]"
                    : isMyCharacter
                      ? theme === "dark"
                        ? "bg-neutral-950/40 border-white/5 hover:border-white/20 hover:bg-neutral-850"
                        : "bg-neutral-100 border-neutral-300 hover:border-neutral-400 hover:bg-neutral-200"
                      : "bg-neutral-950/20 border-transparent opacity-30 grayscale brightness-50"
                }`}
              >
                {/* Barra superior de la tarjeta: Personaje + Timecode */}
                <div className="flex justify-between items-center mb-1.5 relative">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setChangingSpeakerId(isPickingSpeaker ? null : d.id);
                        setEditingId(null);
                      }}
                      title="Cambiar personaje de esta frase"
                      className="flex items-center gap-1.5 hover:opacity-80 transition-opacity p-0.5 rounded border border-transparent hover:border-white/10"
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          isMyCharacter
                            ? char?.bg || "bg-neutral-500"
                            : "bg-neutral-600"
                        } shadow-sm`}
                      />
                      <span
                        className={`text-xs font-bold font-mono tracking-tight underline decoration-dotted underline-offset-2 ${
                          isMyCharacter
                            ? char?.text || "text-neutral-200"
                            : "text-neutral-500"
                        }`}
                      >
                        {char?.name || "Desconocido"}
                      </span>
                    </button>

                    {/* Menú flotante de reasignación */}
                    {isPickingSpeaker && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute left-0 top-7 z-30 flex flex-col p-1.5 rounded-xl border shadow-2xl backdrop-blur-xl bg-neutral-900 border-white/15 min-w-[140px]"
                      >
                        <span className="text-[9px] font-mono text-neutral-400 px-2 py-1 uppercase tracking-wider">
                          Reasignar a:
                        </span>
                        {charactersList.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => {
                              onReassignSpeaker(d.id, c.id);
                              setChangingSpeakerId(null);
                            }}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs hover:bg-white/10 text-left text-neutral-200"
                          >
                            <span className={`w-2 h-2 rounded-full ${c.bg}`} />
                            <span>{c.name}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {isMyCharacter && selectedCharacterId !== null && (
                      <span className="text-[9px] font-mono text-cyan-400 font-bold px-1.5 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-500/30">
                        TU LÍNEA
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-neutral-500">
                      {d.timecode}
                    </span>

                    {!isEditingThis && (
                      <button
                        onClick={(e) => startEditingText(d, e)}
                        title="Editar frase"
                        className="text-neutral-500 hover:text-cyan-400 p-0.5 transition-colors"
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
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Texto de la frase o Input de Edición */}
                {isEditingThis ? (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1 flex flex-col gap-1.5"
                  >
                    <textarea
                      autoFocus
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onBlur={() => saveText(d.id)}
                      onKeyDown={(e) => handleKeyDown(e, d.id)}
                      rows={2}
                      className={`w-full p-2 rounded-lg border text-xs font-sans leading-relaxed focus:outline-none resize-none ${
                        theme === "dark"
                          ? "bg-neutral-900 border-cyan-500/50 text-neutral-100 ring-1 ring-cyan-500/30"
                          : "bg-white border-cyan-500 text-neutral-900 shadow-sm"
                      }`}
                    />
                    <div className="flex justify-end gap-1.5">
                      <span className="text-[9px] font-mono text-neutral-500 self-center">
                        Presiona Enter para guardar
                      </span>
                      <button
                        onClick={() => saveText(d.id)}
                        className="px-2 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-[10px]"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                ) : (
                  <p
                    onDoubleClick={(e) => startEditingText(d, e)}
                    title="Doble clic para editar frase"
                    className={`text-xs leading-relaxed ${
                      isMyCharacter
                        ? theme === "dark"
                          ? "text-neutral-300 hover:text-white"
                          : "text-neutral-800 hover:text-black"
                        : "text-neutral-500 italic"
                    }`}
                  >
                    {d.text}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
