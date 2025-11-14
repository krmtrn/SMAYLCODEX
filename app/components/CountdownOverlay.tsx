import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

interface CountdownOverlayProps {
  value: number;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ value }) => {
  return (
    <View style={styles.container}>
      <View style={styles.circle}>
        <Text style={styles.text}>{value}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay.countdown,
    justifyContent: 'center',
    alignItems: 'center'
  },
  circle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 6,
    borderColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  text: {
    fontSize: typography.title * 2,
    color: colors.text.inverse,
    fontWeight: '700'
  }
});
