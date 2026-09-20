"use client";

export default function CharacterLegend({ characters, onRenameSpeaker }) {
  if (!characters || Object.keys(characters).length === 0) return null;

  return (
    <div className="flex items-center gap-3 bg-neutral-900/40 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-xl text-xs">
      <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
        Personajes:
      </span>
      <div className="flex flex-wrap gap-3">
        {Object.values(characters).map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-1.5 bg-neutral-950/50 border border-white/5 px-2.5 py-1 rounded-lg"
          >
            <span className={`w-2.5 h-2.5 rounded-full ${c.bg} shadow-sm`} />
            <input
              type="text"
              value={c.name}
              onChange={(e) => onRenameSpeaker(c.id, e.target.value)}
              className="bg-transparent border-none text-xs w-28 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 rounded px-1 font-medium font-sans"
              title="Haz clic para editar el nombre"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
