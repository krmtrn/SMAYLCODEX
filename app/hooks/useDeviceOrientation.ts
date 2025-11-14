import { useEffect, useRef, useState } from 'react';
import { DeviceMotion } from 'expo-sensors';
import { orientationService } from '../services/orientationService';
import { calculateAngularVelocity, normalizeOrientation, quaternionToEuler, smoothValue } from '../utils/orientationMath';

const UPDATE_INTERVAL = 100;
const SMOOTHING_ALPHA = 0.2;

export interface OrientationData {
  pitch: number;
  roll: number;
  angularVelocity: number;
  isStable: boolean;
  deltaFromTarget: {
    pitch: number;
    roll: number;
    distance: number;
  } | null;
}

export function useDeviceOrientation(targetPitch?: number, targetRoll?: number, tolerance?: number) {
  const [data, setData] = useState<OrientationData>({
    pitch: 0,
    roll: 0,
    angularVelocity: 0,
    isStable: false,
    deltaFromTarget: null
  });
  const lastValues = useRef({ pitch: 0, roll: 0 });
  const lastUpdateTime = useRef<number | null>(null);

  useEffect(() => {
    DeviceMotion.setUpdateInterval(UPDATE_INTERVAL);
    const subscription = DeviceMotion.addListener((motion) => {
      if (!motion.rotation) {
        return;
      }

      const euler = quaternionToEuler(motion.rotation);
      const { pitch, roll } = normalizeOrientation({ pitch: euler.pitch, roll: euler.roll });

      const smoothedPitch = smoothValue(pitch, lastValues.current.pitch, SMOOTHING_ALPHA);
      const smoothedRoll = smoothValue(roll, lastValues.current.roll, SMOOTHING_ALPHA);

      const now = Date.now();
      const deltaTime = lastUpdateTime.current ? (now - lastUpdateTime.current) / 1000 : 0;
      const velocity = calculateAngularVelocity(
        { pitch: smoothedPitch, roll: smoothedRoll },
        lastValues.current,
        deltaTime
      );

      lastValues.current = { pitch: smoothedPitch, roll: smoothedRoll };
      lastUpdateTime.current = now;

      const hasTarget = targetPitch !== undefined && targetRoll !== undefined && tolerance !== undefined;
      const withinTolerance = hasTarget
        ? orientationService.isWithinTolerance(
            { pitch: smoothedPitch, roll: smoothedRoll },
            { pitch: targetPitch!, roll: targetRoll! },
            tolerance!
          )
        : false;

      const delta = hasTarget
        ? {
            pitch: smoothedPitch - targetPitch!,
            roll: smoothedRoll - targetRoll!,
            distance: orientationService.calculateOrientationDistance(
              { pitch: smoothedPitch, roll: smoothedRoll },
              { pitch: targetPitch!, roll: targetRoll! }
            )
          }
        : null;

      setData({
        pitch: smoothedPitch,
        roll: smoothedRoll,
        angularVelocity: velocity,
        isStable: velocity < 5,
        deltaFromTarget: withinTolerance || delta ? delta : null
      });
    });

    return () => {
      subscription.remove();
    };
  }, [targetPitch, targetRoll, tolerance]);

  return data;
}
