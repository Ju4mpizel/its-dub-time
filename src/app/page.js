"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../components/Header";
import VideoPlayer from "../components/VideoPlayer";
import ScriptPanel from "../components/ScriptPanel";
import Timeline from "../components/Timeline";
import CharacterLegend from "../components/CharacterLegend";
import Toast from "../components/Toast";
import RecordingStudioPanel from "../components/RecordingStudioPanel";
import { useAudioRecorder } from "../hooks/useAudioRecorder";

const MAX_FILE_SIZE_MB = 4.5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-m4a",
];

const smoothEase = [0.16, 1, 0.3, 1];

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export default function Home() {
  const [videoSrc, setVideoSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [theme, setTheme] = useState("dark");
  const [toast, setToast] = useState(null);

  // Historial y Respaldo
  const originalDataRef = useRef(null);
  const [historyStack, setHistoryStack] = useState([]);

  // Panel de Grabación
  const [showRecordingStudio, setShowRecordingStudio] = useState(false);
  const [selectedCharacterId, setSelectedCharacterId] = useState(null);
  const [countdown, setCountdown] = useState(null);

  // MODOS DE GRABACIÓN: 'line' (Por Frase) | 'full' (Escena Completa)
  const [recordingMode, setRecordingMode] = useState("line");

  // Almacenamiento de Tomas
  const [takesByCharacter, setTakesByCharacter] = useState({}); // MODO FULL: { [speakerId]: { id, url } }
  const [takesByDialogue, setTakesByDialogue] = useState({}); // MODO LINE: { [dialogueId]: { id, url, start, end, speaker } }

  // Control de Reproducción Aislada
  const [playingSoloCharacterId, setPlayingSoloCharacterId] = useState(null);
  const [playingSoloDialogueId, setPlayingSoloDialogueId] = useState(null);
  const [isPlayingMix, setIsPlayingMix] = useState(false);

  // Registro de grabación activa por frase
  const [recordingDialogueId, setRecordingDialogueId] = useState(null);
  const activeRecordingTargetRef = useRef(null); // { id, end }

  // Pista de referencia (Audio original)
  const [guideAudioMode, setGuideAudioMode] = useState("mute");

  const {
    isRecording,
    startRecording,
    stopRecording,
    audioDevices,
    selectedDeviceId,
    setSelectedDeviceId,
  } = useAudioRecorder();

  const videoRef = useRef(null);
  const audioElementsRef = useRef({}); // Audios de tomas de personajes o frases

  const showToast = (message, type = "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const pushToHistory = useCallback(() => {
    setData((current) => {
      if (current) {
        setHistoryStack((prev) => [
          ...prev.slice(-25),
          JSON.parse(JSON.stringify(current)),
        ]);
      }
      return current;
    });
  }, []);

  const handleUndo = useCallback(() => {
    if (historyStack.length === 0) return;
    setHistoryStack((prev) => {
      const copy = [...prev];
      const previousState = copy.pop();
      setData(previousState);
      return copy;
    });
    showToast("Cambio deshecho.", "warning");
  }, [historyStack.length]);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === "z" &&
        !e.shiftKey
      ) {
        if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName))
          return;
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [handleUndo]);

  const handleResetToOriginal = () => {
    if (!originalDataRef.current) return;
    pushToHistory();
    setData(JSON.parse(JSON.stringify(originalDataRef.current)));
    setActiveId(null);
    showToast("Restaurado al guión original.", "success");
  };

  const applyGuideAudioLevel = (mode = guideAudioMode) => {
    if (!videoRef.current) return;
    if (mode === "mute") {
      videoRef.current.muted = true;
      videoRef.current.volume = 0;
    } else if (mode === "low") {
      videoRef.current.muted = false;
      videoRef.current.volume = 0.2;
    } else {
      videoRef.current.muted = false;
      videoRef.current.volume = 1.0;
    }
  };

  const handleGuideModeChange = (mode) => {
    setGuideAudioMode(mode);
    if (
      isPlayingMix ||
      playingSoloCharacterId !== null ||
      playingSoloDialogueId !== null
    ) {
      applyGuideAudioLevel(mode);
    }
  };

  const handleUpdateDialogueText = (dialogueId, newText) => {
    pushToHistory();
    setData((prev) => {
      if (!prev?.dialogues) return prev;
      return {
        ...prev,
        dialogues: prev.dialogues.map((d) =>
          d.id === dialogueId ? { ...d, text: newText } : d,
        ),
      };
    });
    showToast("Frase actualizada.", "success");
  };

  const handleReassignSpeaker = (dialogueId, newSpeakerId) => {
    pushToHistory();
    setData((prev) => {
      if (!prev?.dialogues) return prev;
      return {
        ...prev,
        dialogues: prev.dialogues.map((d) =>
          d.id === dialogueId ? { ...d, speaker: Number(newSpeakerId) } : d,
        ),
      };
    });
    showToast("Personaje reasignado.", "success");
  };

  const handleUpdateDialogueTimes = (dialogueId, newStart, newEnd) => {
    pushToHistory();
    setData((prev) => {
      if (!prev?.dialogues) return prev;
      const updated = prev.dialogues.map((d) => {
        if (d.id === dialogueId) {
          return {
            ...d,
            start: Number(newStart.toFixed(2)),
            end: Number(newEnd.toFixed(2)),
            timecode: `${formatTime(newStart)} - ${formatTime(newEnd)}`,
          };
        }
        return d;
      });
      return { ...prev, dialogues: updated.sort((a, b) => a.start - b.start) };
    });
    showToast("Rango de tiempo ajustado.", "success");
  };

  const handleAddDialogue = (speakerId, start, end) => {
    pushToHistory();
    const newId = Date.now();
    const newDialogue = {
      id: newId,
      speaker: Number(speakerId),
      start: Number(start.toFixed(2)),
      end: Number(end.toFixed(2)),
      text: "Nueva intervención (Doble clic para editar)",
      timecode: `${formatTime(start)} - ${formatTime(end)}`,
    };

    setData((prev) => {
      if (!prev?.dialogues) return prev;
      const nextDialogues = [...prev.dialogues, newDialogue].sort(
        (a, b) => a.start - b.start,
      );
      return { ...prev, dialogues: nextDialogues };
    });

    setActiveId(newId);
    showToast("Nuevo diálogo añadido.", "success");
  };

  const handleDeleteDialogue = (dialogueId) => {
    pushToHistory();
    setData((prev) => {
      if (!prev?.dialogues) return prev;
      return {
        ...prev,
        dialogues: prev.dialogues.filter((d) => d.id !== dialogueId),
      };
    });
    if (activeId === dialogueId) setActiveId(null);
    showToast("Bloque eliminado.", "warning");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type) && !file.name.endsWith(".mp4")) {
      showToast("Formato no soportado. Sube video o audio.", "error");
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      showToast(
        `El archivo pesa ${sizeMb} MB (Máx. ${MAX_FILE_SIZE_MB} MB).`,
        "error",
      );
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setVideoSrc(localUrl);
    setLoading(true);
    setData(null);
    setActiveId(null);
    setTakesByCharacter({});
    setTakesByDialogue({});
    setPlayingSoloCharacterId(null);
    setPlayingSoloDialogueId(null);
    setIsPlayingMix(false);
    setHistoryStack([]);
    originalDataRef.current = null;
    showToast("Procesando audio y detectando personajes...", "warning");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const rawText = await res.text();
      let json;
      try {
        json = JSON.parse(rawText);
      } catch (parseErr) {
        throw new Error(
          res.status === 413
            ? "El archivo supera el límite de Vercel (4.5 MB)."
            : res.status === 504
              ? "Tiempo de espera agotado. Prueba con una escena más breve."
              : `Error del servidor (${res.status})`,
        );
      }

      if (!res.ok)
        throw new Error(json.error || "Error al procesar el archivo");

      originalDataRef.current = JSON.parse(JSON.stringify(json));
      setData(json);

      if (json.characters && Object.keys(json.characters).length > 0) {
        setSelectedCharacterId(Number(Object.keys(json.characters)[0]));
      }
      showToast("¡Guión listo! Abre el Estudio ADR para doblar.", "success");
    } catch (err) {
      showToast(err.message || "Error al conectar con el servidor", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDialogue = (dialogue) => {
    setActiveId(dialogue.id);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = dialogue.start;
      setCurrentTime(dialogue.start);
    }
  };

  // Motor central de sincronización
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);

    if (data?.dialogues) {
      const current = data.dialogues.find(
        (d) => time >= d.start && time <= d.end,
      );
      if (current) setActiveId(current.id);
    }

    // AUTO-STOP EN MODO POR FRASE: Al llegar al final de la frase (+ 0.25s de margen), detiene la grabación
    if (isRecording && activeRecordingTargetRef.current) {
      if (time >= activeRecordingTargetRef.current.end + 0.25) {
        handleStopRecordLine();
        return;
      }
    }

    // Auto-stop al escuchar una frase individual
    if (playingSoloDialogueId !== null) {
      const currentDialogue = data?.dialogues?.find(
        (d) => d.id === playingSoloDialogueId,
      );
      if (currentDialogue && time >= currentDialogue.end + 0.2) {
        videoRef.current.pause();
        audioElementsRef.current[`line_${playingSoloDialogueId}`]?.pause();
        setPlayingSoloDialogueId(null);
        videoRef.current.muted = false;
        videoRef.current.volume = 1.0;
        return;
      }
    }

    // Sincronización en Mezcla Completa
    if (isPlayingMix) {
      if (recordingMode === "full") {
        Object.entries(takesByCharacter).forEach(([speakerId]) => {
          const audio = audioElementsRef.current[`char_${speakerId}`];
          if (!audio) return;
          if (Math.abs(audio.currentTime - time) > 0.15)
            audio.currentTime = time;
          if (videoRef.current.paused && !audio.paused) audio.pause();
          else if (!videoRef.current.paused && audio.paused)
            audio.play().catch(() => {});
        });
      } else {
        // En modo por frase: activa el audio solo cuando el tiempo entra en [start, end]
        Object.entries(takesByDialogue).forEach(([dId, take]) => {
          const audio = audioElementsRef.current[`line_${dId}`];
          if (!audio) return;

          const isWithin = time >= take.start && time <= take.end + 0.3;
          if (isWithin) {
            const expectedOffset = Math.max(0, time - take.start);
            if (Math.abs(audio.currentTime - expectedOffset) > 0.15) {
              audio.currentTime = expectedOffset;
            }
            if (!videoRef.current.paused && audio.paused) {
              audio.play().catch(() => {});
            }
          } else {
            if (!audio.paused) audio.pause();
          }
        });
      }
    }
  };

  const handleSeek = (timeInSeconds) => {
    setCurrentTime(timeInSeconds);
    if (videoRef.current) videoRef.current.currentTime = timeInSeconds;
  };

  const handleRenameSpeaker = (speakerId, newName) => {
    pushToHistory();
    setData((prev) => ({
      ...prev,
      characters: {
        ...prev.characters,
        [speakerId]: {
          ...prev.characters[speakerId],
          name: newName,
        },
      },
    }));
  };

  // --- LÓGICA DE GRABACIÓN: 1. MODO POR FRASE ---
  const handleStartRecordLine = (dialogue) => {
    if (!videoRef.current) return;

    // Pausar cualquier reproducción activa
    videoRef.current.pause();
    Object.values(audioElementsRef.current).forEach((a) => a?.pause());
    setIsPlayingMix(false);
    setPlayingSoloDialogueId(null);
    setPlayingSoloCharacterId(null);

    // Pre-roll: Comenzar 1.5s antes para que el actor agarre el ritmo
    const preRollStart = Math.max(0, dialogue.start - 1.5);
    videoRef.current.currentTime = preRollStart;
    videoRef.current.muted = true; // Sin eco durante grabación

    setRecordingDialogueId(dialogue.id);
    activeRecordingTargetRef.current = { id: dialogue.id, end: dialogue.end };

    let count = 3;
    setCountdown(count);

    const timer = setInterval(async () => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(timer);
        setCountdown(null);

        videoRef.current.play();
        try {
          await startRecording();
          showToast(
            `¡Grabando frase de ${data?.characters[dialogue.speaker]?.name}!`,
            "warning",
          );
        } catch (err) {
          showToast(err.message, "error");
          videoRef.current.pause();
          videoRef.current.muted = false;
          setRecordingDialogueId(null);
          activeRecordingTargetRef.current = null;
        }
      }
    }, 800);
  };

  const handleStopRecordLine = async () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.muted = false;
      videoRef.current.volume = 1.0;
    }

    const targetId =
      activeRecordingTargetRef.current?.id || recordingDialogueId;
    const result = await stopRecording();

    if (result && targetId) {
      const dialogue = data?.dialogues?.find((d) => d.id === targetId);
      setTakesByDialogue((prev) => ({
        ...prev,
        [targetId]: {
          id: Date.now(),
          url: result.url,
          start: dialogue?.start || 0,
          end: dialogue?.end || 0,
          speaker: dialogue?.speaker,
        },
      }));
      showToast("¡Toma de frase guardada!", "success");
    }

    setRecordingDialogueId(null);
    activeRecordingTargetRef.current = null;
  };

  const handleDeleteDialogueTake = (dialogueId) => {
    if (playingSoloDialogueId === dialogueId) {
      if (videoRef.current) videoRef.current.pause();
      setPlayingSoloDialogueId(null);
    }
    setTakesByDialogue((prev) => {
      const copy = { ...prev };
      delete copy[dialogueId];
      return copy;
    });
    showToast("Toma de frase descartada.", "warning");
  };

  const handleTogglePlaySoloLine = (dialogueId) => {
    if (!videoRef.current) return;

    if (playingSoloDialogueId === dialogueId) {
      videoRef.current.pause();
      audioElementsRef.current[`line_${dialogueId}`]?.pause();
      setPlayingSoloDialogueId(null);
      videoRef.current.muted = false;
      videoRef.current.volume = 1.0;
    } else {
      setIsPlayingMix(false);
      setPlayingSoloCharacterId(null);
      Object.values(audioElementsRef.current).forEach((a) => a?.pause());

      const dialogue = data?.dialogues?.find((d) => d.id === dialogueId);
      if (!dialogue) return;

      applyGuideAudioLevel();
      videoRef.current.currentTime = dialogue.start;
      videoRef.current.play();

      const audio = audioElementsRef.current[`line_${dialogueId}`];
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
      setPlayingSoloDialogueId(dialogueId);
    }
  };

  // --- LÓGICA DE GRABACIÓN: 2. MODO ESCENA COMPLETA ---
  const handleStartRecordFull = () => {
    if (!videoRef.current || selectedCharacterId === null) return;

    videoRef.current.pause();
    Object.values(audioElementsRef.current).forEach((a) => a?.pause());
    setIsPlayingMix(false);
    setPlayingSoloCharacterId(null);

    setTakesByCharacter((prev) => {
      const copy = { ...prev };
      delete copy[selectedCharacterId];
      return copy;
    });

    let count = 3;
    setCountdown(count);

    const timer = setInterval(async () => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(timer);
        setCountdown(null);

        videoRef.current.muted = true;
        videoRef.current.currentTime = 0;
        videoRef.current.play();

        try {
          await startRecording();
          showToast(
            `¡Grabando pase completo de ${data?.characters[selectedCharacterId]?.name}!`,
            "warning",
          );
        } catch (err) {
          showToast(err.message, "error");
          videoRef.current.pause();
          videoRef.current.muted = false;
        }
      }
    }, 1000);
  };

  const handleStopRecordFull = async () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.muted = false;
      videoRef.current.volume = 1.0;
    }

    const result = await stopRecording();
    if (result && selectedCharacterId !== null) {
      setTakesByCharacter((prev) => ({
        ...prev,
        [selectedCharacterId]: {
          id: Date.now(),
          url: result.url,
        },
      }));
      showToast(
        `¡Toma corrida de ${data?.characters[selectedCharacterId]?.name} lista!`,
        "success",
      );
    }
  };

  const handleDeleteCharacterTake = (speakerId) => {
    if (playingSoloCharacterId === speakerId) {
      if (videoRef.current) videoRef.current.pause();
      setPlayingSoloCharacterId(null);
    }
    setTakesByCharacter((prev) => {
      const copy = { ...prev };
      delete copy[speakerId];
      return copy;
    });
    showToast("Toma completa descartada.", "warning");
  };

  const handleTogglePlaySoloTake = (speakerId) => {
    if (!videoRef.current) return;

    if (playingSoloCharacterId === speakerId) {
      videoRef.current.pause();
      audioElementsRef.current[`char_${speakerId}`]?.pause();
      setPlayingSoloCharacterId(null);
      videoRef.current.muted = false;
      videoRef.current.volume = 1.0;
    } else {
      setIsPlayingMix(false);
      setPlayingSoloDialogueId(null);
      Object.values(audioElementsRef.current).forEach((a) => a?.pause());

      applyGuideAudioLevel();
      videoRef.current.currentTime = 0;
      videoRef.current.play();

      const audio = audioElementsRef.current[`char_${speakerId}`];
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
      setPlayingSoloCharacterId(speakerId);
    }
  };

  // --- REPRODUCCIÓN DE MEZCLA MAESTRA COMBINADA ---
  const handleTogglePlayMix = () => {
    if (!videoRef.current) return;

    if (isPlayingMix) {
      videoRef.current.pause();
      Object.values(audioElementsRef.current).forEach((a) => a?.pause());
      setIsPlayingMix(false);
      videoRef.current.muted = false;
      videoRef.current.volume = 1.0;
    } else {
      setPlayingSoloCharacterId(null);
      setPlayingSoloDialogueId(null);

      applyGuideAudioLevel();
      videoRef.current.currentTime = 0;
      videoRef.current.play();

      if (recordingMode === "full") {
        Object.entries(takesByCharacter).forEach(([speakerId]) => {
          const audio = audioElementsRef.current[`char_${speakerId}`];
          if (audio) {
            audio.currentTime = 0;
            audio.play().catch(() => {});
          }
        });
      }
      setIsPlayingMix(true);
    }
  };

  const activeFocusCharacterId = showRecordingStudio
    ? selectedCharacterId
    : null;

  return (
    <main
      className={`flex flex-col h-screen p-4 gap-3 overflow-hidden transition-colors duration-300 ${
        theme === "dark"
          ? "bg-[#0a0c10] text-neutral-100"
          : "bg-neutral-100 text-neutral-900"
      }`}
    >
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Elementos de audio para Modo Corrido */}
      {Object.entries(takesByCharacter).map(([speakerId, take]) => (
        <audio
          key={`char_${speakerId}`}
          ref={(el) => (audioElementsRef.current[`char_${speakerId}`] = el)}
          src={take.url}
          preload="auto"
        />
      ))}

      {/* Elementos de audio para Modo Por Frase */}
      {Object.entries(takesByDialogue).map(([dialogueId, take]) => (
        <audio
          key={`line_${dialogueId}`}
          ref={(el) => (audioElementsRef.current[`line_${dialogueId}`] = el)}
          src={take.url}
          preload="auto"
        />
      ))}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -15, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.5, ease: smoothEase }}
      >
        <Header
          loading={loading}
          videoSrc={videoSrc}
          onFileUpload={handleFileUpload}
          theme={theme}
          onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
          showRecordingStudio={showRecordingStudio}
          onToggleRecordingStudio={() =>
            setShowRecordingStudio((prev) => !prev)
          }
          canUndo={historyStack.length > 0}
          onUndo={handleUndo}
          hasOriginalData={!!originalDataRef.current}
          onResetToOriginal={handleResetToOriginal}
        />
      </motion.div>

      {/* Área Central */}
      <div className="flex-1 flex gap-3 min-h-0 overflow-hidden">
        {/* Contenedor Video Estabilizado */}
        <div
          className={`flex flex-col min-h-0 transition-[flex] duration-300 ease-out ${
            showRecordingStudio ? "flex-[5]" : "flex-1"
          }`}
        >
          <VideoPlayer
            videoRef={videoRef}
            videoSrc={videoSrc}
            currentTime={currentTime}
            onTimeUpdate={handleTimeUpdate}
            theme={theme}
          />
        </div>

        {/* Guión Técnico */}
        <motion.div
          layout="position"
          transition={{ duration: 0.35, ease: smoothEase }}
          className={`flex flex-col min-h-0 ${
            showRecordingStudio ? "flex-[4]" : "flex-1"
          }`}
        >
          <ScriptPanel
            data={data}
            activeId={activeId}
            onSelectDialogue={handleSelectDialogue}
            theme={theme}
            selectedCharacterId={activeFocusCharacterId}
            onUpdateDialogueText={handleUpdateDialogueText}
            onReassignSpeaker={handleReassignSpeaker}
          />
        </motion.div>

        {/* Panel de Grabación ADR Pro */}
        <AnimatePresence mode="popLayout">
          {showRecordingStudio && (
            <motion.div
              layout="position"
              initial={{ opacity: 0, x: 40, filter: "blur(6px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: 40, filter: "blur(6px)" }}
              transition={{ duration: 0.35, ease: smoothEase }}
              className="flex-[3.8] flex flex-col min-h-0 overflow-hidden"
            >
              <RecordingStudioPanel
                theme={theme}
                characters={data?.characters}
                dialogues={data?.dialogues}
                selectedCharacterId={selectedCharacterId}
                onSelectCharacter={(id) => setSelectedCharacterId(id)}
                isRecording={isRecording}
                countdown={countdown}
                recordingDialogueId={recordingDialogueId}
                onStartRecordFull={handleStartRecordFull}
                onStopRecordFull={handleStopRecordFull}
                onStartRecordLine={handleStartRecordLine}
                onStopRecordLine={handleStopRecordLine}
                takesByCharacter={takesByCharacter}
                takesByDialogue={takesByDialogue}
                recordingMode={recordingMode}
                onChangeRecordingMode={setRecordingMode}
                playingSoloCharacterId={playingSoloCharacterId}
                onTogglePlaySoloTake={handleTogglePlaySoloTake}
                playingSoloDialogueId={playingSoloDialogueId}
                onTogglePlaySoloLine={handleTogglePlaySoloLine}
                isPlayingMix={isPlayingMix}
                onTogglePlayMix={handleTogglePlayMix}
                onDeleteCharacterTake={handleDeleteCharacterTake}
                onDeleteDialogueTake={handleDeleteDialogueTake}
                guideAudioMode={guideAudioMode}
                onChangeGuideAudioMode={handleGuideModeChange}
                audioDevices={audioDevices}
                selectedDeviceId={selectedDeviceId}
                onSelectAudioDevice={setSelectedDeviceId}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Barra de personajes */}
      <CharacterLegend
        characters={data?.characters}
        onRenameSpeaker={handleRenameSpeaker}
        theme={theme}
      />

      {/* Timeline NLE */}
      <div className="shrink-0 w-full">
        <Timeline
          data={data}
          currentTime={currentTime}
          activeId={activeId}
          onSelectDialogue={handleSelectDialogue}
          onSeek={handleSeek}
          theme={theme}
          selectedCharacterId={activeFocusCharacterId}
          takesByCharacter={takesByCharacter}
          onUpdateDialogueTimes={handleUpdateDialogueTimes}
          onAddDialogue={handleAddDialogue}
          onDeleteDialogue={handleDeleteDialogue}
        />
      </div>
    </main>
  );
}
