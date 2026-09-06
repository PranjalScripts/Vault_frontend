import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";

import type { Passcode } from "../types";
import { formatTimeAgo, getPlatformIcon } from "../utils/passcodeCrypto";

type PasscodeCardProps = {
  item: Passcode;
  index: number;
  theme: any;
  styles: any;
  isRevealed: boolean;
  copiedField: string | null;
  onDelete: (id: string) => void;
  onEdit: (item: Passcode) => void;
  onToggleReveal: (id: string) => void;
  onCopy: (value: string, fieldId: string, fieldName: string) => void;
};

export function PasscodeCard({
  item,
  index,
  theme,
  styles,
  isRevealed,
  copiedField,
  onDelete,
  onEdit,
  onToggleReveal,
  onCopy,
}: PasscodeCardProps) {
  const usernameCopied = copiedField === `${item._id}-username`;
  const passwordCopied = copiedField === `${item._id}-password`;

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.platformSection}>
          <View style={[styles.platformIconContainer, { backgroundColor: theme.background }]}>
            <Text style={styles.platformIcon}>{getPlatformIcon(item.platform)}</Text>
          </View>
          <View style={styles.platformInfo}>
            <Text style={[styles.platform, { color: theme.text }]} numberOfLines={1}>
              {item.platform}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.deleteButton, { borderColor: theme.border }]}
          onPress={() => onDelete(item._id)}
          activeOpacity={0.7}
        >
          <Text style={styles.deleteIcon}>🗑</Text>
          <Text style={[styles.deleteButtonText, { color: theme.danger }]}>Delete</Text>
        </TouchableOpacity>
      </View>

      <CredentialRow
        label="Username"
        value={item.username}
        theme={theme}
        styles={styles}
        actions={
          <>
            <TouchableOpacity style={[styles.smallAction, { borderColor: theme.border }]} onPress={() => onEdit(item)} activeOpacity={0.7}>
              <Text style={styles.smallActionIcon}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.smallAction, { borderColor: theme.border }]} onPress={() => onCopy(item.username, `${item._id}-username`, "Username")} activeOpacity={0.7}>
              <Text style={styles.smallActionIcon}>{usernameCopied ? "✓" : "📋"}</Text>
            </TouchableOpacity>
          </>
        }
      />

      <CredentialRow
        label="Password"
        value={isRevealed ? item.password || "" : "••••••••"}
        theme={theme}
        styles={styles}
        actions={
          <>
            <TouchableOpacity style={[styles.smallAction, { borderColor: theme.border }]} onPress={() => onToggleReveal(item._id)} activeOpacity={0.7}>
              <Text style={[styles.showActionText, { color: theme.accent }]}>{isRevealed ? "Hide" : "Show"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.smallAction, { borderColor: theme.border }]}
              onPress={() => {
                if (!item.password) {
                  Toast.show({ type: "info", text1: "No password", text2: "This passcode has no password stored." });
                  return;
                }
                onCopy(item.password, `${item._id}-password`, "Password");
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.smallActionIcon}>{passwordCopied ? "✓" : "📋"}</Text>
            </TouchableOpacity>
          </>
        }
      />

      <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
        <Text style={[styles.serialText, { color: theme.textSecondary }]}>#{item.srNo ?? index + 1}</Text>
        {item.updatedAt && <Text style={[styles.updatedText, { color: theme.textSecondary }]}>{formatTimeAgo(item.updatedAt)}</Text>}
      </View>
    </View>
  );
}

function CredentialRow({ label, value, actions, theme, styles }: any) {
  return (
    <View style={[styles.credentialRow, { borderTopColor: theme.border }]}>
      <View style={styles.credentialInfo}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
        <Text style={[styles.value, { color: theme.text }]} numberOfLines={1}>{value}</Text>
      </View>
      <View style={styles.credentialActions}>{actions}</View>
    </View>
  );
}
