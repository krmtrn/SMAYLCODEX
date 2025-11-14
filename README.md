# SMAYLCODEX
# Hair Clinic Self-Capture App - Production MVP Brief

You are an expert senior mobile engineer building a production-quality cross-platform camera app (Android + iOS) as an MVP for Smile Hair Clinic's hackathon.

## Goal
Implement a React Native (Expo) MVP where users can, without assistance, capture 5 consistent photos of their head with sensor-based angle guidance and semi-automatic shutter. The app must guide non-technical users to get repeatable, high-quality shots for medical hair transplant assessment.

---

## PRODUCT / DOMAIN REQUIREMENTS

### High-Level Flow

Build a "Self-Capture Tool" that guides users through 5 sequential photos:

1. **Full Face Front** - Phone parallel to ground, face centered
2. **45° Right** - User turns head 45° right, phone remains parallel
3. **45° Left** - User turns head 45° left, phone remains parallel  
4. **Vertex (Top)** - Phone above head, ~90° to ground, vertex centered
5. **Donor (Back)** - Phone behind head, capturing nape/occipital region

### Per-Photo Capture Requirements

For each photo, the app MUST provide:

1. **Clear Visual Guidance**
   - Step indicator (e.g., "Step 2 of 5: 45° Right")
   - Overlay template showing where face/head should be positioned
   - Real-time visual feedback on phone angle correctness

2. **Sensor-Based Angle Detection**
   - Use gyroscope/accelerometer to detect phone orientation
   - Show real-time feedback: "Tilt Up", "Tilt Down", "Perfect Angle"
   - Apply smoothing to avoid jitter
   - Visual indicator (progress bar/arc) showing how close to target angle

3. **Assisted Capture Trigger**
   - When phone angle is within tolerance AND stable for 1.5 seconds:
     - Start 3-second countdown with visual overlay
     - Play ascending audio feedback (beeps getting faster/higher)
     - Auto-trigger capture after countdown
   - **IMPORTANT**: Provide manual "Capture Now" button as fallback
   - If angle goes out of tolerance during countdown, cancel and restart

4. **Audio Feedback Throughout**
   - Subtle "radar" sound that increases frequency as angle gets closer to target
   - Distinct beeps during countdown (3-2-1)
   - Success sound on capture
   - **Critical**: Audio is primary feedback for vertex/donor shots where user can't see screen

### Review & Retake Flow

After capturing all 5 photos:

1. Show review screen with:
   - Thumbnail grid of all 5 photos
   - Step name + description per photo
   - "Retake" button per photo
   - "Submit All" button

2. Retake behavior:
   - Tapping "Retake" navigates back to CaptureFlowScreen
   - Pre-selects that specific step
   - Overwrites the previous image
   - Returns to review screen after recapture

3. Session persistence:
   - Save session state to AsyncStorage on every capture
   - Restore session if app is closed/crashed
   - Clear session only on explicit "Finish" or "Start New Session"

---

## TECH STACK

- **Framework**: Expo (managed workflow) with TypeScript
- **Navigation**: React Navigation 6 (Stack)
- **Camera**: `expo-camera`
- **Sensors**: `expo-sensors` (DeviceMotion)
- **Audio**: `expo-av` (Audio feedback)
- **Storage**: 
  - `expo-file-system` (images)
  - `@react-native-async-storage/async-storage` (metadata)
- **State**: Zustand (lightweight, easy to persist)
- **UI**: React Native built-in components + react-native-paper (minimal)

---

## ARCHITECTURE & FOLDER STRUCTURE

```
app/
├── App.tsx
├── navigation/
│   └── RootNavigator.tsx
├── screens/
│   ├── IntroScreen.tsx           # Welcome, instructions, permissions
│   ├── CaptureFlowScreen.tsx     # Main capture flow
│   ├── ReviewScreen.tsx          # Review grid + retake
│   └── PermissionScreen.tsx      # Handle denied permissions
├── components/
│   ├── StepIndicator.tsx         # "Step X of 5: [Name]"
│   ├── AngleIndicator.tsx        # Visual feedback for phone tilt
│   ├── FramingOverlay.tsx        # Face/head positioning guide
│   ├── CountdownOverlay.tsx      # 3-2-1 visual countdown
│   ├── CaptureButton.tsx         # Manual fallback button
│   └── AudioFeedback.tsx         # Wrapper for audio player
├── hooks/
│   ├── useCaptureFlow.ts         # Step management, transitions
│   ├── useDeviceOrientation.ts   # Sensor data with smoothing
│   ├── usePermissions.ts         # Camera + sensor permissions
│   └── useAudioFeedback.ts       # Sound management
├── services/
│   ├── storageService.ts         # Save/load images + metadata
│   ├── sessionService.ts         # Session persistence
│   └── orientationService.ts     # Orientation math utilities
├── store/
│   └── captureStore.ts           # Zustand store for global state
├── config/
│   └── stepsConfig.ts            # 5-step configuration
├── types/
│   └── capture.ts                # TypeScript interfaces/enums
├── utils/
│   ├── orientationMath.ts        # Pitch/roll/yaw calculations
│   └── imageUtils.ts             # Compression, thumbnails
└── theme/
    ├── colors.ts
    ├── typography.ts
    └── spacing.ts
```

---

## CRITICAL IMPLEMENTATION DETAILS

### 1. Permissions Strategy

**File**: `hooks/usePermissions.ts`

```typescript
interface PermissionState {
  camera: 'granted' | 'denied' | 'undetermined';
  motion: 'granted' | 'denied' | 'undetermined';
}
```

**Flow**:
- Check permissions on IntroScreen mount
- If denied, show PermissionScreen with:
  - Clear explanation why permissions are needed
  - "Open Settings" button (Linking.openSettings())
  - Cannot proceed without permissions
- Re-check on app foreground

**iOS**: Add required keys to `app.json`:
```json
{
  "ios": {
    "infoPlist": {
      "NSCameraUsageDescription": "We need camera access to capture your hair assessment photos.",
      "NSMotionUsageDescription": "We use motion sensors to guide you to the correct phone angle."
    }
  }
}
```

### 2. Steps Configuration

**File**: `config/stepsConfig.ts`

```typescript
export interface StepConfig {
  id: StepId;
  title: string;
  description: string;
  detailedInstructions: string[]; // Multi-line guidance
  cameraFacing: 'front' | 'back';
  targetOrientation: {
    pitch: number;      // Degrees from horizontal
    roll: number;       // Degrees of side tilt
    tolerance: number;  // ±degrees acceptable
  };
  framingHint: {
    type: 'face' | 'vertex' | 'nape';
    position: { x: number; y: number; width: number; height: number }; // Normalized 0-1
  };
  audioStrategy: 'continuous' | 'countdown-only'; // Continuous for vertex/donor
  requiresStability: boolean; // Require 1.5s stable before countdown
  stabilityThreshold: number; // Max deg/sec change rate
}

export const STEPS: StepConfig[] = [
  {
    id: 'front',
    title: 'Full Face Front',
    description: 'Hold phone at eye level, face the camera directly',
    detailedInstructions: [
      'Stand in a well-lit area',
      'Hold phone parallel to ground',
      'Center your face in the oval',
      'Look directly at the camera'
    ],
    cameraFacing: 'front',
    targetOrientation: { pitch: 0, roll: 0, tolerance: 10 },
    framingHint: { type: 'face', position: { x: 0.5, y: 0.4, width: 0.6, height: 0.7 } },
    audioStrategy: 'countdown-only',
    requiresStability: true,
    stabilityThreshold: 2 // deg/sec
  },
  {
    id: 'right45',
    title: '45° Right Profile',
    description: 'Turn your head 45° to the right',
    detailedInstructions: [
      'Keep phone at same position',
      'Turn your head to the right',
      'Right ear should be visible',
      'Keep looking ahead (not at phone)'
    ],
    cameraFacing: 'front',
    targetOrientation: { pitch: 0, roll: 0, tolerance: 10 },
    framingHint: { type: 'face', position: { x: 0.5, y: 0.4, width: 0.6, height: 0.7 } },
    audioStrategy: 'countdown-only',
    requiresStability: true,
    stabilityThreshold: 2
  },
  {
    id: 'left45',
    title: '45° Left Profile',
    description: 'Turn your head 45° to the left',
    detailedInstructions: [
      'Keep phone at same position',
      'Turn your head to the left',
      'Left ear should be visible',
      'Keep looking ahead (not at phone)'
    ],
    cameraFacing: 'front',
    targetOrientation: { pitch: 0, roll: 0, tolerance: 10 },
    framingHint: { type: 'face', position: { x: 0.5, y: 0.4, width: 0.6, height: 0.7 } },
    audioStrategy: 'countdown-only',
    requiresStability: true,
    stabilityThreshold: 2
  },
  {
    id: 'vertex',
    title: 'Top of Head (Vertex)',
    description: 'Hold phone above your head, looking down',
    detailedInstructions: [
      'Raise phone directly above your head',
      'Tilt phone so camera points straight down',
      'Use the audio feedback to guide you',
      'Keep your head still and level'
    ],
    cameraFacing: 'back',
    targetOrientation: { pitch: 90, roll: 0, tolerance: 15 },
    framingHint: { type: 'vertex', position: { x: 0.5, y: 0.5, width: 0.5, height: 0.5 } },
    audioStrategy: 'continuous',
    requiresStability: true,
    stabilityThreshold: 3
  },
  {
    id: 'donor',
    title: 'Back of Head (Donor)',
    description: 'Hold phone behind your head at nape level',
    detailedInstructions: [
      'Reach phone behind your head',
      'Position at neck/nape level',
      'Use audio feedback for guidance',
      'Keep arm steady'
    ],
    cameraFacing: 'back',
    targetOrientation: { pitch: 0, roll: 0, tolerance: 15 },
    framingHint: { type: 'nape', position: { x: 0.5, y: 0.5, width: 0.6, height: 0.7 } },
    audioStrategy: 'continuous',
    requiresStability: true,
    stabilityThreshold: 3
  }
];
```

### 3. Device Orientation Hook

**File**: `hooks/useDeviceOrientation.ts`

**Requirements**:
- Subscribe to `DeviceMotion` from `expo-sensors`
- Apply exponential moving average smoothing (alpha = 0.2)
- Convert rotation data to pitch/roll in degrees
- Handle coordinate system differences (iOS vs Android)
- Calculate stability metric (rate of change)
- Return processed values at 10Hz

```typescript
interface OrientationData {
  pitch: number;        // -180 to 180, 0 = horizontal
  roll: number;         // -180 to 180, 0 = no side tilt
  isStable: boolean;    // true if change rate < threshold
  deltaFromTarget: {    // null if no target set
    pitch: number;
    roll: number;
    distance: number;   // Euclidean distance
  } | null;
}

export function useDeviceOrientation(
  targetPitch?: number,
  targetRoll?: number,
  tolerance?: number
): OrientationData
```

**Implementation Notes**:
- Use `DeviceMotion.addListener()` with update interval 100ms
- Store last 5 readings for smoothing
- Calculate angular velocity to determine stability
- Handle gimbal lock at ±90° pitch gracefully
- Clean up listener on unmount

### 4. Audio Feedback System

**File**: `hooks/useAudioFeedback.ts`

**Sounds needed**:
- `radar_pulse.mp3` - Continuous feedback (frequency increases as angle improves)
- `beep_3.mp3` - Countdown 3
- `beep_2.mp3` - Countdown 2  
- `beep_1.mp3` - Countdown 1
- `capture.mp3` - Success sound on capture

**API**:
```typescript
interface AudioFeedback {
  startContinuousFeedback: (distanceFromTarget: number) => void;
  stopContinuousFeedback: () => void;
  playCountdown: () => Promise<void>;
  playCapture: () => Promise<void>;
}
```

**Continuous Feedback Logic**:
- Map `distanceFromTarget` (0-30°) to pulse rate (0.5s - 3s interval)
- Closer = faster pulses
- Stop when countdown starts

### 5. Capture Flow Hook

**File**: `hooks/useCaptureFlow.ts`

```typescript
interface CaptureFlowState {
  currentStepIndex: number;
  currentStep: StepConfig;
  capturedImages: Map<StepId, CaptureResult>;
  isInCountdown: boolean;
  countdownValue: number | null;
  canAutoCapture: boolean;
}

interface CaptureFlowActions {
  startCountdown: () => void;
  cancelCountdown: () => void;
  capturePhoto: (uri: string) => Promise<void>;
  goToStep: (index: number) => void;
  retakeStep: (stepId: StepId) => void;
  completeFlow: () => Promise<void>;
  resetFlow: () => void;
}
```

**State Machine**:
```
IDLE → WAITING_FOR_ANGLE → ANGLE_ACHIEVED → STABILIZING → COUNTDOWN → CAPTURING → CAPTURED
```

**Logic**:
1. Monitor `useDeviceOrientation` output
2. When angle within tolerance:
   - Start stability timer (1.5s)
   - If still stable after 1.5s → start countdown
3. During countdown:
   - Update countdown value every 1s (3→2→1)
   - Play corresponding beep
   - If angle goes out of tolerance → cancel, back to WAITING_FOR_ANGLE
4. After countdown complete:
   - Call camera's `takePictureAsync()`
   - Save image via `storageService`
   - Update Zustand store
   - Auto-advance to next step

### 6. Storage Service

**File**: `services/storageService.ts`

```typescript
interface CaptureResult {
  stepId: StepId;
  timestamp: number;
  imageUri: string;         // FileSystem path
  thumbnailUri: string;     // Compressed version
  metadata: {
    deviceAngle: { pitch: number; roll: number };
    fileSize: number;
    dimensions: { width: number; height: number };
  };
}

interface CaptureSession {
  sessionId: string;
  startTime: number;
  lastUpdateTime: number;
  captures: CaptureResult[];
  isComplete: boolean;
}

class StorageService {
  // Save image to filesystem, generate thumbnail, persist metadata
  async saveCapture(stepId: StepId, photoUri: string, orientation: OrientationData): Promise<CaptureResult>;
  
  // Load current session from AsyncStorage
  async loadSession(): Promise<CaptureSession | null>;
  
  // Update session in AsyncStorage
  async updateSession(session: CaptureSession): Promise<void>;
  
  // Clear session and delete image files
  async clearSession(): Promise<void>;
  
  // Get session directory path
  getSessionDirectory(): string;
}
```

**Implementation**:
- Create unique session directory: `${FileSystem.documentDirectory}captures/${sessionId}/`
- Save high-quality JPEG (quality: 0.8, max dimension: 2048px)
- Generate thumbnail (quality: 0.5, max dimension: 300px)
- Store metadata in AsyncStorage under key: `@capture_session:${sessionId}`
- Use atomic operations (try/catch with rollback)
- Handle storage full errors gracefully

### 7. Image Quality Utilities

**File**: `utils/imageUtils.ts`

```typescript
interface ImageQualityCheck {
  isAcceptable: boolean;
  issues: string[];
  score: number; // 0-100
}

async function checkImageQuality(uri: string): Promise<ImageQualityCheck> {
  // Basic heuristic checks (no ML yet, but structured for future)
  
  // 1. File size check (too small = likely corrupt, too large = compression failed)
  const fileInfo = await FileSystem.getInfoAsync(uri);
  if (fileInfo.size < 50_000) {
    return { isAcceptable: false, issues: ['Image file too small'], score: 0 };
  }
  
  // 2. Resolution check (read image dimensions)
  // Use expo-image-manipulator to get dimensions
  
  // 3. Future: blur detection, exposure check, etc.
  
  return { isAcceptable: true, issues: [], score: 85 };
}

async function compressImage(uri: string, quality: number, maxDimension: number): Promise<string>;
async function createThumbnail(uri: string): Promise<string>;
```

### 8. Orientation Math Utilities

**File**: `utils/orientationMath.ts`

```typescript
// Convert quaternion to Euler angles (pitch, roll, yaw)
function quaternionToEuler(q: { x: number; y: number; z: number; w: number }): {
  pitch: number;
  roll: number;
  yaw: number;
}

// Calculate angular distance between two orientations
function calculateOrientationDistance(
  current: { pitch: number; roll: number },
  target: { pitch: number; roll: number }
): number

// Smooth values using exponential moving average
function smoothValue(newValue: number, oldValue: number, alpha: number): number

// Calculate angular velocity (degrees per second)
function calculateAngularVelocity(
  current: { pitch: number; roll: number },
  previous: { pitch: number; roll: number },
  deltaTime: number
): number

// Check if orientation is within tolerance
function isWithinTolerance(
  current: { pitch: number; roll: number },
  target: { pitch: number; roll: number },
  tolerance: number
): boolean

// Generate guidance text ("Tilt up", "Tilt left", etc.)
function getOrientationGuidanceText(
  current: { pitch: number; roll: number },
  target: { pitch: number; roll: number }
): string
```

---

## UI/UX GUIDELINES

### Theme (theme/colors.ts)

```typescript
export const colors = {
  primary: '#0066CC',        // Medical blue
  secondary: '#00C9A7',      // Success green
  background: '#FFFFFF',     // Clean white
  surface: '#F5F5F5',        // Light gray
  error: '#FF3B30',          // iOS red
  warning: '#FF9500',        // iOS orange
  text: {
    primary: '#000000',
    secondary: '#666666',
    inverse: '#FFFFFF'
  },
  overlay: {
    guideline: 'rgba(0, 102, 204, 0.3)',   // Blue tint
    success: 'rgba(0, 201, 167, 0.4)',     // Green when aligned
    countdown: 'rgba(0, 0, 0, 0.7)'        // Dark overlay
  }
};
```

### IntroScreen

- Hero section with app icon
- Title: "Hair Assessment Self-Capture"
- Brief explanation (3-4 bullet points):
  - "Capture 5 photos from different angles"
  - "Follow on-screen guidance for each shot"
  - "Takes approximately 2 minutes"
  - "Photos stored securely on your device"
- Large "Get Started" button
- Footer: "You'll be asked for camera and motion sensor access"

### CaptureFlowScreen Layout

```
┌─────────────────────────────┐
│  [<] Step 2 of 5             │ ← Header (back button, progress)
│  45° Right Profile           │ ← Step title
├─────────────────────────────┤
│                              │
│    [Camera Preview]          │ ← Full camera view
│                              │
│    ┌──────────────┐          │ ← Framing overlay (oval/rect)
│    │              │          │
│    │              │          │
│    └──────────────┘          │
│                              │
│   [Angle Indicator]          │ ← Visual pitch/roll feedback
│    ⬆️ Tilt up 5°             │
├─────────────────────────────┤
│ [Instructions Panel]         │ ← Expandable tips
│ • Turn head to the right     │
│ • Keep phone still           │
├─────────────────────────────┤
│  [Manual Capture] [Skip]     │ ← Bottom controls (small, secondary)
└─────────────────────────────┘
```

**During Countdown**:
- Darken camera preview (overlay)
- Large centered number: "3" → "2" → "1"
- Pulse animation
- Hide other UI elements temporarily

### ReviewScreen Layout

```
┌─────────────────────────────┐
│  Review Your Photos          │
│  [X] Discard All             │
├─────────────────────────────┤
│  ┌───────┐  ┌───────┐       │
│  │ [IMG] │  │ [IMG] │       │ ← 2-column grid
│  │Front  │  │Right  │       │
│  └───────┘  └───────┘       │
│  [Retake]   [Retake]        │
│                              │
│  ┌───────┐  ┌───────┐       │
│  │ [IMG] │  │ [IMG] │       │
│  │Left   │  │Vertex │       │
│  └───────┘  └───────┘       │
│  [Retake]   [Retake]        │
│                              │
│  ┌───────┐                  │
│  │ [IMG] │                  │
│  │Donor  │                  │
│  └───────┘                  │
│  [Retake]                   │
├─────────────────────────────┤
│                              │
│  [Submit All Photos] ━━━━━  │ ← Primary CTA
│                              │
└─────────────────────────────┘
```

### PermissionScreen

- Icon: 🎥📱
- Title: "Camera and Sensors Required"
- Explanation:
  - "We need camera access to take your photos"
  - "Motion sensors help guide you to the correct angle"
- Button: "Grant Permissions"
- If already denied:
  - "You previously denied permissions"
  - Button: "Open Settings" (deep link to app settings)

---

## ERROR HANDLING & EDGE CASES

### Critical Error Scenarios

1. **Camera Permission Denied**
   - Show PermissionScreen
   - Cannot proceed without camera
   - Provide "Open Settings" link

2. **Storage Full**
   - Detect before capture using `FileSystem.getFreeDiskStorageAsync()`
   - Show alert: "Not enough storage space. Please free up at least 50MB."
   - Prevent capture attempt

3. **Camera Hardware Failure**
   - Try/catch around camera initialization
   - Show error: "Camera unavailable. Please restart the app."
   - Provide "Retry" button

4. **App Crash During Capture**
   - On relaunch, check for incomplete session in AsyncStorage
   - Show dialog: "Resume previous session?" [Yes] [Start New]
   - If yes, load last session state and continue from current step

5. **Sensor Data Unavailable**
   - Fallback to manual capture only
   - Show warning: "Automatic angle detection unavailable"
   - Disable auto-countdown, show manual button prominently

6. **Image Save Failed**
   - Try/catch around FileSystem operations
   - On failure, retry up to 3 times with exponential backoff
   - If still fails, show error and allow user to retry step

7. **Countdown Interrupted**
   - User tilts phone during countdown → cancel, show "Hold steady" message
   - App goes to background → cancel countdown, resume when foregrounded
   - User taps screen during countdown → option to "Cancel Countdown"

### Non-Critical Edge Cases

1. **Very Low Light**
   - Show tip: "Move to brighter area for better quality"
   - Allow capture anyway (user decision)

2. **Device Too Old / Slow**
   - Reduce camera preview frame rate
   - Increase sensor smoothing alpha
   - May feel less responsive but functional

3. **User Skips Step**
   - Allow manual "Skip" button (but discouraged)
   - Mark step as incomplete
   - In review screen, show placeholder with "Not Captured" badge
   - Require all 5 before "Submit" is enabled

---

## TESTING & VALIDATION

### Manual Testing Checklist

- [ ] Grant/deny permissions flow works on iOS and Android
- [ ] All 5 photo types capture successfully
- [ ] Audio feedback plays correctly (continuous and countdown)
- [ ] Countdown cancels when angle changes
- [ ] Manual capture button works as fallback
- [ ] Session persists across app restarts
- [ ] Retake replaces existing photo correctly
- [ ] Review screen shows all thumbnails
- [ ] Storage errors handled gracefully
- [ ] App works on slow device (test on older phone)

### Unit Tests (Recommended)

- `orientationMath.ts`:
  - `isWithinTolerance()` with various inputs
  - `calculateOrientationDistance()` edge cases
  - Quaternion to Euler conversion accuracy

- `useCaptureFlow`:
  - State transitions (idle → countdown → captured)
  - Countdown cancellation logic
  - Retake flow updates correct step

- `storageService`:
  - Save/load session consistency
  - Handle corrupted AsyncStorage data
  - File deletion on clearSession

---

## DELIVERABLES

### 1. Working Expo App

- Run on iOS Simulator and Android Emulator
- Test on at least one physical device
- No crashes during normal flow
- All 5 photos can be captured

### 2. README.md

```markdown
# Hair Clinic Self-Capture App

Medical-grade self-capture tool for consistent hair assessment photography.

## Quick Start

npm install
npx expo start

## Architecture

- **Screens**: Intro → Capture Flow → Review
- **State**: Zustand store for global session state
- **Storage**: Local filesystem + AsyncStorage
- **Sensors**: DeviceMotion for angle guidance

## Key Features

- 5-step guided photo capture
- Sensor-based angle detection
- Audio + visual feedback
- Automatic countdown and capture
- Session persistence
- Retake individual photos

## Future Enhancements

- [ ] Backend upload (Supabase integration)
- [ ] ML-based face/head detection
- [ ] Image quality scoring (blur, exposure)
- [ ] Multi-language support
- [ ] Accessibility improvements (VoiceOver support)

## Known Limitations

- No face detection (uses overlays and manual positioning)
- Vertex and donor shots require practice
- Basic quality checks only
```

### 3. Brief Technical Doc

- Architecture diagram (screen flow)
- Sensor data processing explanation
- Storage schema (AsyncStorage keys, file structure)
- Extension points for ML and backend

---

## PRIORITIZED IMPLEMENTATION ORDER

### Phase 1: Core Infrastructure (Day 1-2)
1. Set up Expo project with TypeScript
2. Configure navigation (React Navigation)
3. Implement permissions handling
4. Create stepsConfig.ts with all 5 steps
5. Build basic StorageService

### Phase 2: Capture Mechanics (Day 3-4)
1. Implement useDeviceOrientation hook
2. Build CaptureFlowScreen with camera preview
3. Add AngleIndicator component
4. Implement manual capture button
5. Test basic photo capture flow

### Phase 3: Auto-Capture (Day 5-6)
1. Add countdown logic to useCaptureFlow
2. Implement CountdownOverlay component
3. Add stability detection
4. Wire up auto-trigger when conditions met
5. Test cancellation scenarios

### Phase 4: Audio & Polish (Day 7)
1. Implement useAudioFeedback hook
2. Add continuous radar feedback
3. Add countdown beeps
4. Tune audio levels and timing

### Phase 5: Review & Persistence (Day 8)
1. Build ReviewScreen layout
2. Implement retake flow
3. Add session persistence
4. Test crash recovery

### Phase 6: Error Handling & Testing (Day 9-10)
1. Add all error scenarios
2. Test on physical devices
3. Refine UX based on feedback
4. Write documentation

---

## CRITICAL SUCCESS FACTORS

1. **Vertex and Donor shots must be usable** - This is the hackathon's main challenge
   - Audio feedback is essential since users can't see screen
   - Tolerance must be wide enough (±15°) to be achievable
   - Instructions must be crystal clear

2. **Countdown must feel responsive, not frustrating**
   - 1.5s stability wait before countdown is critical
   - Countdown cancellation must be immediate if angle changes
   - Manual fallback must always be available

3. **Session persistence prevents user frustration**
   - Save after every capture
   - Auto-resume on app restart
   - Never lose user's work

4. **Audio feedback is not optional**
   - Users rely on it for blind shots (vertex/donor)
   - Radar pulse must be clearly audible
   - Countdown beeps must be distinct

5. **Error messages must be actionable**
   - Never show generic "Error occurred"
   - Always provide next step: "Retry", "Open Settings", etc.
   - Handle edge cases gracefully, never crash

---

## NOTES FOR FUTURE BACKEND INTEGRATION

Prepare these extension points:

### 1. Upload Service (services/uploadService.ts)

```typescript
interface UploadService {
  uploadSession(session: CaptureSession): Promise<{ sessionId: string; urls: string[] }>;
  checkUploadStatus(sessionId: string): Promise<UploadStatus>;
}
```

### 2. ML Integration (services/mlService.ts)

```typescript
interface MLService {
  detectFace(imageUri: string): Promise<FaceDetectionResult>;
  assessImageQuality(imageUri: string): Promise<ImageQualityScore>;
  verifyHeadPosition(imageUri: string, stepId: StepId): Promise<PositionVerification>;
}
```

### 3. Supabase Schema Placeholder

```sql
-- Future schema
CREATE TABLE capture_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP,
  completed_at TIMESTAMP,
  status TEXT
);

CREATE TABLE
