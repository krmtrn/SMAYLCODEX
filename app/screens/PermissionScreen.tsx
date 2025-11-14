import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { usePermissions } from '../hooks/usePermissions';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'Permissions'>;

const PermissionScreen: React.FC<Props> = ({ navigation }) => {
  const { camera, motion, requestPermissions, openSettings } = usePermissions();

  const denied = camera === 'denied' || motion === 'denied';

  const handleRequest = async () => {
    if (denied) {
      await openSettings();
    } else {
      await requestPermissions();
      navigation.replace('Capture');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🎥📱</Text>
      <Text style={styles.title}>Camera and Sensors Required</Text>
      <Text style={styles.description}>We need camera access to take your photos and motion sensors to guide you to the correct angle.</Text>
      {denied && <Text style={styles.warning}>You previously denied permissions. Please enable them in system settings.</Text>}
      <Button mode="contained" onPress={handleRequest} style={styles.button}>
        {denied ? 'Open Settings' : 'Grant Permissions'}
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background
  },
  icon: {
    fontSize: 48,
    marginBottom: spacing.lg
  },
  title: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.md,
    textAlign: 'center'
  },
  description: {
    fontSize: typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg
  },
  warning: {
    color: colors.warning,
    textAlign: 'center',
    marginBottom: spacing.md
  },
  button: {
    alignSelf: 'stretch'
  }
});

export default PermissionScreen;
