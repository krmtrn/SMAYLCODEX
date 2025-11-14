import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { usePermissions } from '../hooks/usePermissions';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

const INTRO_POINTS = [
  'Capture 5 photos from different angles',
  'Follow on-screen guidance for each shot',
  'Takes approximately 2 minutes',
  'Photos stored securely on your device'
];

type Props = NativeStackScreenProps<RootStackParamList, 'Intro'>;

const IntroScreen: React.FC<Props> = ({ navigation }) => {
  const { camera, motion, requestPermissions, isGranted } = usePermissions();

  useEffect(() => {
    if (isGranted) {
      navigation.replace('Capture');
    }
  }, [isGranted, navigation]);

  const handleStart = async () => {
    await requestPermissions();
    if (camera === 'granted' && motion === 'granted') {
      navigation.navigate('Capture');
    } else {
      navigation.navigate('Permissions');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <View style={styles.iconPlaceholder} />
        <Text style={styles.title}>Hair Assessment Self-Capture</Text>
        <Text style={styles.subtitle}>We will guide you step-by-step to collect the photos your clinician needs.</Text>
      </View>
      <View style={styles.points}>
        {INTRO_POINTS.map((point) => (
          <View key={point} style={styles.pointRow}>
            <View style={styles.bullet} />
            <Text style={styles.pointText}>{point}</Text>
          </View>
        ))}
      </View>
      <Button mode="contained" onPress={handleStart} style={styles.button}>
        Get Started
      </Button>
      <Text style={styles.footer}>You'll be asked for camera and motion sensor access</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    flexGrow: 1,
    justifyContent: 'center',
    backgroundColor: colors.background
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xl
  },
  iconPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: colors.primary,
    marginBottom: spacing.lg
  },
  title: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm
  },
  points: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondary,
    marginRight: spacing.md
  },
  pointText: {
    fontSize: typography.body,
    color: colors.text.primary,
    flex: 1
  },
  button: {
    marginBottom: spacing.md
  },
  footer: {
    textAlign: 'center',
    color: colors.text.secondary,
    fontSize: typography.small
  }
});

export default IntroScreen;
