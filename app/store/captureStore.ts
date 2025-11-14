import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { nanoid } from 'nanoid/non-secure';
import { CaptureResult, StepConfig, StepId } from '../types/capture';
import { STEPS } from '../config/stepsConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CaptureState {
  sessionId: string;
  sessionStartTime: number;
  steps: StepConfig[];
  currentStepIndex: number;
  captures: CaptureResult[];
  isCountdownActive: boolean;
  countdownValue: number | null;
  autoCaptureEnabled: boolean;
  setCountdown: (active: boolean, value: number | null) => void;
  setCurrentStepIndex: (index: number) => void;
  setCaptures: (captures: CaptureResult[]) => void;
  nextStep: () => void;
  retake: (stepId: StepId) => void;
  reset: () => void;
  hydrate: (session: { sessionId: string; captures: CaptureResult[]; isComplete: boolean }) => void;
}

export const captureStore = create<CaptureState>()(
  persist(
    (set, get) => ({
      sessionId: nanoid(),
      sessionStartTime: Date.now(),
      steps: STEPS,
      currentStepIndex: 0,
      captures: [],
      isCountdownActive: false,
      countdownValue: null,
      autoCaptureEnabled: true,
      setCountdown: (active, value) => set({ isCountdownActive: active, countdownValue: value }),
      setCurrentStepIndex: (index) => set({ currentStepIndex: index }),
      setCaptures: (captures) => set({ captures }),
      nextStep: () => {
        const { currentStepIndex, steps } = get();
        if (currentStepIndex < steps.length - 1) {
          set({ currentStepIndex: currentStepIndex + 1 });
        }
      },
      retake: (stepId) => {
        const filtered = get().captures.filter((capture) => capture.stepId !== stepId);
        set({ captures: filtered, currentStepIndex: get().steps.findIndex((step) => step.id === stepId) });
      },
      reset: () =>
        set({
          sessionId: nanoid(),
          sessionStartTime: Date.now(),
          captures: [],
          currentStepIndex: 0,
          countdownValue: null,
          isCountdownActive: false
        }),
      hydrate: (session) => {
        set({
          sessionId: session.sessionId,
          sessionStartTime: session.sessionId ? session.startTime : Date.now(),
          captures: session.captures,
          currentStepIndex: Math.min(
            session.captures.length,
            get().steps.length - 1
          )
        });
      }
    }),
    {
      name: 'capture-store',
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
);

export const selectCurrentStep = (state: CaptureState) => state.steps[state.currentStepIndex];
