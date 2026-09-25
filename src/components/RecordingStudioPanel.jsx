"use client";

export default function RecordingStudioPanel({
  theme = "dark",
  characters,
  dialogues = [],
  selectedCharacterId,
  onSelectCharacter,
  isRecording,
  countdown,
  recordingDialogueId,
  onStartRecordFull,
  onStopRecordFull,
  onStartRecordLine,
  onStopRecordLine,
  takesByCharacter = {},
  takesByDialogue = {},
  recordingMode = "line", // 'full' | 'line'
  onChangeRecordingMode,
  playingSoloCharacterId,
  onTogglePlaySoloTake,
  playingSoloDialogueId,
  onTogglePlaySoloLine,
  isPlayingMix,
  onTogglePlayMix,
  onDeleteCharacterTake,
  onDeleteDialogueTake,
  guideAudioMode,
  onChangeGuideAudioMode,
  audioDevices = [],
  selectedDeviceId,
  onSelectAudioDevice,
}) {
  const charactersList = characters ? Object.values(characters) : [];
  const activeChar = characters?.[selectedCharacterId];

  // Frases asignadas al personaje seleccionado
  const characterLines = dialogues.filter(
    (d) => d.speaker === selectedCharacterId,
  );
  const recordedLinesCount = characterLines.filter(
    (d) => !!takesByDialogue[d.id],
  ).length;

  const totalRecordedCount =
    recordingMode === "full"
      ? Object.keys(takesByCharacter).length
      : Object.keys(takesByDialogue).length;

  return (
    <div
      className={`h-full flex flex-col justify-between overflow-hidden rounded-2xl border p-4 backdrop-blur-xl shadow-xl transition-colors duration-200 ${
        theme === "dark"
          ? "bg-neutral-900/70 border-white/10 text-neutral-200"
          : "bg-white/90 border-neutral-300/80 shadow-neutral-300/40 text-neutral-800"
      }`}
    >
      {/* 1. Encabezado y Conmutador de Modo */}
      <div
        className={`flex flex-col gap-2.5 pb-3 border-b shrink-0 ${
          theme === "dark" ? "border-white/10" : "border-neutral-200"
        }`}
      >
        <div className="flex justify-between items-center">
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
            {recordingMode === "line" ? "Toma x Frase" : "Pase Completo"}
          </span>
        </div>

        {/* Selector de Modo */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-neutral-950/40 border border-white/5 text-xs font-mono">
          <button
            onClick={() => onChangeRecordingMode("line")}
            className={`py-1.5 rounded-lg font-bold transition-all ${
              recordingMode === "line"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Por Frase (Loop)
          </button>
          <button
            onClick={() => onChangeRecordingMode("full")}
            className={`py-1.5 rounded-lg font-bold transition-all ${
              recordingMode === "full"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Escena Completa
          </button>
        </div>
      </div>

      {/* 2. Cuerpo Principal */}
      <div className="flex-1 flex flex-col justify-between overflow-y-auto pr-1 gap-3 min-h-0 py-2">
        {/* Selector de personaje */}
        <div className="space-y-1.5 shrink-0">
          <span
            className={`text-[11px] font-mono block ${
              theme === "dark"
                ? "text-neutral-400"
                : "text-neutral-600 font-medium"
            }`}
          >
            Personaje Activo:
          </span>

          {charactersList.length === 0 ? (
            <p className="text-xs text-neutral-500 italic py-1">
              Carga un video para detectar los personajes.
            </p>
          ) : (
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {charactersList.map((char) => {
                const isSelected = selectedCharacterId === char.id;
                return (
                  <button
                    key={char.id}
                    onClick={() => onSelectCharacter(char.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-sans shrink-0 transition-all ${
                      isSelected
                        ? "bg-cyan-500/20 border-cyan-400 text-white font-bold ring-1 ring-cyan-400/50 shadow-sm"
                        : "bg-neutral-950/40 border-white/5 text-neutral-400 hover:text-neutral-200 hover:border-white/20"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${char.bg} shadow-sm`}
                    />
                    <span>{char.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* VISTA A: MODO POR FRASE */}
        {recordingMode === "line" ? (
          <div className="flex-1 flex flex-col min-h-0 space-y-2 border-t pt-2 border-white/10">
            <div className="flex justify-between items-center text-[11px] font-mono">
              <span
                className={
                  theme === "dark" ? "text-neutral-400" : "text-neutral-600"
                }
              >
                Frases de {activeChar?.name || "Personaje"}:
              </span>
              <span className="text-cyan-400 font-bold">
                {recordedLinesCount} / {characterLines.length} grabadas
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[140px]">
              {characterLines.length === 0 ? (
                <p className="text-xs text-neutral-500 italic py-3 text-center">
                  Este personaje no tiene líneas asignadas en el guión.
                </p>
              ) : (
                characterLines.map((line) => {
                  const take = takesByDialogue[line.id];
                  const hasTake = !!take;
                  const isThisRecording =
                    isRecording && recordingDialogueId === line.id;
                  const isThisPlaying = playingSoloDialogueId === line.id;

                  return (
                    <div
                      key={line.id}
                      className={`p-2.5 rounded-xl border flex flex-col gap-1.5 transition-all ${
                        isThisRecording
                          ? "bg-rose-950/30 border-rose-500/50 ring-1 ring-rose-500/40"
                          : hasTake
                            ? "bg-neutral-950/60 border-emerald-500/30 shadow-sm"
                            : "bg-neutral-950/30 border-white/5"
                      }`}
                    >
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-neutral-500">
                          {line.timecode}
                        </span>
                        {hasTake ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Toma Lista
                          </span>
                        ) : (
                          <span className="text-neutral-500">Pendiente</span>
                        )}
                      </div>

                      <p className="text-xs text-neutral-200 line-clamp-2 leading-relaxed">
                        "{line.text}"
                      </p>

                      <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-white/5">
                        {isThisRecording ? (
                          <button
                            onClick={onStopRecordLine}
                            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-mono font-bold animate-pulse"
                          >
                            <span className="w-2 h-2 rounded-sm bg-white" />
                            <span>Detener</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onStartRecordLine(line)}
                            disabled={isRecording || countdown !== null}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-mono font-bold transition-all disabled:opacity-30 ${
                              hasTake
                                ? "bg-neutral-800/80 border-white/10 text-neutral-300 hover:bg-neutral-700"
                                : "bg-rose-600/20 border-rose-500/40 text-rose-300 hover:bg-rose-600/30"
                            }`}
                          >
                            <svg
                              className="w-3 h-3 text-rose-400"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <circle cx="12" cy="12" r="8" />
                            </svg>
                            <span>{hasTake ? "Regrabar" : "Grabar"}</span>
                          </button>
                        )}

                        {hasTake && !isThisRecording && (
                          <>
                            <button
                              onClick={() => onTogglePlaySoloLine(line.id)}
                              className={`p-1.5 rounded-lg border transition-all ${
                                isThisPlaying
                                  ? "bg-amber-500 text-white border-amber-400"
                                  : "bg-neutral-800 border-white/10 text-neutral-300 hover:text-white"
                              }`}
                              title={
                                isThisPlaying ? "Pausar" : "Escuchar frase"
                              }
                            >
                              {isThisPlaying ? (
                                <svg
                                  className="w-3 h-3"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                </svg>
                              ) : (
                                <svg
                                  className="w-3 h-3"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              )}
                            </button>

                            <button
                              onClick={() => onDeleteDialogueTake(line.id)}
                              disabled={isRecording}
                              className="p-1.5 rounded-lg border border-white/10 text-neutral-400 hover:text-rose-400 hover:bg-rose-950/20"
                              title="Borrar toma de esta frase"
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
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* VISTA B: MODO ESCENA COMPLETA */
          <div className="flex-1 flex flex-col min-h-0 space-y-2 border-t pt-2 border-white/10">
            <span
              className={`text-[11px] font-mono block ${
                theme === "dark"
                  ? "text-neutral-400"
                  : "text-neutral-600 font-medium"
              }`}
            >
              Tomas Continuas Registradas:
            </span>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[140px]">
              {Object.keys(takesByCharacter).length === 0 ? (
                <p className="text-xs text-neutral-500 italic py-3 text-center">
                  Ninguna toma de corrida registrada aún.
                </p>
              ) : (
                Object.entries(takesByCharacter).map(([speakerId, take]) => {
                  const char = characters?.[speakerId];
                  const isSoloPlaying =
                    playingSoloCharacterId === Number(speakerId);

                  return (
                    <div
                      key={speakerId}
                      className="p-2.5 rounded-xl border border-white/10 bg-neutral-950/60 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className={`w-2 h-2 rounded-full ${char?.bg || "bg-cyan-500"}`}
                        />
                        <span className="font-bold text-xs truncate">
                          {char?.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            onTogglePlaySoloTake(Number(speakerId))
                          }
                          className={`p-1.5 rounded-lg border transition-all ${
                            isSoloPlaying
                              ? "bg-amber-500 text-white border-amber-400"
                              : "bg-neutral-800 border-white/10 text-neutral-300 hover:text-white"
                          }`}
                        >
                          {isSoloPlaying ? (
                            <svg
                              className="w-3 h-3"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                            </svg>
                          ) : (
                            <svg
                              className="w-3 h-3"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() =>
                            onDeleteCharacterTake(Number(speakerId))
                          }
                          className="p-1.5 rounded-lg border border-white/10 text-neutral-400 hover:text-rose-400"
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Botón de Grabación Escena Completa */}
            {isRecording && !recordingDialogueId ? (
              <button
                onClick={onStopRecordFull}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-[0_0_15px_rgba(244,63,94,0.5)] animate-pulse"
              >
                <span className="w-2.5 h-2.5 rounded-sm bg-white" />
                <span>Detener Grabación Completa</span>
              </button>
            ) : (
              <button
                onClick={onStartRecordFull}
                disabled={
                  selectedCharacterId === null ||
                  isRecording ||
                  countdown !== null
                }
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-md disabled:opacity-40 transition-all active:scale-95"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
                <span>Grabar a {activeChar?.name || "Personaje"} Corrido</span>
              </button>
            )}
          </div>
        )}

        {/* 3. Hardware, Conmutador Audio Guía y Master Mix */}
        <div className="pt-2 border-t border-white/10 space-y-2 shrink-0">
          {countdown !== null && (
            <div className="text-center py-1">
              <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest animate-pulse font-bold">
                Entrando a escena en...
              </span>
              <div className="text-3xl font-mono font-black text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]">
                {countdown}
              </div>
            </div>
          )}

          {/* Selector de Entrada de Micrófono */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border bg-neutral-950/30 border-white/5">
            <svg
              className="w-3.5 h-3.5 shrink-0 text-cyan-400"
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
              className="w-full bg-transparent text-[11px] font-mono text-neutral-300 focus:outline-none cursor-pointer truncate"
            >
              {audioDevices.length === 0 ? (
                <option value="" className="bg-neutral-900 text-neutral-400">
                  Micrófono del Sistema
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

          {/* Audio Original Guía */}
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl border bg-neutral-950/30 border-white/5 text-[11px] font-mono">
            <span className="text-neutral-400">Audio Original:</span>
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-neutral-900 border border-white/10">
              <button
                onClick={() => onChangeGuideAudioMode("mute")}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  guideAudioMode === "mute"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                Mute
              </button>
              <button
                onClick={() => onChangeGuideAudioMode("low")}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  guideAudioMode === "low"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                20%
              </button>
              <button
                onClick={() => onChangeGuideAudioMode("full")}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  guideAudioMode === "full"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                100%
              </button>
            </div>
          </div>

          {/* Botón Escuchar Mezcla Final */}
          <button
            onClick={onTogglePlayMix}
            disabled={totalRecordedCount === 0 || isRecording}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all border ${
              isPlayingMix
                ? "bg-amber-600 hover:bg-amber-500 border-amber-400 text-white shadow-[0_0_20px_rgba(217,119,6,0.5)]"
                : "bg-gradient-to-r from-teal-900/80 via-emerald-800/80 to-teal-900/80 hover:from-teal-800 hover:to-emerald-700 border-emerald-500/40 text-emerald-200"
            } disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-black/30">
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
              <span>
                {isPlayingMix ? "Pausar Mezcla" : "Escuchar Mezcla ADR"}
              </span>
            </div>

            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/40 text-emerald-300 border border-emerald-500/30">
              {totalRecordedCount}{" "}
              {recordingMode === "line" ? "frases" : "personajes"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
