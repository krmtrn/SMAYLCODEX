# Technical Overview

## Screen Flow

```
IntroScreen → CaptureFlowScreen (×5 steps) → ReviewScreen → IntroScreen
                     ↘ PermissionsScreen (if permissions denied)
```

## Sensor Processing Pipeline

1. `useDeviceOrientation` subscribes to `DeviceMotion` updates at 10 Hz.
2. Quaternions are converted to Euler angles and normalized for the platform.
3. An exponential moving average (α = 0.2) smooths pitch/roll noise.
4. Angular velocity is calculated between samples to gauge stability.
5. The hook compares the smoothed angles with the current step target and exposes
   delta/tolerance data for UI guidance and auto-capture logic.

## Capture Flow Logic

```
WAITING_FOR_ALIGNMENT → STABILIZING → COUNTDOWN → CAPTURE → NEXT_STEP
             ↑                    ↘ cancel when misaligned ↗
```

- `useCaptureFlow` monitors orientation and starts a stability timer when the
  target angles are met. After 1.5 s of stable readings, a 3-2-1 countdown begins.
- If the device drifts outside the tolerance or becomes unstable, the countdown is
  cancelled immediately.
- When the countdown finishes, `autoCaptureRequested` is set, prompting the screen
  to trigger the camera shutter. Manual capture is always available.

## Storage Model

```
FileSystem: <documentDirectory>/captures/<sessionId>/
  ├── front-<timestamp>.jpg
  ├── front-<timestamp>-thumb.jpg
  └── … (per step)
AsyncStorage: @capture_session → CaptureSession JSON
Zustand Persist: capture-store → lightweight UI state cache
```

Each capture stores:

- `imageUri` – path to compressed full-resolution image
- `thumbnailUri` – downsized JPEG for review grid
- `metadata` – pitch/roll at capture time, file size, and image dimensions

Sessions are initialized on first use and updated after every capture. Clearing
or submitting a session deletes the directory and resets the store.

## Extension Points

- `services/storageService.ts` – add cloud upload once backend is ready.
- `hooks/useDeviceOrientation.ts` – drop-in location for ML-powered stability checks.
- `utils/imageUtils.ts` – expand quality heuristics (blur detection, exposure, etc.).
- `hooks/useAudioFeedback.ts` – replace placeholder sounds with licensed assets.

