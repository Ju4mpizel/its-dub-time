"use client";

import { useState, useRef } from "react";
import Header from "../components/Header";
import VideoPlayer from "../components/VideoPlayer";
import ScriptPanel from "../components/ScriptPanel";
import Timeline from "../components/Timeline";
import CharacterLegend from "../components/CharacterLegend";
import Toast from "../components/Toast";

const MAX_FILE_SIZE_MB = 25;
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

export default function Home() {
  const [videoSrc, setVideoSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [theme, setTheme] = useState("dark"); // "dark" | "light"
  const [toast, setToast] = useState(null);

  const videoRef = useRef(null);

  const showToast = (message, type = "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Validación de Formato
    if (!ALLOWED_TYPES.includes(file.type) && !file.name.endsWith(".mp4")) {
      showToast(
        "Formato no soportado. Sube un archivo de video (MP4, WEBM, MOV) o audio (MP3, WAV).",
        "error",
      );
      return;
    }

    // 2. Validación de Tamaño (Máximo 25 MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      showToast(
        `El archivo pesa ${sizeMb} MB. El límite máximo para análisis rápido es de ${MAX_FILE_SIZE_MB} MB.`,
        "error",
      );
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setVideoSrc(localUrl);
    setLoading(true);
    setData(null);
    setActiveId(null);
    showToast("Procesando audio y detectando personajes...", "warning");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok)
        throw new Error(json.error || "Error al procesar el archivo");

      setData(json);
      showToast("¡Timecodes y guión generados con éxito!", "success");
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
      if (current) {
        setActiveId(current.id);
      }
    }
  };

  const handleSeek = (timeInSeconds) => {
    setCurrentTime(timeInSeconds);
    if (videoRef.current) {
      videoRef.current.currentTime = timeInSeconds;
    }
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

  return (
    <main
      className={`flex flex-col h-screen p-4 gap-4 overflow-hidden transition-colors duration-300 ${
        theme === "dark"
          ? "bg-[#090a0f] text-neutral-100"
          : "bg-neutral-100 text-neutral-900"
      }`}
    >
      <Toast toast={toast} onClose={() => setToast(null)} />

      <Header
        loading={loading}
        videoSrc={videoSrc}
        onFileUpload={handleFileUpload}
        theme={theme}
        onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
        <VideoPlayer
          videoRef={videoRef}
          videoSrc={videoSrc}
          currentTime={currentTime}
          onTimeUpdate={handleTimeUpdate}
          theme={theme}
        />

        <ScriptPanel
          data={data}
          activeId={activeId}
          onSelectDialogue={handleSelectDialogue}
          theme={theme}
        />
      </div>

      <CharacterLegend
        characters={data?.characters}
        onRenameSpeaker={handleRenameSpeaker}
        theme={theme}
      />

      <Timeline
        data={data}
        currentTime={currentTime}
        activeId={activeId}
        onSelectDialogue={handleSelectDialogue}
        onSeek={handleSeek}
        theme={theme}
      />
    </main>
  );
}
