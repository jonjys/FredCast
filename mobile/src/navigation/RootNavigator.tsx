import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { QrScanScreen } from '../screens/QrScanScreen';
import { LiveScreen } from '../screens/LiveScreen';
import { QueueScreen } from '../screens/QueueScreen';
import { GroupsScreen } from '../screens/GroupsScreen';
import { useAutoConnectFromUrl } from '../cast/useAutoConnectFromUrl';
import { AutoConnectBanner } from '../components/AutoConnectBanner';
import { CastHeaderButton } from '../components/CastHeaderButton';
import { ConnectToSheet } from '../components/ConnectToSheet';

const Tab = createBottomTabNavigator();

const TAB_ICON: Record<string, IconName> = {
  Idag: 'home',
  Bibliotek: 'grid',
  Skärmar: 'tv',
  Kö: 'doc',
  Grupper: 'user',
  Inställningar: 'gear',
};

export function RootNavigator() {
  const t = useTheme();
  const [nowPlayingOpen, setNowPlayingOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [connectToOpen, setConnectToOpen] = useState(false);
  const [liveOpen, setLiveOpen] = useState(false);
  const autoConnectStatus = useAutoConnectFromUrl();
  const insets = useSafeAreaInsets();

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
            tabBarIcon: ({ color, size }) => (
              <Icon name={TAB_ICON[route.name] || 'doc'} size={size * 0.82} color={color} />
            ),
          })}
        >
          <Tab.Screen name="Idag">
            {({ navigation }) => (
              <TodayScreen
                onOpenLibrary={() => navigation.navigate('Bibliotek')}
                onOpenLive={() => setLiveOpen(true)}
              />
            )}
          </Tab.Screen>
          <Tab.Screen name="Bibliotek">
            {() => <LibraryScreen onOpenNowPlaying={() => setNowPlayingOpen(true)} />}
          </Tab.Screen>
          <Tab.Screen name="Skärmar">
            {() => (
              <DevicesScreen onOpenQr={() => setQrOpen(true)} onOpenScan={() => setScanOpen(true)} />
            )}
          </Tab.Screen>
          <Tab.Screen name="Kö" component={QueueScreen} />
          <Tab.Screen name="Grupper" component={GroupsScreen} />
          <Tab.Screen name="Inställningar" component={SettingsScreen} />
        </Tab.Navigator>
      </NavigationContainer>

      <View style={[styles.headerOverlay, { top: insets.top + 10 }]} pointerEvents="box-none">
        <CastHeaderButton onPress={() => setConnectToOpen(true)} />
      </View>

      {autoConnectStatus !== 'idle' ? (
        <View style={[styles.autoConnectOverlay, { top: insets.top + 54 }]} pointerEvents="box-none">
          <AutoConnectBanner status={autoConnectStatus} />
        </View>
      ) : null}

      <NowPlayingScreen visible={nowPlayingOpen} onClose={() => setNowPlayingOpen(false)} />
      <QrConnectScreen visible={qrOpen} onClose={() => setQrOpen(false)} />
      <QrScanScreen visible={scanOpen} onClose={() => setScanOpen(false)} />
      <LiveScreen visible={liveOpen} onClose={() => setLiveOpen(false)} />
      <ConnectToSheet
        visible={connectToOpen}
        onClose={() => setConnectToOpen(false)}
        onAddScreen={() => setQrOpen(true)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  autoConnectOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 34,
  },
});
