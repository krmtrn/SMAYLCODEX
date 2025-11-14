import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import IntroScreen from '../screens/IntroScreen';
import CaptureFlowScreen from '../screens/CaptureFlowScreen';
import ReviewScreen from '../screens/ReviewScreen';
import PermissionScreen from '../screens/PermissionScreen';
import { restoreSession } from '../services/sessionService';

export type RootStackParamList = {
  Intro: undefined;
  Permissions: undefined;
  Capture: { stepIndex?: number } | undefined;
  Review: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    restoreSession().finally(() => setIsReady(true));
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Intro" component={IntroScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="Permissions"
          component={PermissionScreen}
          options={{ title: 'Permissions Required' }}
        />
        <Stack.Screen name="Capture" component={CaptureFlowScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Review" component={ReviewScreen} options={{ title: 'Review Photos' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
