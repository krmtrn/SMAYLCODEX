import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { captureStore } from '../store/captureStore';
import { CaptureResult, CaptureSession, StepId } from '../types/capture';
import { checkImageQuality, compressImage, createThumbnail } from '../utils/imageUtils';
import { OrientationData } from '../hooks/useDeviceOrientation';

const SESSION_KEY = '@capture_session';

async function ensureDirectoryExists(path: string) {
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(path, { intermediates: true });
  }
}

async function getFreeStorageInMB() {
  const freeBytes = await FileSystem.getFreeDiskStorageAsync();
  return freeBytes / (1024 * 1024);
}

export class StorageService {
  private currentSessionId: string | null = null;

  getSessionDirectory() {
    const sessionId = this.currentSessionId ?? captureStore.getState().sessionId;
    return `${FileSystem.documentDirectory}captures/${sessionId ?? 'default'}/`;
  }

  async initializeSession(sessionId: string) {
    this.currentSessionId = sessionId;
    await ensureDirectoryExists(this.getSessionDirectory());
  }

  async saveCapture(stepId: StepId, photoUri: string, orientation: OrientationData): Promise<CaptureResult> {
    const freeStorage = await getFreeStorageInMB();
    if (freeStorage < 50) {
      throw new Error('Not enough storage space. Please free up at least 50MB.');
    }

    const directory = this.getSessionDirectory();
    await ensureDirectoryExists(directory);

    const timestamp = Date.now();
    const rawPath = `${directory}${stepId}-${timestamp}.jpg`;
    await FileSystem.copyAsync({ from: photoUri, to: rawPath });

    const compressed = await compressImage(rawPath, 0.8, 2048);
    if (compressed.uri !== rawPath) {
      await FileSystem.deleteAsync(rawPath, { idempotent: true });
      await FileSystem.copyAsync({ from: compressed.uri, to: rawPath });
      await FileSystem.deleteAsync(compressed.uri, { idempotent: true });
    }

    const tempThumbnail = await createThumbnail(rawPath);
    const thumbnailPath = `${directory}${stepId}-${timestamp}-thumb.jpg`;
    await FileSystem.copyAsync({ from: tempThumbnail, to: thumbnailPath });
    await FileSystem.deleteAsync(tempThumbnail, { idempotent: true });
    const fileInfo = await FileSystem.getInfoAsync(rawPath);
    const quality = await checkImageQuality(rawPath);

    const capture: CaptureResult = {
      stepId,
      timestamp,
      imageUri: rawPath,
      thumbnailUri: thumbnailPath,
      metadata: {
        deviceAngle: { pitch: orientation.pitch, roll: orientation.roll },
        fileSize: fileInfo.size ?? 0,
        dimensions: quality.dimensions ?? { width: compressed.width, height: compressed.height }
      }
    };

    await this.persistCapture(capture);
    return capture;
  }

  private async persistCapture(capture: CaptureResult) {
    const storeState = captureStore.getState();
    const updated = storeState.captures.filter((c) => c.stepId !== capture.stepId).concat(capture);
    captureStore.getState().setCaptures(updated);
    await this.updateSession({ ...storeStateToSession(storeState, updated) });
  }

  async loadSession(): Promise<CaptureSession | null> {
    const json = await AsyncStorage.getItem(SESSION_KEY);
    if (!json) {
      return null;
    }
    try {
      return JSON.parse(json) as CaptureSession;
    } catch (error) {
      await AsyncStorage.removeItem(SESSION_KEY);
      return null;
    }
  }

  async updateSession(session: CaptureSession) {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  async clearSession() {
    const directory = this.getSessionDirectory();
    const info = await FileSystem.getInfoAsync(directory);
    if (info.exists) {
      await FileSystem.deleteAsync(directory, { idempotent: true });
    }
    await AsyncStorage.removeItem(SESSION_KEY);
    captureStore.getState().reset();
  }
}

function storeStateToSession(
  state: ReturnType<typeof captureStore.getState>,
  captures: CaptureResult[]
): CaptureSession {
  return {
    sessionId: state.sessionId,
    startTime: state.sessionStartTime,
    lastUpdateTime: Date.now(),
    captures,
    isComplete: captures.length === state.steps.length
  };
}

export const storageService = new StorageService();
