import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useCast } from '../cast/CastProvider';
import { RELAY_HTTP_URL } from '../cast/config';
import { StoredGroup, clearGroup, formatGroupCode, loadGroup, saveGroup } from '../cast/groupStorage';

/**
 * Grupper — 6-siffrig kod + nickname. INGEN Clerk / email / sign-in.
 * Ex: "Midsommar 2026" → kod 323891 → dela koden.
 */
export function GroupsScreen({ onChanged }: { onChanged?: () => void }) {
  const t = useTheme();
  const { pairWithCode, connectedDevice } = useCast();
  const [group, setGroup] = useState<StoredGroup | null>(null);
  const [mode, setMode] = useState<'home' | 'create' | 'join'>('home');
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    setGroup(loadGroup());
  }, []);

  const persist = (g: StoredGroup) => {
    saveGroup(g);
    setGroup(g);
    onChanged?.();
  };

  const createGroup = useCallback(async () => {
    const n = name.trim();
    const nick = nickname.trim() || 'Admin';
    if (!n) {
      setError('Ge gruppen ett namn (t.ex. Midsommar 2026)');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${RELAY_HTTP_URL}/api/groups/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: n, nickname: nick }),
      });
      const data = await res.json();
      if (!res.ok || !data.code) throw new Error(data.error || 'Kunde inte skapa grupp');
      persist({
        code: String(data.code),
        name: data.name || n,
        nickname: nick,
        role: 'admin',
        token: data.admin_token || data.token || '',
        savedAt: Date.now(),
      });
      setMode('home');
      setInfo(`Grupp skapad. Dela koden ${formatGroupCode(String(data.code))}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nätverksfel mot relay');
    } finally {
      setBusy(false);
    }
  }, [name, nickname, onChanged]);

  const joinGroup = useCallback(async () => {
    const digits = code.replace(/\D/g, '').slice(0, 6);
    const nick = nickname.trim() || 'Gäst';
    if (digits.length !== 6) {
      setError('Koden måste vara 6 siffror');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${RELAY_HTTP_URL}/api/groups/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: digits, nickname: nick }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kunde inte gå med');
      persist({
        code: digits,
        name: data.name || 'Grupp',
        nickname: nick,
        role: 'member',
        token: data.member_token || data.token || '',
        savedAt: Date.now(),
      });
      setMode('home');
      setInfo(`Med i ${data.name || 'grupp'}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nätverksfel mot relay');
    } finally {
      setBusy(false);
    }
  }, [code, nickname, onChanged]);

  const linkTv = useCallback(async () => {
    if (!group) return;
    setBusy(true);
    setError(null);
    try {
      await pairWithCode(group.code);
      setInfo('TV kopplad till gruppkoden — casta som vanligt');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kunde inte para TV');
    } finally {
      setBusy(false);
    }
  }, [group, pairWithCode]);

  const leave = () => {
    clearGroup();
    setGroup(null);
    setInfo(null);
    onChanged?.();
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={[t.type.h1, { color: t.colors.text, marginBottom: 6 }]}>Grupper</Text>
        <Text style={{ color: t.colors.textDim, fontSize: 13, marginBottom: 16 }}>
          6-siffrig kod + nickname. Ingen inloggning.
        </Text>

        {error ? (
          <Text style={{ color: t.colors.danger, marginBottom: 10, fontSize: 13 }}>{error}</Text>
        ) : null}
        {info ? (
          <Text style={{ color: t.colors.accent, marginBottom: 10, fontSize: 13 }}>{info}</Text>
        ) : null}

        {group && mode === 'home' ? (
          <View style={[styles.card, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
            <Text style={{ color: t.colors.text, fontWeight: '700', fontSize: 17 }}>{group.name}</Text>
            <Text
              style={{
                color: t.colors.text,
                fontFamily: 'monospace',
                fontSize: 28,
                letterSpacing: 4,
                marginVertical: 10,
                fontWeight: '700',
              }}
            >
              {formatGroupCode(group.code)}
            </Text>
            <Text style={{ color: t.colors.textDim, fontSize: 13 }}>
              Du är {group.nickname} ({group.role === 'admin' ? 'admin' : 'medlem'})
            </Text>
            {connectedDevice ? (
              <Text style={{ color: t.colors.textDim, fontSize: 12, marginTop: 6 }}>
                TV: {connectedDevice.room} → {connectedDevice.name}
              </Text>
            ) : null}
            <Pressable
              onPress={() => void linkTv()}
              disabled={busy}
              style={[styles.btn, { backgroundColor: t.colors.accent, marginTop: 14 }]}
            >
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Koppla TV till denna kod</Text>}
            </Pressable>
            <Pressable onPress={leave} style={{ paddingVertical: 12, alignItems: 'center' }}>
              <Text style={{ color: t.colors.textDim, fontSize: 13 }}>Lämna grupp</Text>
            </Pressable>
          </View>
        ) : null}

        {!group && mode === 'home' ? (
          <View style={{ gap: 10 }}>
            <Pressable
              onPress={() => {
                setMode('create');
                setError(null);
              }}
              style={[styles.btn, { backgroundColor: t.colors.accent }]}
            >
              <Text style={styles.btnText}>Skapa grupp</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setMode('join');
                setError(null);
              }}
              style={[styles.btn, { backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.border }]}
            >
              <Text style={[styles.btnText, { color: t.colors.text }]}>Gå med i grupp</Text>
            </Pressable>
          </View>
        ) : null}

        {mode === 'create' ? (
          <View style={[styles.card, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
            <Text style={{ color: t.colors.text, fontWeight: '700', marginBottom: 10 }}>Skapa grupp</Text>
            <Text style={styles.label}>Gruppnamn</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Midsommar 2026"
              placeholderTextColor={t.colors.textFaint}
              style={[styles.input, { color: t.colors.text, borderColor: t.colors.border, backgroundColor: t.colors.bg }]}
            />
            <Text style={styles.label}>Ditt nickname</Text>
            <TextInput
              value={nickname}
              onChangeText={setNickname}
              placeholder="Fredrik"
              placeholderTextColor={t.colors.textFaint}
              style={[styles.input, { color: t.colors.text, borderColor: t.colors.border, backgroundColor: t.colors.bg }]}
            />
            <Pressable
              onPress={() => void createGroup()}
              disabled={busy}
              style={[styles.btn, { backgroundColor: t.colors.accent, marginTop: 8 }]}
            >
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Skapa & få kod</Text>}
            </Pressable>
            <Pressable onPress={() => setMode('home')} style={{ paddingVertical: 10, alignItems: 'center' }}>
              <Text style={{ color: t.colors.textDim }}>Avbryt</Text>
            </Pressable>
          </View>
        ) : null}

        {mode === 'join' ? (
          <View style={[styles.card, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
            <Text style={{ color: t.colors.text, fontWeight: '700', marginBottom: 10 }}>Gå med</Text>
            <Text style={styles.label}>6-siffrig kod</Text>
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="323891"
              keyboardType="number-pad"
              maxLength={7}
              placeholderTextColor={t.colors.textFaint}
              style={[
                styles.input,
                { color: t.colors.text, borderColor: t.colors.border, backgroundColor: t.colors.bg, letterSpacing: 4, fontWeight: '700' },
              ]}
            />
            <Text style={styles.label}>Ditt nickname</Text>
            <TextInput
              value={nickname}
              onChangeText={setNickname}
              placeholder="Anna"
              placeholderTextColor={t.colors.textFaint}
              style={[styles.input, { color: t.colors.text, borderColor: t.colors.border, backgroundColor: t.colors.bg }]}
            />
            <Pressable
              onPress={() => void joinGroup()}
              disabled={busy}
              style={[styles.btn, { backgroundColor: t.colors.accent, marginTop: 8 }]}
            >
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Gå med</Text>}
            </Pressable>
            <Pressable onPress={() => setMode('home')} style={{ paddingVertical: 10, alignItems: 'center' }}>
              <Text style={{ color: t.colors.textDim }}>Avbryt</Text>
            </Pressable>
          </View>
        ) : null}

        <Text style={{ color: t.colors.textFaint, fontSize: 12, marginTop: 24, lineHeight: 18 }}>
          Tips: Öppna receiver på TV → "Gruppkod" → samma kod. Alla som castar till koden syns på TV:n.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: 18, paddingBottom: 40 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 },
  label: { fontSize: 12, color: '#9B98A6', marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  btn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
