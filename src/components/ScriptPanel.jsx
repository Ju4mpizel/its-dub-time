"use client";

import { useEffect, useRef } from "react";

export default function ScriptPanel({
  data,
  activeId,
  onSelectDialogue,
  theme = "dark",
}) {
  const activeItemRef = useRef(null);

  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeId]);

  return (
    <div
      className={`flex flex-col backdrop-blur-xl border rounded-2xl p-4 shadow-xl flex-1 min-h-0 overflow-hidden transition-colors duration-200 ${
        theme === "dark"
          ? "bg-neutral-900/30 border-white/10"
          : "bg-neutral-200/80 border-neutral-300 shadow-neutral-300/40"
      }`}
    >
      <div className="flex justify-between items-center mb-3">
        <span
          className={`text-[11px] font-mono tracking-wider uppercase ${
            theme === "dark" ? "text-neutral-400" : "text-neutral-600"
          }`}
        >
          Guión Técnico y Diálogos
        </span>
        <span
          className={`text-[10px] font-mono ${
            theme === "dark" ? "text-neutral-500" : "text-neutral-500"
          }`}
        >
          {data?.dialogues?.length || 0} intervenciones
        </span>
      </div>

      <div className="overflow-y-auto space-y-2.5 pr-2 flex-1">
        {data?.dialogues?.map((item) => {
          const char = data.characters[item.speaker];
          const isSelected = activeId === item.id;

          return (
            <div
              key={item.id}
              ref={isSelected ? activeItemRef : null}
              onClick={() => onSelectDialogue(item)}
              className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                isSelected
                  ? theme === "dark"
                    ? `bg-neutral-800/80 ${char?.border || "border-cyan-500"} shadow-lg shadow-black/40 ring-1 ring-white/20 translate-x-1`
                    : `bg-white ${char?.border || "border-cyan-500"} shadow-md ring-1 ring-neutral-400 translate-x-1`
                  : theme === "dark"
                    ? "bg-neutral-950/40 border-white/5 hover:border-white/15 hover:bg-neutral-900/40"
                    : "bg-neutral-100/80 border-neutral-300 hover:border-neutral-400 hover:bg-neutral-100"
              }`}
            >
              <div className="flex justify-between items-center text-xs mb-1.5 font-mono">
                <span
                  className={`font-bold flex items-center gap-1.5 ${
                    char?.text ||
                    (theme === "dark" ? "text-neutral-200" : "text-neutral-800")
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${char?.bg || "bg-neutral-400"}`}
                  />
                  {char?.name || "Desconocido"}
                </span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded border ${
                    theme === "dark"
                      ? "text-neutral-400 bg-neutral-900/80 border-white/5"
                      : "text-neutral-600 bg-neutral-200 border-neutral-300"
                  }`}
                >
                  {item.timecode}
                </span>
              </div>
              <p
                className={`text-sm leading-relaxed select-text font-normal ${
                  theme === "dark" ? "text-neutral-200" : "text-neutral-800"
                }`}
              >
                {item.text}
              </p>
            </div>
          );
        })}

        {!data?.dialogues && (
          <div className="h-full flex items-center justify-center text-xs text-neutral-500 font-mono">
            Esperando archivo multimedia...
          </div>
        )}
      </div>
    </div>
  );
}
