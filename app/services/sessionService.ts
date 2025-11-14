import { captureStore } from '../store/captureStore';
import { storageService } from './storageService';
import { CaptureResult, CaptureSession } from '../types/capture';

export async function restoreSession() {
  const saved = await storageService.loadSession();
  if (!saved) {
    return null;
  }
  hydrateStoreFromSession(saved);
  return saved;
}

export function hydrateStoreFromSession(session: CaptureSession) {
  captureStore.getState().hydrate(session);
}

export async function persistCapture(capture: CaptureResult) {
  await storageService.updateSession({
    sessionId: captureStore.getState().sessionId,
    startTime: captureStore.getState().sessionStartTime,
    lastUpdateTime: Date.now(),
    captures: captureStore.getState().captures,
    isComplete: captureStore.getState().captures.length === captureStore.getState().steps.length
  });
}

export async function clearSession() {
  await storageService.clearSession();
}
