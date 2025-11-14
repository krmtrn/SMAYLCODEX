import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

export interface ImageQualityCheck {
  isAcceptable: boolean;
  issues: string[];
  score: number;
  dimensions?: { width: number; height: number };
}

export async function checkImageQuality(uri: string): Promise<ImageQualityCheck> {
  const fileInfo = await FileSystem.getInfoAsync(uri);
  if (!fileInfo.exists || !fileInfo.size || fileInfo.size < 50_000) {
    return { isAcceptable: false, issues: ['Image file too small'], score: 0 };
  }

  const { width, height } = await extractDimensions(uri);
  if (!width || !height || width < 600 || height < 600) {
    return {
      isAcceptable: false,
      issues: ['Image resolution too low'],
      score: 20,
      dimensions: { width: width ?? 0, height: height ?? 0 }
    };
  }

  return { isAcceptable: true, issues: [], score: 85, dimensions: { width, height } };
}

export async function compressImage(uri: string, quality: number, maxDimension: number) {
  const { width, height } = await extractDimensions(uri);
  const actions: ImageManipulator.Action[] = [];
  if (width && height) {
    const scale = maxDimension / Math.max(width, height);
    if (scale < 1) {
      actions.push({ resize: { width: Math.round(width * scale), height: Math.round(height * scale) } });
    }
  }

  const result = await ImageManipulator.manipulateAsync(uri, actions, {
    compress: quality,
    format: ImageManipulator.SaveFormat.JPEG
  });
  return { uri: result.uri, width: result.width ?? width ?? 0, height: result.height ?? height ?? 0 };
}

export async function createThumbnail(uri: string) {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 300 } }],
    { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
}

async function extractDimensions(uri: string) {
  const result = await ImageManipulator.manipulateAsync(uri, [], {
    compress: 1,
    format: ImageManipulator.SaveFormat.JPEG
  });
  if (result.uri && result.uri !== uri) {
    await FileSystem.deleteAsync(result.uri, { idempotent: true });
  }
  return { width: result.width, height: result.height };
}
