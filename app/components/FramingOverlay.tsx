import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';
import { FramingHint } from '../types/capture';

interface FramingOverlayProps {
  hint: FramingHint;
  isAligned: boolean;
}

export const FramingOverlay: React.FC<FramingOverlayProps> = ({ hint, isAligned }) => {
  const overlayStyle = {
    left: `${(hint.position.x - hint.position.width / 2) * 100}%`,
    top: `${(hint.position.y - hint.position.height / 2) * 100}%`,
    width: `${hint.position.width * 100}%`,
    height: `${hint.position.height * 100}%`
  };

  return (
    <View pointerEvents="none" style={styles.container}>
      <View style={[styles.overlay, overlayStyle, isAligned && styles.aligned]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center'
  },
  overlay: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 300,
    borderColor: colors.overlay.guideline
  },
  aligned: {
    borderColor: colors.overlay.success,
    backgroundColor: colors.overlay.success
  }
});
