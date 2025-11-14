import { StepConfig } from '../types/capture';

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
    stabilityThreshold: 2
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
