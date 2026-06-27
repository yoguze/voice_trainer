import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { buildVoiceTargets, getVoiceProfileSelection } from "@/lib/targets";
import type {
  PracticeResult,
  VoiceProfileId,
  VoiceTargets,
  VoiceTypeSelection,
} from "@/types";

const RESULT_KEY = "voice-trainer-latest-result";

const DEFAULT_VOICE_TYPE: VoiceTypeSelection = {
  profileId: "natural",
  pitchType: 3,
  qualityType: 3,
  intonationType: 3,
};

type VoiceTrainerState = {
  voiceType: VoiceTypeSelection;
  latestResult: PracticeResult | null;
  hasHydrated: boolean;
  setVoiceProfile: (profileId: VoiceProfileId) => void;
  setVoiceType: (patch: Partial<VoiceTypeSelection>) => void;
  setLatestResult: (result: PracticeResult) => void;
  clearLatestResult: () => void;
  setHasHydrated: (value: boolean) => void;
  getTargets: () => VoiceTargets;
};

export const useVoiceTrainerStore = create<VoiceTrainerState>()(
  persist(
    (set, get) => ({
      voiceType: DEFAULT_VOICE_TYPE,
      latestResult: null,
      hasHydrated: false,

      setVoiceProfile: (profileId) =>
        set((state) => ({
          voiceType: getVoiceProfileSelection(profileId, state.voiceType),
        })),

      setVoiceType: (patch) =>
        set((state) => ({
          voiceType: { ...state.voiceType, ...patch, profileId: "custom" },
        })),

      setLatestResult: (result) => {
        sessionStorage.setItem(RESULT_KEY, JSON.stringify(result));
        set({ latestResult: result });
      },

      clearLatestResult: () => {
        sessionStorage.removeItem(RESULT_KEY);
        set({ latestResult: null });
      },

      setHasHydrated: (value) => set({ hasHydrated: value }),

      getTargets: () => buildVoiceTargets(get().voiceType),
    }),
    {
      name: "voice-trainer-voice-type",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ voiceType: state.voiceType }),
    },
  ),
);

export function useVoiceType() {
  return useVoiceTrainerStore((state) => state.voiceType);
}

export function useLatestResult() {
  return useVoiceTrainerStore((state) => state.latestResult);
}

export function useStoreHydrated() {
  return useVoiceTrainerStore((state) => state.hasHydrated);
}
