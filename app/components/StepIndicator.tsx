import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

interface StepIndicatorProps {
  current: number;
  total: number;
  title: string;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ current, total, title }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.stepText}>{`Step ${current} of ${total}`}</Text>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.surface
  },
  stepText: {
    color: colors.text.secondary,
    fontSize: typography.small,
    marginBottom: 4
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.subtitle,
    fontWeight: '600'
  }
});
