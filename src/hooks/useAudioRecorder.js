"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // 1. Obtener lista de micrófonos disponibles
  const updateAudioDevices = useCallback(async () => {
    try {
      if (!navigator?.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const inputs = devices.filter((d) => d.kind === "audioinput");
      setAudioDevices(inputs);

      // Si no hay seleccionado o el seleccionado ya no existe, tomar el primero o default
      if (inputs.length > 0) {
        setSelectedDeviceId((prev) => {
          const exists = inputs.some((d) => d.deviceId === prev);
          return exists && prev ? prev : inputs[0].deviceId;
        });
      }
    } catch (err) {
      console.warn("No se pudieron enumerar los micrófonos:", err);
    }
  }, []);

  useEffect(() => {
    updateAudioDevices();

    // Escuchar si conectan o desconectan auriculares/micrófono USB
    if (navigator?.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener(
        "devicechange",
        updateAudioDevices,
      );
      return () => {
        navigator.mediaDevices.removeEventListener(
          "devicechange",
          updateAudioDevices,
        );
      };
    }
  }, [updateAudioDevices]);

  // 2. Iniciar grabación apuntando al micrófono elegido
  const startRecording = async () => {
    try {
      const audioConstraints = selectedDeviceId
        ? {
            deviceId: { exact: selectedDeviceId },
            echoCancellation: true,
            noiseSuppression: true,
          }
        : { echoCancellation: true, noiseSuppression: true };

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
      });

      // Tras obtener permiso, las etiquetas (labels) de los micros ya son visibles: refrescamos la lista
      updateAudioDevices();

      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100);
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      throw new Error("No se pudo acceder al micrófono seleccionado.");
    }
  };

  const stopRecording = () => {
    return new Promise((resolve) => {
      if (
        !mediaRecorderRef.current ||
        mediaRecorderRef.current.state === "inactive"
      ) {
        setIsRecording(false);
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mediaRecorderRef.current.mimeType || "audio/webm",
        });
        const url = URL.createObjectURL(blob);

        mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
        setIsRecording(false);
        resolve({ blob, url });
      };

      mediaRecorderRef.current.stop();
    });
  };

  return {
    isRecording,
    startRecording,
    stopRecording,
    audioDevices,
    selectedDeviceId,
    setSelectedDeviceId,
  };
}
