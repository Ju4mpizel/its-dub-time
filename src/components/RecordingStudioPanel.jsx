"use client";

export default function RecordingStudioPanel({
  theme = "dark",
  characters,
  selectedCharacterId,
  onSelectCharacter,
  isRecording,
  countdown,
  onStartRecord,
  onStopRecord,
  takesByCharacter,
  playingSoloCharacterId,
  onTogglePlaySoloTake,
  isPlayingMix,
  onTogglePlayMix,
  onDeleteTake,
  guideAudioMode,
  onChangeGuideAudioMode,
  // Props de hardware de audio
  audioDevices = [],
  selectedDeviceId,
  onSelectAudioDevice,
}) {
  const charactersList = characters ? Object.values(characters) : [];
  const recordedCharactersCount = Object.keys(takesByCharacter).length;
  const isSelectedCharRecorded =
    selectedCharacterId !== null && !!takesByCharacter[selectedCharacterId];

  return (
    <div
      className={`h-full flex flex-col justify-between overflow-hidden rounded-2xl border p-4 backdrop-blur-xl shadow-xl transition-colors duration-200 ${
        theme === "dark"
          ? "bg-neutral-900/70 border-white/10 text-neutral-200"
          : "bg-white/90 border-neutral-300/80 shadow-neutral-300/40 text-neutral-800"
      }`}
    >
      {/* Encabezado */}
      <div
        className={`flex justify-between items-center pb-3 border-b mb-3 shrink-0 ${
          theme === "dark" ? "border-white/10" : "border-neutral-200"
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
          <span
            className={`font-mono text-xs font-bold tracking-wider uppercase ${
              theme === "dark" ? "text-neutral-100" : "text-neutral-900"
            }`}
          >
            Estudio ADR
          </span>
        </div>

        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
            theme === "dark"
              ? "text-cyan-400 bg-cyan-950/60 border-cyan-500/30"
              : "text-cyan-700 bg-cyan-50 border-cyan-300 font-semibold"
          }`}
        >
          Single Actor
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-between overflow-y-auto pr-1 gap-3 min-h-0">
        {/* 1. Selector de personaje */}
        <div className="space-y-1.5">
          <span
            className={`text-[11px] font-mono block ${
              theme === "dark"
                ? "text-neutral-400"
                : "text-neutral-600 font-medium"
            }`}
          >
            1. Asigna tu personaje:
          </span>

          {charactersList.length === 0 ? (
            <p className="text-xs text-neutral-500 italic py-1">
              Carga un video para detectar los personajes.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-1.5">
              {charactersList.map((char) => {
                const isSelected = selectedCharacterId === char.id;
                const hasRecorded = !!takesByCharacter[char.id];

                return (
                  <button
                    key={char.id}
                    onClick={() => onSelectCharacter(char.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all duration-150 ${
                      isSelected
                        ? theme === "dark"
                          ? "bg-cyan-500/15 border-cyan-400 text-white font-bold ring-1 ring-cyan-400/50 shadow-md"
                          : "bg-cyan-50 border-cyan-500 text-cyan-950 font-bold ring-1 ring-cyan-500/40 shadow-sm"
                        : theme === "dark"
                          ? "bg-neutral-950/40 border-white/5 text-neutral-300 hover:border-white/20"
                          : "bg-neutral-100/90 border-neutral-200 text-neutral-700 hover:bg-neutral-200/80"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${char.bg} shadow-sm`}
                      />
                      <span className="font-sans">{char.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-[10px]">
                      {hasRecorded ? (
                        <span
                          className={`flex items-center gap-1 font-semibold ${
                            theme === "dark"
                              ? "text-emerald-400"
                              : "text-emerald-600"
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Grabado
                        </span>
                      ) : (
                        <span
                          className={
                            theme === "dark"
                              ? "text-neutral-500"
                              : "text-neutral-400"
                          }
                        >
                          Pendiente
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. Tomas registradas */}
        <div
          className={`space-y-2 border-t pt-2.5 ${
            theme === "dark" ? "border-white/10" : "border-neutral-200"
          }`}
        >
          <span
            className={`text-[11px] font-mono block ${
              theme === "dark"
                ? "text-neutral-400"
                : "text-neutral-600 font-medium"
            }`}
          >
            2. Tomas registradas:
          </span>

          {recordedCharactersCount === 0 ? (
            <p className="text-[11px] text-neutral-500 italic py-1">
              Ningún personaje grabado aún.
            </p>
          ) : (
            <div className="space-y-2">
              {Object.entries(takesByCharacter).map(([speakerId, take]) => {
                const char = characters?.[speakerId];
                const isSoloPlaying =
                  playingSoloCharacterId === Number(speakerId);

                return (
                  <div
                    key={speakerId}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                      theme === "dark"
                        ? "bg-neutral-950/60 border-white/10"
                        : "bg-neutral-50 border-neutral-200 shadow-sm"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${char?.bg || "bg-cyan-500"} shrink-0 shadow-sm`}
                      />
                      <span
                        className={`font-bold text-xs truncate ${
                          theme === "dark"
                            ? "text-neutral-100"
                            : "text-neutral-900"
                        }`}
                      >
                        {char?.name || "Personaje"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Oír solo */}
                      <button
                        onClick={() => onTogglePlaySoloTake(Number(speakerId))}
                        title={
                          isSoloPlaying
                            ? "Pausar toma"
                            : "Reproducir solo esta toma"
                        }
                        className={`p-2 rounded-lg border transition-all active:scale-95 ${
                          isSoloPlaying
                            ? "bg-amber-500 border-amber-400 text-white shadow-[0_0_10px_rgba(245,158,11,0.4)]"
                            : theme === "dark"
                              ? "bg-neutral-800/90 border-white/10 text-neutral-300 hover:text-white hover:bg-neutral-700"
                              : "bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-100 shadow-sm"
                        }`}
                      >
                        {isSoloPlaying ? (
                          <svg
                            className="w-3.5 h-3.5"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                          </svg>
                        ) : (
                          <svg
                            className="w-3.5 h-3.5"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        )}
                      </button>

                      {/* Regrabar */}
                      <button
                        onClick={() => {
                          onSelectCharacter(Number(speakerId));
                          onStartRecord();
                        }}
                        disabled={isRecording || countdown !== null}
                        title="Regrabar esta toma"
                        className={`p-2 rounded-lg border transition-all active:scale-95 disabled:opacity-40 ${
                          theme === "dark"
                            ? "bg-rose-950/40 border-rose-500/30 text-rose-300 hover:bg-rose-900/60"
                            : "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100 shadow-sm"
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
                      </button>

                      {/* Descartar */}
                      <button
                        onClick={() => onDeleteTake(Number(speakerId))}
                        disabled={isRecording}
                        title="Descartar toma permanentemente"
                        className={`p-2 rounded-lg border transition-all active:scale-95 disabled:opacity-40 ${
                          theme === "dark"
                            ? "bg-neutral-900 border-white/10 text-neutral-400 hover:text-rose-400 hover:bg-rose-950/20"
                            : "bg-white border-neutral-300 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 shadow-sm"
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
                            strokeWidth="1.8"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Acciones de Grabación, Pista Guía y Mezcla */}
        <div
          className={`pt-2.5 border-t space-y-2.5 shrink-0 ${
            theme === "dark" ? "border-white/10" : "border-neutral-200"
          }`}
        >
          {countdown !== null && (
            <div className="text-center py-1">
              <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest animate-pulse font-bold">
                Iniciando toma en...
              </span>
              <div className="text-4xl font-mono font-black text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]">
                {countdown}
              </div>
            </div>
          )}

          {/* Selector de Entrada de Micrófono */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border bg-neutral-950/30 border-white/5">
            <svg
              className={`w-3.5 h-3.5 shrink-0 ${
                theme === "dark" ? "text-cyan-400" : "text-cyan-600"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z"
              />
            </svg>
            <select
              value={selectedDeviceId}
              onChange={(e) => onSelectAudioDevice(e.target.value)}
              disabled={isRecording}
              className={`w-full bg-transparent text-[11px] font-mono font-medium focus:outline-none cursor-pointer truncate ${
                theme === "dark" ? "text-neutral-300" : "text-neutral-700"
              }`}
            >
              {audioDevices.length === 0 ? (
                <option value="" className="bg-neutral-900 text-neutral-400">
                  Micrófono por defecto
                </option>
              ) : (
                audioDevices.map((dev, idx) => (
                  <option
                    key={dev.deviceId || idx}
                    value={dev.deviceId}
                    className="bg-neutral-900 text-neutral-200"
                  >
                    {dev.label || `Micrófono ${idx + 1}`}
                  </option>
                ))
              )}
            </select>
          </div>

          {isRecording ? (
            <button
              onClick={onStopRecord}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 border border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.6)] animate-pulse transition-all active:scale-95"
            >
              <span className="w-2.5 h-2.5 rounded-sm bg-white" />
              <span>Detener Grabación</span>
            </button>
          ) : (
            !isSelectedCharRecorded && (
              <button
                onClick={onStartRecord}
                disabled={selectedCharacterId === null || countdown !== null}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-[0_0_15px_rgba(244,63,94,0.35)] disabled:opacity-40 transition-all active:scale-95"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
                <span>
                  Grabar a{" "}
                  {characters?.[selectedCharacterId]?.name || "Personaje"}
                </span>
              </button>
            )
          )}

          {/* Conmutador de Pista Guía */}
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl border bg-neutral-950/30 border-white/5 text-[11px] font-mono">
            <span
              className={
                theme === "dark" ? "text-neutral-400" : "text-neutral-600"
              }
            >
              Audio Original:
            </span>
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-neutral-900 border border-white/10">
              <button
                onClick={() => onChangeGuideAudioMode("mute")}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  guideAudioMode === "mute"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                Mute (0%)
              </button>
              <button
                onClick={() => onChangeGuideAudioMode("low")}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  guideAudioMode === "low"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                Guía (20%)
              </button>
              <button
                onClick={() => onChangeGuideAudioMode("full")}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  guideAudioMode === "full"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                100%
              </button>
            </div>
          </div>

          {/* Botón Distintivo de Master Mezcla */}
          <button
            onClick={onTogglePlayMix}
            disabled={recordedCharactersCount === 0 || isRecording}
            className={`w-full relative group overflow-hidden flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all duration-200 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed border ${
              isPlayingMix
                ? "bg-amber-600 hover:bg-amber-500 border-amber-400 text-white shadow-[0_0_20px_rgba(217,119,6,0.5)]"
                : theme === "dark"
                  ? "bg-gradient-to-r from-teal-900/80 via-emerald-800/80 to-teal-900/80 hover:from-teal-800 hover:to-emerald-700 border-emerald-500/40 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                  : "bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 hover:from-teal-500 hover:to-emerald-500 border-teal-500 text-white shadow-md"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`p-1.5 rounded-lg ${
                  isPlayingMix
                    ? "bg-black/20"
                    : theme === "dark"
                      ? "bg-emerald-950/80 border border-emerald-500/30 text-emerald-300"
                      : "bg-white/20 text-white"
                }`}
              >
                {isPlayingMix ? (
                  <svg
                    className="w-3.5 h-3.5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg
                    className="w-3.5 h-3.5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                  </svg>
                )}
              </span>
              <span className="tracking-wide font-sans">
                {isPlayingMix ? "Pausar Mezcla ADR" : "Escuchar Mezcla Final"}
              </span>
            </div>

            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                isPlayingMix
                  ? "bg-black/30 text-amber-200"
                  : theme === "dark"
                    ? "bg-black/40 text-emerald-300 border border-emerald-500/30"
                    : "bg-black/20 text-white"
              }`}
            >
              {recordedCharactersCount}{" "}
              {recordedCharactersCount === 1 ? "voz" : "voces"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
