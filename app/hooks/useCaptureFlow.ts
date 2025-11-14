import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { captureStore, selectCurrentStep } from '../store/captureStore';
import { OrientationData } from './useDeviceOrientation';
import { storageService } from '../services/storageService';
import { CaptureResult, StepConfig, StepId } from '../types/capture';
import { orientationService } from '../services/orientationService';
import { STEPS } from '../config/stepsConfig';

const STABILITY_DURATION_MS = 1500;

export interface CaptureFlowState {
  currentStepIndex: number;
  currentStep: StepConfig;
  capturedImages: Map<StepId, CaptureResult>;
  isInCountdown: boolean;
  countdownValue: number | null;
  canAutoCapture: boolean;
  autoCaptureRequested: boolean;
  isComplete: boolean;
}

export interface CaptureFlowActions {
  startCountdown: () => void;
  cancelCountdown: () => void;
  completeCapture: (result: CaptureResult) => void;
  goToStep: (index: number) => void;
  retakeStep: (stepId: StepId) => void;
  acknowledgeAutoCapture: () => void;
}

export function useCaptureFlow(orientation: OrientationData) {
  const storeState = captureStore((state) => ({
    currentStepIndex: state.currentStepIndex,
    currentStep: selectCurrentStep(state),
    captures: state.captures,
    setCountdown: state.setCountdown,
    isCountdownActive: state.isCountdownActive,
    countdownValue: state.countdownValue,
    nextStep: state.nextStep,
    retake: state.retake,
    setCurrentStepIndex: state.setCurrentStepIndex
  }));

  const capturedImages = useMemo(() => {
    const map = new Map<StepId, CaptureResult>();
    storeState.captures.forEach((capture) => map.set(capture.stepId, capture));
    return map;
  }, [storeState.captures]);

  useEffect(() => {
    storageService.initializeSession(captureStore.getState().sessionId);
  }, []);

  const [autoCaptureRequested, setAutoCaptureRequested] = useState(false);
  const stabilityTimeout = useRef<NodeJS.Timeout | null>(null);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);
  const countdownValue = storeState.countdownValue;
  const isInCountdown = storeState.isCountdownActive;

  const currentStep = storeState.currentStep ?? STEPS[0];
  const { targetOrientation, stabilityThreshold } = currentStep;

  const isWithinTolerance = useMemo(() => {
    return orientationService.isWithinTolerance(
      { pitch: orientation.pitch, roll: orientation.roll },
      { pitch: targetOrientation.pitch, roll: targetOrientation.roll },
      targetOrientation.tolerance
    );
  }, [orientation.pitch, orientation.roll, targetOrientation]);

  const isStableEnough = orientation.angularVelocity < stabilityThreshold;

  const clearStabilityTimeout = () => {
    if (stabilityTimeout.current) {
      clearTimeout(stabilityTimeout.current);
      stabilityTimeout.current = null;
    }
  };

  const clearCountdownInterval = () => {
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
      countdownInterval.current = null;
    }
  };

  const cancelCountdown = useCallback(() => {
    clearCountdownInterval();
    captureStore.getState().setCountdown(false, null);
    setAutoCaptureRequested(false);
  }, []);

  useEffect(() => {
    if (!currentStep.requiresStability) {
      return;
    }

    if (isWithinTolerance && isStableEnough && !isInCountdown && !stabilityTimeout.current) {
      stabilityTimeout.current = setTimeout(() => {
        captureStore.getState().setCountdown(true, 3);
      }, STABILITY_DURATION_MS);
    }

    if (!isWithinTolerance || !isStableEnough) {
      clearStabilityTimeout();
      if (isInCountdown) {
        cancelCountdown();
      }
    }

    return () => {
      clearStabilityTimeout();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWithinTolerance, isStableEnough, isInCountdown, currentStep.requiresStability]);

  useEffect(() => {
    if (!isInCountdown) {
      clearCountdownInterval();
      return;
    }

    let counter = 3;
    captureStore.getState().setCountdown(true, counter);
    countdownInterval.current = setInterval(() => {
      counter -= 1;
      if (counter > 0) {
        captureStore.getState().setCountdown(true, counter);
      } else {
        clearCountdownInterval();
        captureStore.getState().setCountdown(false, null);
        setAutoCaptureRequested(true);
      }
    }, 1000);

    return () => {
      clearCountdownInterval();
    };
  }, [isInCountdown]);

  const startCountdown = useCallback(() => {
    clearStabilityTimeout();
    captureStore.getState().setCountdown(true, 3);
  }, []);

  const completeCapture = useCallback((result: CaptureResult) => {
    const existing = captureStore.getState().captures.filter((item) => item.stepId !== result.stepId);
    const updated = [...existing, result];
    captureStore.getState().setCaptures(updated);
    storageService.updateSession({
      sessionId: captureStore.getState().sessionId,
      startTime: captureStore.getState().sessionStartTime,
      lastUpdateTime: Date.now(),
      captures: updated,
      isComplete: updated.length === captureStore.getState().steps.length
    });
    captureStore.getState().nextStep();
    setAutoCaptureRequested(false);
  }, []);

  const goToStep = useCallback((index: number) => {
    captureStore.getState().setCurrentStepIndex(index);
  }, []);

  const retakeStep = useCallback((stepId: StepId) => {
    captureStore.getState().retake(stepId);
  }, []);

  const acknowledgeAutoCapture = useCallback(() => setAutoCaptureRequested(false), []);

  const canAutoCapture = isWithinTolerance && isStableEnough && !isInCountdown;

  const totalSteps = captureStore.getState().steps.length;

  const state: CaptureFlowState = {
    currentStepIndex: storeState.currentStepIndex,
    currentStep,
    capturedImages,
    isInCountdown,
    countdownValue,
    canAutoCapture,
    autoCaptureRequested,
    isComplete: capturedImages.size === totalSteps
  };

  const actions: CaptureFlowActions = {
    startCountdown,
    cancelCountdown,
    completeCapture,
    goToStep,
    retakeStep,
    acknowledgeAutoCapture
  };

  return { state, actions };
}
