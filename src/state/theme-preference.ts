import { useEffect, useSyncExternalStore } from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

export type ThemePreference = "system" | "light" | "dark";
const key = "vault-theme-preference";
let preference: ThemePreference = "system";
let initialized = false;
let ready = false;
let revision = 0;
let writes = Promise.resolve();
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};
const emit = () => listeners.forEach((listener) => listener());
async function initialize() {
  if (initialized) return;
  initialized = true;
  const initialRevision = revision;
  try {
    const saved = Platform.OS === "web" ? localStorage.getItem(key) : await SecureStore.getItemAsync(key);
    if (revision === initialRevision && (saved === "light" || saved === "dark" || saved === "system")) {
      preference = saved;
    }
  } catch { /* Use the system theme if storage is unavailable. */ }
  finally {
    ready = true;
    emit();
  }
}
export function useThemePreference() {
  const value = useSyncExternalStore(subscribe, () => preference, () => "system" as ThemePreference);
  useEffect(() => { void initialize(); }, []);
  return value;
}
export function useThemePreferenceReady() {
  const value = useSyncExternalStore(subscribe, () => ready, () => false);
  useEffect(() => { void initialize(); }, []);
  return value;
}
export function setThemePreference(value: ThemePreference) {
  revision += 1;
  preference = value;
  emit();
  const write = writes.then(async () => {
    if (Platform.OS === "web") localStorage.setItem(key, value);
    else await SecureStore.setItemAsync(key, value);
  });
  writes = write.catch(() => {});
  return write;
}
