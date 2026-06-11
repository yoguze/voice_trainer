"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { analyzeRecording } from "@/lib/audio/analyser";
import { useVoiceTrainerStore } from "@/stores/voice-trainer-store";
import { WaveVisualizer } from "./WaveVisualizer";

type RecorderProps = {
  locale: string;
};

export function Recorder({ locale }: RecorderProps) {
  const t = useTranslations("practice");
  const router = useRouter();
  const voiceType = useVoiceTrainerStore((state) => state.voiceType);
  const setLatestResult = useVoiceTrainerStore((state) => state.setLatestResult);
  const getTargets = useVoiceTrainerStore((state) => state.getTargets);

  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const cleanup = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
    analyserRef.current = null;
    setAnalyser(null);
    if (audioContextRef.current?.state !== "closed") {
      void audioContextRef.current?.close();
    }
    audioContextRef.current = null;
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const startRecording = async () => {
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 4096;
      source.connect(analyserNode);
      analyserRef.current = analyserNode;
      setAnalyser(analyserNode);

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsAnalyzing(true);
        try {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          const targets = getTargets();
          const result = await analyzeRecording(blob, voiceType, targets);
          setLatestResult(result);
          router.push(`/${locale}/result`);
        } catch {
          setError(t("micError"));
        } finally {
          setIsAnalyzing(false);
          cleanup();
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      setError(t("micError"));
      cleanup();
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleToggle = () => {
    if (isAnalyzing) return;
    if (isRecording) {
      stopRecording();
    } else {
      void startRecording();
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full"
      >
        <WaveVisualizer analyser={analyser} isRecording={isRecording} />
      </motion.div>

      <motion.button
        type="button"
        onClick={handleToggle}
        disabled={isAnalyzing}
        whileHover={{ scale: isAnalyzing ? 1 : 1.05 }}
        whileTap={{ scale: isAnalyzing ? 1 : 0.95 }}
        animate={
          isRecording
            ? { scale: [1, 1.06, 1], boxShadow: "0 0 0 0 rgba(248, 113, 113, 0.4)" }
            : { scale: 1 }
        }
        transition={
          isRecording
            ? { repeat: Infinity, duration: 1.2, ease: "easeInOut" }
            : { type: "spring", stiffness: 400, damping: 20 }
        }
        className={`flex h-28 w-28 items-center justify-center rounded-full text-4xl shadow-lg ${
          isRecording
            ? "bg-red-400 text-white"
            : "bg-gradient-to-br from-pink-400 to-purple-400 text-white"
        } disabled:cursor-not-allowed disabled:opacity-60`}
        aria-label={isRecording ? t("tapToStop") : t("tapToStart")}
      >
        🎙️
      </motion.button>

      <p className="text-sm text-slate-500">
        {isAnalyzing
          ? t("analyzing")
          : isRecording
            ? t("tapToStop")
            : t("tapToStart")}
      </p>

      <AnimatePresence>
        {error ? (
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600"
          >
            {error}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
