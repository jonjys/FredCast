import React, { useState } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../theme/ThemeProvider';
import { Icon, IconName } from '../icons/Icon';
import { TodayScreen } from '../screens/TodayScreen';
import { LibraryScreen } from '../screens/LibraryScreen';
import { DevicesScreen } from '../screens/DevicesScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { NowPlayingScreen } from '../screens/NowPlayingScreen';
import { QrConnectScreen } from '../screens/QrConnectScreen';

const Tab = createBottomTabNavigator();

const TAB_ICON: Record<string, IconName> = {
  Idag: 'home',
  Bibliotek: 'grid',
  Skärmar: 'tv',
  Inställningar: 'gear',
};

export function RootNavigator() {
  const t = useTheme();
  const [nowPlayingOpen, setNowPlayingOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const navTheme = {
    ...(t.scheme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(t.scheme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: t.colors.bg,
      card: t.colors.bg,
      text: t.colors.text,
      border: t.colors.border,
      primary: t.colors.accent,
    },
  };

  return (
    <>
      <NavigationContainer theme={navTheme}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: t.colors.accent,
            tabBarInactiveTintColor: t.colors.textFaint,
            tabBarStyle: { backgroundColor: t.colors.bg, borderTopColor: t.colors.border },
            tabBarLabelStyle: { fontSize: 10 },
            tabBarIcon: ({ color, size }) => <Icon name={TAB_ICON[route.name]} size={size * 0.82} color={color} />,
          })}
        >
          <Tab.Screen name="Idag">
            {({ navigation }) => <TodayScreen onOpenLibrary={() => navigation.navigate('Bibliotek')} />}
          </Tab.Screen>
          <Tab.Screen name="Bibliotek">
            {() => <LibraryScreen onOpenNowPlaying={() => setNowPlayingOpen(true)} />}
          </Tab.Screen>
          <Tab.Screen name="Skärmar">{() => <DevicesScreen onOpenQr={() => setQrOpen(true)} />}</Tab.Screen>
          <Tab.Screen name="Inställningar" component={SettingsScreen} />
        </Tab.Navigator>
      </NavigationContainer>

      <NowPlayingScreen visible={nowPlayingOpen} onClose={() => setNowPlayingOpen(false)} />
      <QrConnectScreen visible={qrOpen} onClose={() => setQrOpen(false)} />
    </>
  );
}
