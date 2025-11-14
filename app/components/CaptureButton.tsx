import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface CaptureButtonProps {
  onPress: () => void;
  disabled?: boolean;
  label?: string;
}

export const CaptureButton: React.FC<CaptureButtonProps> = ({ onPress, disabled, label = 'Capture Now' }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.button, disabled && styles.disabled]}
      accessibilityRole="button"
      disabled={disabled}
    >
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.sm
  },
  label: {
    color: colors.text.inverse,
    fontSize: typography.body,
    fontWeight: '600'
  },
  disabled: {
    backgroundColor: '#B0C4DE'
  }
});
