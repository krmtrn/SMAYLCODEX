import React, { useCallback, useEffect, useRef } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { Button } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { StepIndicator } from '../components/StepIndicator';
import { AngleIndicator } from '../components/AngleIndicator';
import { FramingOverlay } from '../components/FramingOverlay';
import { CountdownOverlay } from '../components/CountdownOverlay';
import { CaptureButton } from '../components/CaptureButton';
import { usePermissions } from '../hooks/usePermissions';
import { useDeviceOrientation } from '../hooks/useDeviceOrientation';
import { useCaptureFlow } from '../hooks/useCaptureFlow';
import { storageService } from '../services/storageService';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { useAudioFeedback } from '../hooks/useAudioFeedback';
import { captureStore, selectCurrentStep } from '../store/captureStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Capture'>;

const CaptureFlowScreen: React.FC<Props> = ({ navigation, route }) => {
  const cameraRef = useRef<Camera | null>(null);
  const { camera, motion, requestPermissions, isGranted } = usePermissions();
  const baseState = captureStore((state) => ({
    currentStepIndex: state.currentStepIndex,
    currentStep: selectCurrentStep(state),
    steps: state.steps
  }));

  const orientation = useDeviceOrientation(
    baseState.currentStep.targetOrientation.pitch,
    baseState.currentStep.targetOrientation.roll,
    baseState.currentStep.targetOrientation.tolerance
  );
  const { state, actions } = useCaptureFlow(orientation);
  const { startContinuousFeedback, stopContinuousFeedback, playCountdown, playCapture } = useAudioFeedback();

  useEffect(() => {
    if (!isGranted) {
      requestPermissions();
    }
  }, [isGranted, requestPermissions]);

  useEffect(() => {
    if (camera === 'denied' || motion === 'denied') {
      navigation.replace('Permissions');
    }
  }, [camera, motion, navigation]);

  useEffect(() => {
    if (route.params?.stepIndex !== undefined) {
      actions.goToStep(route.params.stepIndex);
    }
  }, [route.params, actions]);

  useEffect(() => {
    if (state.currentStep.audioStrategy === 'continuous' && orientation.deltaFromTarget && !state.isInCountdown) {
      startContinuousFeedback(orientation.deltaFromTarget.distance);
    } else {
      stopContinuousFeedback();
    }
  }, [state.currentStep.audioStrategy, orientation.deltaFromTarget, startContinuousFeedback, state.isInCountdown, stopContinuousFeedback]);

  useEffect(() => {
    if (state.isInCountdown && state.countdownValue === 3) {
      playCountdown();
    }
  }, [state.isInCountdown, state.countdownValue, playCountdown]);

  useEffect(() => {
    if (state.autoCaptureRequested) {
      handleCapture();
      actions.acknowledgeAutoCapture();
    }
  }, [state.autoCaptureRequested, actions]);

  useEffect(() => {
    if (state.isComplete) {
      navigation.navigate('Review');
    }
  }, [state.isComplete, navigation]);

  const handleCapture = useCallback(async () => {
    try {
      if (!cameraRef.current) {
        throw new Error('Camera unavailable. Please restart the app.');
      }

      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85, skipProcessing: true });
      const capture = await storageService.saveCapture(state.currentStep.id, photo.uri, orientation);
      actions.completeCapture(capture);
      await playCapture();
    } catch (error: any) {
      Alert.alert('Capture failed', error?.message ?? 'Unable to capture photo. Please try again.');
    }
  }, [actions, orientation, playCapture, state.currentStep.id]);

  const handleManualCapture = useCallback(() => {
    handleCapture();
  }, [handleCapture]);

  const handleSkip = useCallback(() => {
    if (state.currentStepIndex >= baseState.steps.length - 1) {
      navigation.navigate('Review');
      return;
    }
    const nextIndex = Math.min(state.currentStepIndex + 1, baseState.steps.length - 1);
    actions.goToStep(nextIndex);
  }, [actions, baseState.steps.length, navigation, state.currentStepIndex]);

  const stepCount = baseState.steps.length;

  if (!isGranted) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StepIndicator current={state.currentStepIndex + 1} total={stepCount} title={state.currentStep.title} />
      <View style={styles.cameraContainer}>
        <Camera
          ref={(ref) => {
            cameraRef.current = ref;
          }}
          style={StyleSheet.absoluteFill}
          type={state.currentStep.cameraFacing === 'front' ? CameraType.front : CameraType.back}
          ratio="4:3"
        />
        <FramingOverlay hint={state.currentStep.framingHint} isAligned={state.canAutoCapture} />
        {state.isInCountdown && state.countdownValue ? <CountdownOverlay value={state.countdownValue} /> : null}
      </View>
      <AngleIndicator
        pitch={orientation.pitch}
        roll={orientation.roll}
        targetPitch={state.currentStep.targetOrientation.pitch}
        targetRoll={state.currentStep.targetOrientation.roll}
        tolerance={state.currentStep.targetOrientation.tolerance}
      />
      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>Tips</Text>
        {state.currentStep.detailedInstructions.map((line) => (
          <Text key={line} style={styles.instructionItem}>
            • {line}
          </Text>
        ))}
      </View>
      <View style={styles.controls}>
        <CaptureButton onPress={handleManualCapture} />
        <Button mode="text" onPress={handleSkip}>
          Skip Step
        </Button>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center'
  },
  instructions: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface
  },
  instructionsTitle: {
    fontSize: typography.subtitle,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm
  },
  instructionItem: {
    fontSize: typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.xs
  },
  controls: {
    padding: spacing.lg,
    alignItems: 'center'
  }
});

export default CaptureFlowScreen;
