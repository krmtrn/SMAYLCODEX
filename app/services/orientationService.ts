import { calculateOrientationDistance, getOrientationGuidanceText, isWithinTolerance } from '../utils/orientationMath';

export const orientationService = {
  isWithinTolerance,
  calculateOrientationDistance,
  getOrientationGuidanceText
};
