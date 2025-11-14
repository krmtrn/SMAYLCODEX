import { Platform } from 'react-native';

const RAD_TO_DEG = 180 / Math.PI;

export function quaternionToEuler(q: { x: number; y: number; z: number; w: number }) {
  const { x, y, z, w } = q;

  const sinrCosp = 2 * (w * x + y * z);
  const cosrCosp = 1 - 2 * (x * x + y * y);
  const roll = Math.atan2(sinrCosp, cosrCosp);

  const sinp = 2 * (w * y - z * x);
  let pitch: number;
  if (Math.abs(sinp) >= 1) {
    pitch = Math.sign(sinp) * Math.PI / 2;
  } else {
    pitch = Math.asin(sinp);
  }

  const sinyCosp = 2 * (w * z + x * y);
  const cosyCosp = 1 - 2 * (y * y + z * z);
  const yaw = Math.atan2(sinyCosp, cosyCosp);

  return {
    pitch: pitch * RAD_TO_DEG,
    roll: roll * RAD_TO_DEG,
    yaw: yaw * RAD_TO_DEG
  };
}

export function normalizeOrientation({ pitch, roll }: { pitch: number; roll: number }) {
  let normalizedPitch = pitch;
  let normalizedRoll = roll;

  if (Platform.OS === 'ios') {
    normalizedPitch *= -1;
  } else {
    normalizedRoll *= -1;
  }

  return {
    pitch: normalizedPitch,
    roll: normalizedRoll
  };
}

export function calculateOrientationDistance(
  current: { pitch: number; roll: number },
  target: { pitch: number; roll: number }
) {
  const pitchDelta = current.pitch - target.pitch;
  const rollDelta = current.roll - target.roll;
  return Math.sqrt(pitchDelta * pitchDelta + rollDelta * rollDelta);
}

export function smoothValue(newValue: number, oldValue: number, alpha: number) {
  return alpha * newValue + (1 - alpha) * oldValue;
}

export function calculateAngularVelocity(
  current: { pitch: number; roll: number },
  previous: { pitch: number; roll: number },
  deltaTime: number
) {
  if (deltaTime <= 0) {
    return 0;
  }
  const pitchVelocity = Math.abs(current.pitch - previous.pitch) / deltaTime;
  const rollVelocity = Math.abs(current.roll - previous.roll) / deltaTime;
  return Math.max(pitchVelocity, rollVelocity);
}

export function isWithinTolerance(
  current: { pitch: number; roll: number },
  target: { pitch: number; roll: number },
  tolerance: number
) {
  return (
    Math.abs(current.pitch - target.pitch) <= tolerance &&
    Math.abs(current.roll - target.roll) <= tolerance
  );
}

export function getOrientationGuidanceText(
  current: { pitch: number; roll: number },
  target: { pitch: number; roll: number }
) {
  const pitchDiff = current.pitch - target.pitch;
  const rollDiff = current.roll - target.roll;

  if (Math.abs(pitchDiff) < 2 && Math.abs(rollDiff) < 2) {
    return 'Perfect angle';
  }

  if (Math.abs(pitchDiff) >= Math.abs(rollDiff)) {
    return pitchDiff > 0 ? 'Tilt phone down' : 'Tilt phone up';
  }

  return rollDiff > 0 ? 'Tilt phone right' : 'Tilt phone left';
}
