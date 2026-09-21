"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import Header from "../components/Header";
import VideoPlayer from "../components/VideoPlayer";
import ScriptPanel from "../components/ScriptPanel";
import Timeline from "../components/Timeline";
import CharacterLegend from "../components/CharacterLegend";
import Toast from "../components/Toast";

// Límite optimizado para Vercel Serverless
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

// Curva moderna de desaceleración suave estilo suite profesional
const smoothEase = [0.22, 1, 0.36, 1];

export default function Home() {
  const [videoSrc, setVideoSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [theme, setTheme] = useState("dark");
  const [toast, setToast] = useState(null);

  const videoRef = useRef(null);

  const showToast = (message, type = "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type) && !file.name.endsWith(".mp4")) {
      showToast(
        "Formato no soportado. Sube un archivo de video (MP4, WEBM, MOV) o audio (MP3, WAV).",
        "error",
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      showToast(
        `El archivo pesa ${sizeMb} MB. En Vercel el límite seguro es de ${MAX_FILE_SIZE_MB} MB (Usa clips cortos o solo audio .mp3).`,
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

      // Leer como texto primero para evitar el fallo si Vercel devuelve HTML de error
      const rawText = await res.text();
      let json;
      try {
        json = JSON.parse(rawText);
      } catch (parseErr) {
        throw new Error(
          res.status === 413
            ? "El archivo supera el límite de carga de Vercel (máx 4.5 MB). Usa un clip más corto o un archivo .mp3."
            : res.status === 504
              ? "El análisis tardó demasiado (timeout en Vercel). Prueba con una escena más breve."
              : `Error del servidor (${res.status}): No se pudo procesar la respuesta.`,
        );
      }

      if (!res.ok) {
        throw new Error(json.error || "Error al procesar el archivo");
      }

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

      {/* 1. Header: Despliegue horizontal elegante con desenfoque */}
      <motion.div
        initial={{ opacity: 0, x: -30, filter: "blur(6px)" }}
        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.6, ease: smoothEase }}
      >
        <Header
          loading={loading}
          videoSrc={videoSrc}
          onFileUpload={handleFileUpload}
          theme={theme}
          onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
        />
      </motion.div>

      {/* 2. Área Central: Video y Guión */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
        {/* VideoPlayer: Emergente vertical desde abajo */}
        <motion.div
          initial={{ opacity: 0, y: 35, scale: 0.98, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.7, delay: 0.15, ease: smoothEase }}
          className="flex flex-col min-h-0"
        >
          <VideoPlayer
            videoRef={videoRef}
            videoSrc={videoSrc}
            currentTime={currentTime}
            onTimeUpdate={handleTimeUpdate}
            theme={theme}
          />
        </motion.div>

        {/* ScriptPanel: Deslizamiento desde la izquierda hacia la derecha */}
        <motion.div
          initial={{ opacity: 0, x: -35, scale: 0.98, filter: "blur(8px)" }}
          animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.7, delay: 0.25, ease: smoothEase }}
          className="flex flex-col min-h-0"
        >
          <ScriptPanel
            data={data}
            activeId={activeId}
            onSelectDialogue={handleSelectDialogue}
            theme={theme}
          />
        </motion.div>
      </div>

      {/* 3. Barra de Personajes */}
      <CharacterLegend
        characters={data?.characters}
        onRenameSpeaker={handleRenameSpeaker}
        theme={theme}
      />

      {/* 4. Timeline: Entrada horizontal suave con desenfoque progresivo */}
      <motion.div
        initial={{ opacity: 0, x: -40, filter: "blur(6px)" }}
        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.75, delay: 0.35, ease: smoothEase }}
      >
        <Timeline
          data={data}
          currentTime={currentTime}
          activeId={activeId}
          onSelectDialogue={handleSelectDialogue}
          onSeek={handleSeek}
          theme={theme}
        />
      </motion.div>
    </main>
  );
}
