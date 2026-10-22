import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, Modal, Platform, Pressable, Text, View } from 'react-native';
import * as Application from 'expo-application';
import * as FileSystem from 'expo-file-system/legacy';
import type { DownloadResumable } from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as SecureStore from 'expo-secure-store';
import { forceRefresh } from '@/api/client';
import { getAuthUser } from '@/api/auth';
import { useTheme } from '@/hooks/use-theme';
import { loadNotifications } from '@/notifications/notificationModule';
import { decideUpdate, fetchUpdateMetadata, isCompleteApkDownload, isValidUpdateMetadata } from './updateLogic';

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
const DISMISSED_UPDATE_KEY = 'vault.dismissedUpdateCode';
const READY_UPDATE_KEY = 'vault.readyUpdateApk';
const APK_PATH = `${FileSystem.cacheDirectory}vault-update.apk`;

type Metadata = {
  latestVersion: string;
  latestVersionCode: number;
  minimumSupportedVersionCode: number;
  apkUrl: string;
  releaseNotes: string;
  mandatory: boolean;
};

type ReadyUpdate = { metadata: Metadata; uri: string };

export default function AppUpdateManager({ enabled }: { enabled: boolean }) {
  const theme = useTheme();
  const [update, setUpdate] = useState<Metadata | null>(null);
  const [readyUpdate, setReadyUpdate] = useState<ReadyUpdate | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [backgroundDownload, setBackgroundDownload] = useState(false);
  const [downloadingMetadata, setDownloadingMetadata] = useState<Metadata | null>(null);
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

  useEffect(() => {
    if (!enabled || Platform.OS !== 'android') return;
    let active = true;
    void SecureStore.getItemAsync(READY_UPDATE_KEY).then(async stored => {
      if (!stored) return;
      try {
        const saved = JSON.parse(stored) as { metadata?: unknown; uri?: unknown };
        const installedCode = Number(Application.nativeBuildVersion);
        if (!isValidUpdateMetadata(saved.metadata) || typeof saved.uri !== 'string') {
          await SecureStore.deleteItemAsync(READY_UPDATE_KEY);
          return;
        }
        const metadata = saved.metadata as Metadata;
        if (!Number.isSafeInteger(installedCode) || metadata.latestVersionCode <= installedCode) {
          await SecureStore.deleteItemAsync(READY_UPDATE_KEY);
          return;
        }
        const info = await FileSystem.getInfoAsync(saved.uri);
        if (!info.exists || info.isDirectory || info.size < 1024 * 1024) {
          await SecureStore.deleteItemAsync(READY_UPDATE_KEY);
          return;
        }
        if (active) {
          const ready = { metadata, uri: saved.uri };
          setReadyUpdate(ready);
          setUpdate(ready.metadata);
        }
      } catch {
        await SecureStore.deleteItemAsync(READY_UPDATE_KEY);
      }
    }).catch(() => Alert.alert('Update unavailable', 'Vault could not restore the downloaded update. Please check for updates and try again.'));
    return () => { active = false; };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !readyUpdate) return;
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') setUpdate(current => current ?? readyUpdate.metadata);
    });
    return () => subscription.remove();
  }, [enabled, readyUpdate]);

  const later = async () => {
    if (update && !update.mandatory && !readyUpdate) {
      dismissed.current = String(update.latestVersionCode);
      await SecureStore.setItemAsync(DISMISSED_UPDATE_KEY, dismissed.current);
    }
    setUpdate(null);
  };

  const downloadApk = async (metadata: Metadata) => {
    try {
      const old = await FileSystem.getInfoAsync(APK_PATH);
      if (old.exists) await FileSystem.deleteAsync(APK_PATH, { idempotent: true });
      const task = FileSystem.createDownloadResumable(metadata.apkUrl, APK_PATH, {}, result => {
        if (result.totalBytesExpectedToWrite > 0) setProgress(Math.min(1, result.totalBytesWritten / result.totalBytesExpectedToWrite));
      });
      download.current = task;
      const result = await task.downloadAsync();
      if (cancelled.current) return;
      if (!result?.uri || result.status !== 200) throw new Error('The APK download did not complete.');
      const info = await FileSystem.getInfoAsync(result.uri);
      if (!isCompleteApkDownload(result, info)) throw new Error('The downloaded file is empty, incomplete, or not an APK response.');
      return result.uri;
    } finally {
      download.current = null;
    }
  };

  const install = async () => {
    if (!update || busy) return;
    setBusy(true);
    cancelled.current = false;
    setProgress(0);
    try {
      const uri = readyUpdate?.metadata.latestVersionCode === update.latestVersionCode
        ? readyUpdate.uri
        : await downloadApk(update);
      if (cancelled.current) return;
      if (!uri) throw new Error('The APK download did not complete.');
      const contentUri = await FileSystem.getContentUriAsync(uri);
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        type: 'application/vnd.android.package-archive',
        flags: 1,
      });
      await SecureStore.deleteItemAsync(READY_UPDATE_KEY);
      setReadyUpdate(null);
      setUpdate(null);
    } catch (error) {
      if (cancelled.current) return;
      const message = error instanceof Error ? error.message : 'The update could not be downloaded or opened.';
      Alert.alert('Update unavailable', `Vault could not download or open the update. ${message}`);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const downloadInBackground = async () => {
    if (!update || busy) return;
    const metadata = update;
    setBusy(true);
    setBackgroundDownload(true);
    setDownloadingMetadata(metadata);
    setProgress(0);
    cancelled.current = false;
    try {
      const notifications = loadNotifications();
      if (Platform.OS === 'android') await notifications.setNotificationChannelAsync('vault_automatic', {
        name: 'Automatic Vault reminders',
        importance: notifications.AndroidImportance.DEFAULT,
      });
      let permission = await notifications.getPermissionsAsync();
      if (!permission.granted) permission = await notifications.requestPermissionsAsync();
      if (!permission.granted) throw new Error('Allow notifications in your phone settings to be notified when the APK is ready.');
      if (cancelled.current) return;

      setUpdate(null);
      const uri = await downloadApk(metadata);
      if (cancelled.current) return;
      if (!uri) throw new Error('The APK download did not complete.');
      const ready = { metadata, uri };
      await SecureStore.setItemAsync(READY_UPDATE_KEY, JSON.stringify(ready));
      setReadyUpdate(ready);
      setUpdate(metadata);

      const user = await getAuthUser();
      try {
        await notifications.scheduleNotificationAsync({
          content: {
            title: 'Vault update ready',
            body: `Vault ${metadata.latestVersion} has downloaded. Open Vault to install it.`,
            data: { kind: 'apk_update_ready', userId: String(user?._id || user?.id || '') },
            ...(Platform.OS === 'android' ? { sound: 'default', channelId: 'vault_automatic' } : {}),
          },
          trigger: null,
        });
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'Notification scheduling failed.';
        Alert.alert('Update downloaded', `The APK is ready to install, but Vault could not post a notification. ${reason}`);
      }
    } catch (error) {
      if (cancelled.current) return;
      const message = error instanceof Error ? error.message : 'The APK could not be downloaded in the background.';
      setUpdate(metadata);
      Alert.alert('Background download unavailable', message);
    } finally {
      download.current = null;
      setBusy(false);
      setBackgroundDownload(false);
      setDownloadingMetadata(null);
      setProgress(null);
    }
  };

  const cancelDownload = async () => {
    cancelled.current = true;
    try { await download.current?.cancelAsync(); } catch { /* The task may have completed at the same time. */ }
    download.current = null;
    if (backgroundDownload && downloadingMetadata) setUpdate(downloadingMetadata);
    setBusy(false);
    setBackgroundDownload(false);
    setDownloadingMetadata(null);
    setProgress(null);
  };

  const backgroundPercent = progress === null ? 0 : Math.round(progress * 100);
  const backgroundBanner = backgroundDownload ? (
    <View pointerEvents="box-none" style={{ position: 'absolute', top: 48, left: 16, right: 16, zIndex: 1001, alignItems: 'center' }}>
      <View style={{ width: '100%', maxWidth: 500, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.backgroundElement }}>
        <Text style={{ color: theme.text, fontWeight: '700' }}>Downloading Vault {downloadingMetadata?.latestVersion ?? 'update'} in background… {backgroundPercent}%</Text>
        <Pressable accessibilityRole="button" onPress={() => void cancelDownload()} style={{ alignSelf: 'flex-end', paddingTop: 10 }}>
          <Text style={{ color: theme.accent, fontWeight: '600' }}>Cancel download</Text>
        </Pressable>
      </View>
    </View>
  ) : null;
  if (!update) return backgroundBanner;
  const percent = progress === null ? 0 : Math.round(progress * 100);
  return (
    <>
    {backgroundBanner}
    <Modal transparent animationType="fade" visible onRequestClose={() => { if (!update.mandatory && !busy) void later(); else if (busy) void cancelDownload(); }}>
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#0008' }}>
        <View style={{ backgroundColor: theme.backgroundElement, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: theme.border }}>
          <Text style={{ color: theme.text, fontSize: 20, fontWeight: '700', marginBottom: 8 }}>A new version of Vault is available</Text>
          <Text style={{ color: theme.textSecondary, marginBottom: 12 }}>{readyUpdate?.metadata.latestVersionCode === update.latestVersionCode ? 'Downloaded and ready to install' : `Version ${update.latestVersion}${update.mandatory ? ' · Required update' : ''}`}</Text>
          <Text style={{ color: theme.text, lineHeight: 22, marginBottom: 20 }}>{update.releaseNotes}</Text>
          {busy && <View style={{ marginBottom: 18 }}><Text style={{ color: theme.text, marginBottom: 8 }}>{progress === null ? 'Preparing installer…' : `Downloading update… ${percent}%`}</Text><View style={{ height: 6, backgroundColor: theme.border, borderRadius: 4, overflow: 'hidden' }}><View style={{ width: `${percent}%`, height: 6, backgroundColor: theme.accent }} /></View></View>}
          <Pressable disabled={busy} onPress={() => void install()} style={{ minHeight: 48, borderRadius: 12, backgroundColor: theme.accent, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
            {busy && <ActivityIndicator color={theme.backgroundElement} style={{ marginRight: 8 }} />}
            <Text style={{ color: theme.backgroundElement, fontWeight: '700' }}>{busy ? 'Downloading…' : readyUpdate?.metadata.latestVersionCode === update.latestVersionCode ? 'Install update' : 'Update Now'}</Text>
          </Pressable>
          {!busy && !readyUpdate && <Pressable accessibilityRole="button" onPress={() => void downloadInBackground()} style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
            <Text style={{ color: theme.accent, fontWeight: '600' }}>Download in background</Text>
          </Pressable>}
          <Pressable disabled={busy} onPress={() => void later()} style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
            <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>{update.mandatory ? 'Continue for now' : 'Later'}</Text>
          </Pressable>
          {!busy && <Text style={{ color: theme.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 8 }}>Android may ask you to allow installs from Vault, then confirm the update.</Text>}
        </View>
      </View>
    </Modal>
    </>
  );
}
