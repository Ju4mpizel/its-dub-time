"use client";

import { useState, useRef } from "react";
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

const smoothEase = [0.22, 1, 0.36, 1];

export default function Home() {
  const [videoSrc, setVideoSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [theme, setTheme] = useState("dark");
  const [toast, setToast] = useState(null);

  const [showRecordingStudio, setShowRecordingStudio] = useState(false);
  const [selectedCharacterId, setSelectedCharacterId] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [takesByCharacter, setTakesByCharacter] = useState({});
  const [playingSoloCharacterId, setPlayingSoloCharacterId] = useState(null);
  const [isPlayingMix, setIsPlayingMix] = useState(false);

  const { isRecording, startRecording, stopRecording } = useAudioRecorder();

  const videoRef = useRef(null);
  const audioElementsRef = useRef({});

  const showToast = (message, type = "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
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
    setPlayingSoloCharacterId(null);
    setIsPlayingMix(false);
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

      setData(json);
      if (json.characters && Object.keys(json.characters).length > 0) {
        setSelectedCharacterId(Number(Object.keys(json.characters)[0]));
      }
      showToast(
        "¡Guión listo! Abre 'Estudio ADR' para doblar tus personajes.",
        "success",
      );
    } catch (err) {
      showToast(err.message || "Error al conectar con el servidor", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDialogue = (dialogue) => {
    setActiveId(dialogue.id);
    if (videoRef.current) {
      videoRef.current.currentTime = dialogue.start;
      videoRef.current.play();
    }
  };

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

    if (isPlayingMix || playingSoloCharacterId !== null) {
      if (!videoRef.current.muted) {
        videoRef.current.muted = true;
      }
    }

    if (isPlayingMix) {
      Object.values(audioElementsRef.current).forEach((audio) => {
        if (!audio) return;
        if (Math.abs(audio.currentTime - time) > 0.15) {
          audio.currentTime = time;
        }
        if (videoRef.current.paused && !audio.paused) {
          audio.pause();
        } else if (!videoRef.current.paused && audio.paused) {
          audio.play().catch(() => {});
        }
      });
    }

    if (playingSoloCharacterId !== null) {
      const soloAudio = audioElementsRef.current[playingSoloCharacterId];
      if (soloAudio) {
        if (Math.abs(soloAudio.currentTime - time) > 0.15) {
          soloAudio.currentTime = time;
        }
        if (videoRef.current.paused && !soloAudio.paused) {
          soloAudio.pause();
        } else if (!videoRef.current.paused && soloAudio.paused) {
          soloAudio.play().catch(() => {});
        }
      }
    }
  };

  const handleSeek = (timeInSeconds) => {
    setCurrentTime(timeInSeconds);
    if (videoRef.current) videoRef.current.currentTime = timeInSeconds;
    Object.values(audioElementsRef.current).forEach((audio) => {
      if (audio) audio.currentTime = timeInSeconds;
    });
  };

  const handleRenameSpeaker = (speakerId, newName) => {
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

  const handleStartRecord = () => {
    if (!videoRef.current) return;
    if (selectedCharacterId === null) {
      showToast("Selecciona un personaje en el panel.", "warning");
      return;
    }

    if (isPlayingMix || playingSoloCharacterId !== null) {
      videoRef.current.pause();
      Object.values(audioElementsRef.current).forEach((a) => a?.pause());
      setIsPlayingMix(false);
      setPlayingSoloCharacterId(null);
    }

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
            `¡Grabando a ${data?.characters[selectedCharacterId]?.name}!`,
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

  const handleStopRecord = async () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.muted = false;
    }

    const result = await stopRecording();
    if (result && selectedCharacterId !== null) {
      const takeData = {
        id: Date.now(),
        url: result.url,
      };

      setTakesByCharacter((prev) => ({
        ...prev,
        [selectedCharacterId]: takeData,
      }));

      showToast(
        `¡Toma de ${data?.characters[selectedCharacterId]?.name} lista!`,
        "success",
      );
    }
  };

  const handleDeleteTake = (speakerId) => {
    if (playingSoloCharacterId === speakerId) {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.muted = false;
      }
      setPlayingSoloCharacterId(null);
    }

    setTakesByCharacter((prev) => {
      const copy = { ...prev };
      delete copy[speakerId];
      return copy;
    });

    showToast("Toma descartada correctamente.", "warning");
  };

  const handleTogglePlaySoloTake = (speakerId) => {
    if (!videoRef.current) return;

    if (playingSoloCharacterId === speakerId) {
      videoRef.current.pause();
      audioElementsRef.current[speakerId]?.pause();
      setPlayingSoloCharacterId(null);
      videoRef.current.muted = false;
    } else {
      setIsPlayingMix(false);
      Object.values(audioElementsRef.current).forEach((a) => a?.pause());

      videoRef.current.muted = true;
      videoRef.current.currentTime = 0;
      videoRef.current.play();

      const audio = audioElementsRef.current[speakerId];
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
      setPlayingSoloCharacterId(speakerId);
    }
  };

  const handleTogglePlayMix = () => {
    if (!videoRef.current) return;

    if (isPlayingMix) {
      videoRef.current.pause();
      Object.values(audioElementsRef.current).forEach((a) => a?.pause());
      setIsPlayingMix(false);
      videoRef.current.muted = false;
    } else {
      setPlayingSoloCharacterId(null);

      videoRef.current.muted = true;
      videoRef.current.currentTime = 0;
      videoRef.current.play();

      Object.values(audioElementsRef.current).forEach((a) => {
        if (a) {
          a.currentTime = 0;
          a.play().catch(() => {});
        }
      });
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

      {Object.entries(takesByCharacter).map(([speakerId, take]) => (
        <audio
          key={speakerId}
          ref={(el) => (audioElementsRef.current[speakerId] = el)}
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
        />
      </motion.div>

      {/* Área Central: Flexbox animado sin saltos bruscos */}
      <div className="flex-1 flex gap-3 min-h-0 overflow-hidden">
        {/* VideoPlayer */}
        <motion.div
          layout
          transition={{ duration: 0.35, ease: smoothEase }}
          className={`flex flex-col min-h-0 ${
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
        </motion.div>

        {/* ScriptPanel */}
        <motion.div
          layout
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
          />
        </motion.div>

        {/* Panel de Grabación ADR */}
        <AnimatePresence mode="popLayout">
          {showRecordingStudio && (
            <motion.div
              layout
              initial={{ opacity: 0, x: 40, filter: "blur(6px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: 40, filter: "blur(6px)" }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="flex-[3.5] flex flex-col min-h-0 overflow-hidden"
            >
              <RecordingStudioPanel
                theme={theme}
                characters={data?.characters}
                selectedCharacterId={selectedCharacterId}
                onSelectCharacter={(id) => setSelectedCharacterId(id)}
                isRecording={isRecording}
                countdown={countdown}
                onStartRecord={handleStartRecord}
                onStopRecord={handleStopRecord}
                takesByCharacter={takesByCharacter}
                playingSoloCharacterId={playingSoloCharacterId}
                onTogglePlaySoloTake={handleTogglePlaySoloTake}
                isPlayingMix={isPlayingMix}
                onTogglePlayMix={handleTogglePlayMix}
                onDeleteTake={handleDeleteTake}
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

      {/* Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 15, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.5, delay: 0.1, ease: smoothEase }}
      >
        <Timeline
          data={data}
          currentTime={currentTime}
          activeId={activeId}
          onSelectDialogue={handleSelectDialogue}
          onSeek={handleSeek}
          theme={theme}
          selectedCharacterId={activeFocusCharacterId}
          takesByCharacter={takesByCharacter}
        />
      </motion.div>
    </main>
  );
}
