export type StepId = 'front' | 'right45' | 'left45' | 'vertex' | 'donor';

export interface OrientationTarget {
  pitch: number;
  roll: number;
  tolerance: number;
}

export interface FramingHint {
  type: 'face' | 'vertex' | 'nape';
  position: { x: number; y: number; width: number; height: number };
}

export interface StepConfig {
  id: StepId;
  title: string;
  description: string;
  detailedInstructions: string[];
  cameraFacing: 'front' | 'back';
  targetOrientation: OrientationTarget;
  framingHint: FramingHint;
  audioStrategy: 'continuous' | 'countdown-only';
  requiresStability: boolean;
  stabilityThreshold: number;
}

export interface CaptureMetadata {
  deviceAngle: { pitch: number; roll: number };
  fileSize: number;
  dimensions: { width: number; height: number };
}

export interface CaptureResult {
  stepId: StepId;
  timestamp: number;
  imageUri: string;
  thumbnailUri: string;
  metadata: CaptureMetadata;
}

export interface CaptureSession {
  sessionId: string;
  startTime: number;
  lastUpdateTime: number;
  captures: CaptureResult[];
  isComplete: boolean;
}
