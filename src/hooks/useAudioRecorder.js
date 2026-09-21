"use client";

import { useState, useRef } from "react";

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
      throw new Error("No se pudo acceder al micrófono. Permite el acceso.");
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

        // Apagar micro
        mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
        setIsRecording(false);
        resolve({ blob, url });
      };

      mediaRecorderRef.current.stop();
    });
  };

  return { isRecording, startRecording, stopRecording };
}
