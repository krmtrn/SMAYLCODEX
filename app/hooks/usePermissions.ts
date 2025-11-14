import { useCallback, useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { Camera } from 'expo-camera';
import { DeviceMotion } from 'expo-sensors';
import * as Application from 'expo-application';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Linking from 'expo-linking';

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

interface PermissionState {
  camera: PermissionStatus;
  motion: PermissionStatus;
}

export function usePermissions() {
  const [state, setState] = useState<PermissionState>({ camera: 'undetermined', motion: 'undetermined' });

  const refreshPermissions = useCallback(async () => {
    const cameraStatus = await Camera.getCameraPermissionsAsync();
    const motionStatus = await DeviceMotion.isAvailableAsync()
      ? await DeviceMotion.getPermissionsAsync()
      : { status: 'denied' };

    setState({
      camera: mapExpoStatus(cameraStatus.status),
      motion: mapExpoStatus(motionStatus.status as Camera.PermissionStatus)
    });
  }, []);

  useEffect(() => {
    refreshPermissions();
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') {
        refreshPermissions();
      }
    });
    return () => subscription.remove();
  }, [refreshPermissions]);

  const requestPermissions = useCallback(async () => {
    const camera = await Camera.requestCameraPermissionsAsync();
    const motion = await DeviceMotion.requestPermissionsAsync();
    setState({ camera: mapExpoStatus(camera.status), motion: mapExpoStatus(motion.status as Camera.PermissionStatus) });
  }, []);

  const openSettings = useCallback(async () => {
    if (Platform.OS === 'android') {
      const pkg = Application.applicationId ?? '';
      await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS, {
        data: `package:${pkg}`
      });
    } else {
      await Linking.openSettings();
    }
  }, []);

  return {
    ...state,
    refreshPermissions,
    requestPermissions,
    openSettings,
    isGranted: state.camera === 'granted' && state.motion === 'granted'
  };
}

function mapExpoStatus(status: Camera.PermissionStatus): PermissionStatus {
  switch (status) {
    case 'granted':
      return 'granted';
    case 'denied':
      return 'denied';
    default:
      return 'undetermined';
  }
}
