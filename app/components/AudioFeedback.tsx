import React, { useEffect } from 'react';
import { useAudioFeedback } from '../hooks/useAudioFeedback';

interface AudioFeedbackProps {
  distanceFromTarget?: number;
  activeStrategy: 'continuous' | 'countdown-only';
  isCountdownActive: boolean;
}

export const AudioFeedbackController: React.FC<AudioFeedbackProps> = ({
  distanceFromTarget,
  activeStrategy,
  isCountdownActive
}) => {
  const { startContinuousFeedback, stopContinuousFeedback } = useAudioFeedback();

  useEffect(() => {
    if (activeStrategy === 'continuous' && distanceFromTarget !== undefined && !isCountdownActive) {
      startContinuousFeedback(distanceFromTarget);
      return () => {
        stopContinuousFeedback();
      };
    }
    stopContinuousFeedback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [distanceFromTarget, activeStrategy, isCountdownActive]);

  return null;
};
