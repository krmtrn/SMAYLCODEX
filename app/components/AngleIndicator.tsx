import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { orientationService } from '../services/orientationService';

interface AngleIndicatorProps {
  pitch: number;
  roll: number;
  targetPitch: number;
  targetRoll: number;
  tolerance: number;
}

export const AngleIndicator: React.FC<AngleIndicatorProps> = ({ pitch, roll, targetPitch, targetRoll, tolerance }) => {
  const distance = orientationService.calculateOrientationDistance(
    { pitch, roll },
    { pitch: targetPitch, roll: targetRoll }
  );
  const withinTolerance = orientationService.isWithinTolerance(
    { pitch, roll },
    { pitch: targetPitch, roll: targetRoll },
    tolerance
  );
  const guidance = orientationService.getOrientationGuidanceText(
    { pitch, roll },
    { pitch: targetPitch, roll: targetRoll }
  );

  return (
    <View style={styles.container}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.max(0, 100 - distance * 2)}%` }]} />
      </View>
      <Text style={[styles.guidance, withinTolerance && styles.success]}>{guidance}</Text>
      <Text style={styles.metrics}>{`Pitch: ${pitch.toFixed(1)}° · Roll: ${roll.toFixed(1)}°`}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    margin: 16
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E0E0E0',
    overflow: 'hidden',
    marginBottom: 8
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.secondary
  },
  guidance: {
    fontSize: typography.body,
    color: colors.text.primary,
    fontWeight: '600'
  },
  success: {
    color: colors.secondary
  },
  metrics: {
    fontSize: typography.small,
    color: colors.text.secondary,
    marginTop: 4
  }
});
