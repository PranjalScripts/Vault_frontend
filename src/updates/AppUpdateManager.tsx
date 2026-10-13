import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, Modal, Platform, Pressable, Text, View } from 'react-native';
import * as Application from 'expo-application';
import * as FileSystem from 'expo-file-system/legacy';
import type { DownloadResumable } from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as SecureStore from 'expo-secure-store';
import { forceRefresh } from '@/api/client';
import { useTheme } from '@/hooks/use-theme';
import { decideUpdate, fetchUpdateMetadata, isCompleteApkDownload } from './updateLogic';

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
const DISMISSED_UPDATE_KEY = 'vault.dismissedUpdateCode';
const APK_PATH = `${FileSystem.cacheDirectory}vault-update.apk`;

type Metadata = {
  latestVersion: string;
  latestVersionCode: number;
  minimumSupportedVersionCode: number;
  apkUrl: string;
  releaseNotes: string;
  mandatory: boolean;
};

export default function AppUpdateManager({ enabled }: { enabled: boolean }) {
  const theme = useTheme();
  const [update, setUpdate] = useState<Metadata | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const lastCheck = useRef(0);
  const dismissed = useRef<string | null>(null);
  const download = useRef<DownloadResumable | null>(null);
  const cancelled = useRef(false);

  const check = useCallback(async (force = false) => {
    if (!enabled || Platform.OS !== 'android' || (!force && Date.now() - lastCheck.current < CHECK_INTERVAL_MS)) return;
    lastCheck.current = Date.now();
    const installedCode = Number(Application.nativeBuildVersion);
    if (!Number.isSafeInteger(installedCode) || installedCode < 1) return;
    try {
      const metadata = await fetchUpdateMetadata(async () => (await forceRefresh('/app-update', { timeout: 10000 })).data) as Metadata | null;
      if (!metadata) return;
      const decision = decideUpdate(installedCode, metadata);
      if (decision !== 'available' && decision !== 'mandatory') {
        setUpdate(null);
        return;
      }
      const dismissedCode = dismissed.current ?? await SecureStore.getItemAsync(DISMISSED_UPDATE_KEY);
      if (decision === 'available' && dismissedCode === String(metadata.latestVersionCode)) return;
      setUpdate(metadata);
    } catch {
      // Updates are best-effort; offline/server errors never block Vault startup.
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled || Platform.OS !== 'android') return;
    void check(true);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') void check();
    });
    return () => {
      subscription.remove();
      void download.current?.pauseAsync().catch(() => undefined);
    };
  }, [enabled, check]);

  const later = async () => {
    if (update && !update.mandatory) {
      dismissed.current = String(update.latestVersionCode);
      await SecureStore.setItemAsync(DISMISSED_UPDATE_KEY, dismissed.current);
    }
    setUpdate(null);
  };

  const install = async () => {
    if (!update || busy) return;
    setBusy(true);
    cancelled.current = false;
    setProgress(0);
    try {
      const old = await FileSystem.getInfoAsync(APK_PATH);
      if (old.exists) await FileSystem.deleteAsync(APK_PATH, { idempotent: true });
      const task = FileSystem.createDownloadResumable(update.apkUrl, APK_PATH, {}, result => {
        if (result.totalBytesExpectedToWrite > 0) setProgress(Math.min(1, result.totalBytesWritten / result.totalBytesExpectedToWrite));
      });
      download.current = task;
      const result = await task.downloadAsync();
      download.current = null;
      if (cancelled.current) return;
      if (!result?.uri || result.status !== 200) throw new Error('The APK download did not complete.');
      const info = await FileSystem.getInfoAsync(result.uri);
      if (!isCompleteApkDownload(result, info)) throw new Error('The downloaded file is empty, incomplete, or not an APK response.');
      const contentUri = await FileSystem.getContentUriAsync(result.uri);
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        type: 'application/vnd.android.package-archive',
        flags: 1,
      });
      setUpdate(null);
    } catch (error) {
      if (cancelled.current) return;
      const message = error instanceof Error ? error.message : 'The update could not be downloaded or opened.';
      Alert.alert('Update unavailable', `Vault could not download or open the update. ${message}`);
    } finally {
      download.current = null;
      setBusy(false);
      setProgress(null);
    }
  };

  const cancelDownload = async () => {
    cancelled.current = true;
    try { await download.current?.cancelAsync(); } catch { /* The task may have completed at the same time. */ }
    download.current = null;
    setBusy(false);
    setProgress(null);
  };

  if (!update) return null;
  const percent = progress === null ? 0 : Math.round(progress * 100);
  return (
    <Modal transparent animationType="fade" visible onRequestClose={() => { if (!update.mandatory && !busy) void later(); else if (busy) void cancelDownload(); }}>
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#0008' }}>
        <View style={{ backgroundColor: theme.backgroundElement, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: theme.border }}>
          <Text style={{ color: theme.text, fontSize: 20, fontWeight: '700', marginBottom: 8 }}>A new version of Vault is available</Text>
          <Text style={{ color: theme.textSecondary, marginBottom: 12 }}>Version {update.latestVersion}{update.mandatory ? ' · Required update' : ''}</Text>
          <Text style={{ color: theme.text, lineHeight: 22, marginBottom: 20 }}>{update.releaseNotes}</Text>
          {busy && <View style={{ marginBottom: 18 }}><Text style={{ color: theme.text, marginBottom: 8 }}>{progress === null ? 'Preparing installer…' : `Downloading update… ${percent}%`}</Text><View style={{ height: 6, backgroundColor: theme.border, borderRadius: 4, overflow: 'hidden' }}><View style={{ width: `${percent}%`, height: 6, backgroundColor: theme.accent }} /></View></View>}
          <Pressable disabled={busy} onPress={() => void install()} style={{ minHeight: 48, borderRadius: 12, backgroundColor: theme.accent, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
            {busy && <ActivityIndicator color={theme.backgroundElement} style={{ marginRight: 8 }} />}
            <Text style={{ color: theme.backgroundElement, fontWeight: '700' }}>{busy ? 'Downloading…' : 'Update Now'}</Text>
          </Pressable>
          <Pressable disabled={busy} onPress={() => void later()} style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
            <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>{update.mandatory ? 'Continue for now' : 'Later'}</Text>
          </Pressable>
          {busy && <Pressable onPress={() => void cancelDownload()} style={{ minHeight: 40, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: theme.textSecondary }}>Cancel download</Text></Pressable>}
          {!busy && <Text style={{ color: theme.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 8 }}>Android may ask you to allow installs from Vault, then confirm the update.</Text>}
        </View>
      </View>
    </Modal>
  );
}
