import { useCallback, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';

const SOUND_FILES = {
  radar: require('../assets/audio/radar_pulse.mp3'),
  beep3: require('../assets/audio/beep_3.mp3'),
  beep2: require('../assets/audio/beep_2.mp3'),
  beep1: require('../assets/audio/beep_1.mp3'),
  capture: require('../assets/audio/capture.mp3')
};

export interface AudioFeedback {
  startContinuousFeedback: (distanceFromTarget: number) => void;
  stopContinuousFeedback: () => void;
  playCountdown: () => Promise<void>;
  playCapture: () => Promise<void>;
}

export function useAudioFeedback(): AudioFeedback {
  const radarSound = useRef<Audio.Sound | null>(null);
  const countdownQueue = useRef<Audio.Sound[]>([]);
  const captureSound = useRef<Audio.Sound | null>(null);
  const radarInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    return () => {
      radarSound.current?.unloadAsync();
      captureSound.current?.unloadAsync();
      countdownQueue.current.forEach((sound) => sound.unloadAsync());
      if (radarInterval.current) {
        clearInterval(radarInterval.current);
      }
    };
  }, []);

  const ensureRadarLoaded = useCallback(async () => {
    if (!radarSound.current) {
      const { sound } = await Audio.Sound.createAsync(SOUND_FILES.radar, { isLooping: false, volume: 0.7 });
      radarSound.current = sound;
    }
  }, []);

  const startContinuousFeedback = useCallback(
    (distanceFromTarget: number) => {
      const clamped = Math.min(30, Math.max(0, distanceFromTarget));
      const interval = 500 + (clamped / 30) * 2500;

      const schedulePulse = async () => {
        await ensureRadarLoaded();
        await radarSound.current?.replayAsync();
      };

      if (radarInterval.current) {
        clearInterval(radarInterval.current);
      }

      schedulePulse();
      radarInterval.current = setInterval(schedulePulse, interval);
    },
    [ensureRadarLoaded]
  );

  const stopContinuousFeedback = useCallback(() => {
    if (radarInterval.current) {
      clearInterval(radarInterval.current);
      radarInterval.current = null;
    }
  }, []);

  const playCountdown = useCallback(async () => {
    const beeps = [SOUND_FILES.beep3, SOUND_FILES.beep2, SOUND_FILES.beep1];
    for (const source of beeps) {
      const { sound } = await Audio.Sound.createAsync(source, { volume: 0.9 });
      countdownQueue.current.push(sound);
    }

    for (const sound of countdownQueue.current) {
      await sound.replayAsync();
      await new Promise((resolve) => setTimeout(resolve, 750));
    }

    countdownQueue.current.forEach((sound) => sound.unloadAsync());
    countdownQueue.current = [];
  }, []);

  const playCapture = useCallback(async () => {
    if (!captureSound.current) {
      const { sound } = await Audio.Sound.createAsync(SOUND_FILES.capture, { volume: 1 });
      captureSound.current = sound;
    }
    await captureSound.current.replayAsync();
  }, []);

  return { startContinuousFeedback, stopContinuousFeedback, playCountdown, playCapture };
}
