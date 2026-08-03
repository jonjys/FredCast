import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/theme/ThemeProvider';
import { CastProvider } from './src/cast/CastProvider';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <CastProvider>
          <RootNavigator />
          <StatusBar style="auto" />
        </CastProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
