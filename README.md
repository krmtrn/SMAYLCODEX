# Hair Clinic Self-Capture App

Medical-grade self-capture tool for consistent hair assessment photography.

## Quick Start

```bash
npm install
npx expo start
```

The project targets the Expo managed workflow with TypeScript. Use the Expo Go client or an emulator to validate the flow on both Android and iOS.

## Architecture Overview

```
app/
├── App.tsx                     # App bootstrap with Paper + Navigation providers
├── navigation/RootNavigator.tsx# Stack navigation definition
├── screens/                    # Intro, Capture, Review, Permission flows
├── components/                 # UI building blocks (angle indicator, overlays, etc.)
├── hooks/                      # Sensor + capture orchestration hooks
├── services/                   # Storage/session/orientation helpers
├── store/                      # Zustand session state
├── config/stepsConfig.ts       # Five step capture configuration
├── utils/                      # Orientation math + image helpers
└── theme/                      # Color/spacing/typography tokens
```

### Key Technologies

- **Camera**: `expo-camera`
- **Sensors**: `expo-sensors` (DeviceMotion)
- **Audio**: `expo-av`
- **Storage**: `expo-file-system`, `@react-native-async-storage/async-storage`
- **State**: Zustand with JSON persistence
- **UI**: React Native core components + `react-native-paper`

## Core Features

- Guided five-step capture flow with dynamic instructions
- Device orientation smoothing with tolerance checks and stability detection
- Automatic countdown trigger when angle is aligned and steady
- Manual capture fallback and per-step skip/retake options
- Continuous audio pulse for vertex/donor steps plus countdown beeps
- Session persistence and thumbnail generation for review grid

## Project Tasks Implemented

- Permissions handling with fallback screen and deep link to settings
- Sensor hook with exponential smoothing, angular velocity, and tolerance feedback
- Capture flow state machine with countdown + auto capture trigger
- Storage service that manages session directories, compression, thumbnails, and metadata
- Review screen with retake and submit behaviors

## Future Enhancements

- [ ] Backend upload (Supabase integration)
- [ ] ML-based face/head detection and quality scoring
- [ ] Advanced error banners and offline recovery
- [ ] Localization + accessibility pass (VoiceOver, TalkBack guidance)
- [ ] Automated tests for hooks and utilities

## Known Limitations

- Audio assets are placeholders and should be replaced with production-ready sounds
- Image quality checks are minimal (size + resolution heuristics only)
- Countdown/capture timing has not been tuned on real devices
- Skip flow does not persist explicit "skipped" status beyond lack of capture
