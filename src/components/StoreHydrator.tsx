"use client";

import { useEffect } from "react";
import { useVoiceTrainerStore } from "@/stores/voice-trainer-store";
import type { PracticeResult } from "@/types";

const RESULT_KEY = "voice-trainer-latest-result";

export function StoreHydrator() {
  const setHasHydrated = useVoiceTrainerStore((state) => state.setHasHydrated);

  useEffect(() => {
    const raw = sessionStorage.getItem(RESULT_KEY);
    if (raw) {
      try {
        useVoiceTrainerStore.setState({
          latestResult: JSON.parse(raw) as PracticeResult,
        });
      } catch {
        sessionStorage.removeItem(RESULT_KEY);
      }
    }
    setHasHydrated(true);
  }, [setHasHydrated]);

  return null;
}
