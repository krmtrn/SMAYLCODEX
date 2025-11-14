import React, { useMemo } from 'react';
import { FlatList, Image, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { captureStore } from '../store/captureStore';
import { StepId } from '../types/capture';
import { STEPS } from '../config/stepsConfig';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { storageService } from '../services/storageService';

interface ReviewItem {
  id: StepId;
  title: string;
  description: string;
  thumbnailUri?: string;
  captured: boolean;
}

type Props = NativeStackScreenProps<RootStackParamList, 'Review'>;

const ReviewScreen: React.FC<Props> = ({ navigation }) => {
  const captures = captureStore((state) => state.captures);
  const goToStep = captureStore((state) => state.setCurrentStepIndex);

  const data = useMemo<ReviewItem[]>(() => {
    return STEPS.map((step) => {
      const capture = captures.find((item) => item.stepId === step.id);
      return {
        id: step.id,
        title: step.title,
        description: step.description,
        thumbnailUri: capture?.thumbnailUri,
        captured: Boolean(capture)
      };
    });
  }, [captures]);

  const isComplete = data.every((item) => item.captured);

  const handleRetake = (stepId: StepId) => {
    const index = STEPS.findIndex((step) => step.id === stepId);
    captureStore.getState().retake(stepId);
    goToStep(index);
    navigation.navigate('Capture', { stepIndex: index });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Review Your Photos</Text>
      <FlatList
        data={data}
        numColumns={2}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.thumbnailWrapper}>
              {item.thumbnailUri ? (
                <Image source={{ uri: item.thumbnailUri }} style={styles.thumbnail} />
              ) : (
                <View style={styles.placeholder}>
                  <Text style={styles.placeholderText}>Not Captured</Text>
                </View>
              )}
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDescription}>{item.description}</Text>
            <Button mode="outlined" onPress={() => handleRetake(item.id)}>
              {item.captured ? 'Retake' : 'Capture'}
            </Button>
          </View>
        )}
      />
      <Button
        mode="contained"
        disabled={!isComplete}
        style={styles.submitButton}
        onPress={async () => {
          if (isComplete) {
            await storageService.clearSession();
            captureStore.getState().reset();
            navigation.replace('Intro');
          }
        }}
      >
        Submit All Photos
      </Button>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg
  },
  title: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.text.primary,
    marginVertical: spacing.lg,
    textAlign: 'center'
  },
  listContent: {
    paddingBottom: spacing.xl
  },
  card: {
    flex: 1,
    margin: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12
  },
  thumbnailWrapper: {
    height: 140,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    backgroundColor: '#D9D9D9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  thumbnail: {
    width: '100%',
    height: '100%'
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1
  },
  placeholderText: {
    color: colors.text.secondary,
    fontSize: typography.small
  },
  cardTitle: {
    fontSize: typography.subtitle,
    fontWeight: '600',
    marginBottom: spacing.xs,
    color: colors.text.primary
  },
  cardDescription: {
    fontSize: typography.small,
    color: colors.text.secondary,
    marginBottom: spacing.sm
  },
  submitButton: {
    marginBottom: spacing.xl
  }
});

export default ReviewScreen;
