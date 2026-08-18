import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
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
import { CastBubble } from '../components/CastBubble';

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
  const [scanOpen, setScanOpen] = useState(false);
  const [connectToOpen, setConnectToOpen] = useState(false);
  const [liveOpen, setLiveOpen] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const [groupsOpen, setGroupsOpen] = useState(false);
  const [groupsTick, setGroupsTick] = useState(0);
  const autoConnectStatus = useAutoConnectFromUrl();
  const insets = useSafeAreaInsets();
  const tabBarHeight = 52 + Math.max(insets.bottom, 8);

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
            tabBarStyle: {
              backgroundColor: t.colors.bg,
              borderTopColor: t.colors.border,
              height: tabBarHeight,
              paddingTop: 6,
              paddingBottom: Math.max(insets.bottom, 8),
            },
            tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
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
                onOpenDevices={() => navigation.navigate('Skärmar')}
                onOpenQr={() => setQrOpen(true)}
                onOpenGroups={() => setGroupsOpen(true)}
                onOpenNowPlaying={() => setNowPlayingOpen(true)}
                groupsTick={groupsTick}
              />
            )}
          </Tab.Screen>
          <Tab.Screen name="Bibliotek">
            {() => <LibraryScreen onOpenNowPlaying={() => setNowPlayingOpen(true)} />}
          </Tab.Screen>
          <Tab.Screen name="Skärmar">
            {() => (
              <DevicesScreen
                onOpenQr={() => setQrOpen(true)}
                onOpenScan={() => setScanOpen(true)}
                onOpenQueue={() => setQueueOpen(true)}
                onOpenGroups={() => setGroupsOpen(true)}
              />
            )}
          </Tab.Screen>
          <Tab.Screen name="Inställningar" component={SettingsScreen} />
        </Tab.Navigator>
      </NavigationContainer>

      <CastBubble onPress={() => setNowPlayingOpen(true)} tabBarHeight={tabBarHeight} />

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

      <Modal visible={queueOpen} animationType="slide" onRequestClose={() => setQueueOpen(false)} presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: t.colors.bg, paddingTop: 12 }}>
          <Pressable onPress={() => setQueueOpen(false)} style={styles.sheetClose} hitSlop={12}>
            <Text style={{ color: t.colors.textDim, fontWeight: '600' }}>Stäng</Text>
          </Pressable>
          <QueueScreen />
        </View>
      </Modal>

      <Modal visible={groupsOpen} animationType="slide" onRequestClose={() => setGroupsOpen(false)} presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: t.colors.bg, paddingTop: 12 }}>
          <Pressable onPress={() => setGroupsOpen(false)} style={styles.sheetClose} hitSlop={12}>
            <Text style={{ color: t.colors.textDim, fontWeight: '600' }}>Stäng</Text>
          </Pressable>
          <GroupsScreen
            onChanged={() => {
              setGroupsTick((n) => n + 1);
            }}
          />
        </View>
      </Modal>
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
  sheetClose: { paddingHorizontal: 20, paddingVertical: 8, alignSelf: 'flex-end' },
});
