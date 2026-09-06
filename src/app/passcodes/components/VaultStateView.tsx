import React from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

import type { Passcode } from "../types";
import { styles } from "../styles";
import { PasscodeList } from "./PasscodeList";

export function VaultStateView(props: any) {
  const {
    theme,
    isVaultLoading,
    isVaultCreated,
    isVaultUnlocked,
    loading,
    passcodes,
    search,
    openVaultModal,
    renderPasscode,
  } = props as {
    theme: any;
    isVaultLoading: boolean;
    isVaultCreated: boolean;
    isVaultUnlocked: boolean;
    loading: boolean;
    passcodes: Passcode[];
    search: string;
    openVaultModal: () => void;
    renderPasscode: (item: Passcode, index: number) => React.ReactNode;
  };

  if (isVaultLoading) return <LoadingView theme={theme} label="Checking vault..." />;
  if (!isVaultCreated) return <VaultPrompt theme={theme} icon="🔐" title="Create your vault" text="You don't have a vault yet. Create a vault password to securely store your credentials." buttonLabel="🔐 Create Vault" onPress={openVaultModal} />;
  if (!isVaultUnlocked) return <VaultPrompt theme={theme} icon="🔒" title="Vault is locked" text="Unlock your vault to view your saved credentials." buttonLabel="🔓 Unlock Vault" onPress={openVaultModal} />;
  if (loading) return <LoadingView theme={theme} label="Loading passcodes..." />;
  if (!passcodes.length) return <EmptyPasscodes theme={theme} search={search} />;

  return <PasscodeList passcodes={passcodes} renderPasscode={renderPasscode} />;
}

function LoadingView({ theme, label }: { theme: any; label: string }) {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={theme.accent} />
      <Text style={[styles.loadingText, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

function VaultPrompt({ theme, icon, title, text, buttonLabel, onPress }: any) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.emptyText, { color: theme.textSecondary }]}>{text}</Text>
      <TouchableOpacity style={[styles.unlockButton, { backgroundColor: theme.accent }]} onPress={onPress} activeOpacity={0.8}>
        <Text style={styles.unlockButtonText}>{buttonLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

function EmptyPasscodes({ theme, search }: { theme: any; search: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🔐</Text>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>{search ? "No matching passcodes" : "No passcodes yet"}</Text>
      <Text style={[styles.emptyText, { color: theme.textSecondary }]}>{search ? "Try another platform or username." : 'Tap "Save Passcode" to add your first credential.'}</Text>
    </View>
  );
}
