"use client";

import { motion } from "framer-motion";

const smoothEase = [0.16, 1, 0.3, 1];

export default function ScriptPanel({
  data,
  activeId,
  onSelectDialogue,
  theme = "dark",
  selectedCharacterId = null,
}) {
  const dialogues = data?.dialogues || [];

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

      {/* Lista de diálogos */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 select-none">
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

            return (
              <div
                key={d.id}
                onClick={() => onSelectDialogue(d)}
                className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                  isActive
                    ? "bg-cyan-500/15 border-cyan-400 ring-1 ring-inset ring-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                    : isMyCharacter
                      ? theme === "dark"
                        ? "bg-neutral-950/40 border-white/5 hover:border-white/20 hover:bg-neutral-800/40"
                        : "bg-neutral-100 border-neutral-300 hover:border-neutral-400 hover:bg-neutral-200"
                      : "bg-neutral-950/20 border-transparent opacity-30 grayscale brightness-50"
                }`}
              >
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isMyCharacter
                          ? char?.bg || "bg-neutral-500"
                          : "bg-neutral-600"
                      } shadow-sm`}
                    />
                    <span
                      className={`text-xs font-bold font-mono tracking-tight ${
                        isMyCharacter
                          ? char?.text || "text-neutral-200"
                          : "text-neutral-500"
                      }`}
                    >
                      {char?.name || "Desconocido"}
                    </span>
                    {isMyCharacter && selectedCharacterId !== null && (
                      <span className="text-[9px] font-mono text-cyan-400 font-bold px-1.5 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-500/30">
                        TU LÍNEA
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500">
                    {d.timecode}
                  </span>
                </div>
                <p
                  className={`text-xs leading-relaxed ${
                    isMyCharacter
                      ? theme === "dark"
                        ? "text-neutral-300"
                        : "text-neutral-800"
                      : "text-neutral-500 italic"
                  }`}
                >
                  {d.text}
                </p>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
