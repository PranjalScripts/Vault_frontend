import { useTheme } from "@/hooks/use-theme";
import React, { useCallback, useState } from "react";
import {
  BackHandler,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { BrandLogo } from "@/components/BrandLogo";
import type { Passcode } from "../types";
import { entryCategory, entryDate, entryWebsite } from "../presentation";

type Props = {
  children?: React.ReactNode;
  item: Passcode;
  onClose: () => void;
  onEdit: (item: Passcode) => void;
  onDelete: (id: string) => void;
  onCopy: (value: string, id: string, label: string) => void;
  copiedField: string | null;
};
export function PasscodeDetails({
  item,
  onClose,
  onEdit,
  onDelete,
  onCopy,
  copiedField,
  children,
}: Props) {
  const p = useTheme();
  const s = createStyles(p);
  const [revealed, setRevealed] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [menu, setMenu] = useState(false);
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          onClose();
          return true;
        },
      );
      return () => subscription.remove();
    }, [onClose]),
  );
  const website = entryWebsite(item);
  const category = entryCategory(item);
  const copy = (field: "username" | "password") => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Copy ${field}`}
      disabled={!item[field]}
      onPress={() =>
        onCopy(
          item[field] || "",
          `${item._id}-${field}`,
          field === "username" ? "Username" : "Password",
        )
      }
      style={s.iconButton}
    >
      <Feather
        name={copiedField === `${item._id}-${field}` ? "check" : "copy"}
        size={22}
        color={p.text}
      />
    </Pressable>
  );
  return (
    <View style={s.page}>
      <View style={s.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to passcodes"
          onPress={onClose}
          style={s.back}
        >
          <Feather name="arrow-left" size={27} color={p.text} />
        </Pressable>
        
        
      </View>
    
      <View style={s.hero}>
        <View accessible={false} pointerEvents="none" style={s.waveOne} />
        <View accessible={false} pointerEvents="none" style={s.waveTwo} />
        <BrandLogo name={item.platform} kind="platform" size={72} />
        <View style={s.copy}>
          <Text style={s.platform}>{item.platform}</Text>
          <View style={s.badge}>
            <View style={s.dot} />
            <Text style={s.category}>{category}</Text>
          </View>
        </View>
      </View>
      <View style={s.field}>
        <View style={s.fieldIcon}>
          <Feather name="user" size={25} color={p.textSecondary} />
        </View>
        <View style={s.copy}>
          <Text style={s.label}>Username</Text>
          <Text selectable style={s.value}>
            {item.username || "Not added"}
          </Text>
        </View>
        {copy("username")}
      </View>
      <View style={s.field}>
        <View style={s.fieldIcon}>
          <Feather name="lock" size={24} color={p.textSecondary} />
        </View>
        <View style={s.copy}>
          <Text style={s.label}>Password</Text>
          <Text selectable={revealed} style={s.value}>
            {revealed ? item.password || "Not added" : "••••••••"}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={revealed ? "Hide password" : "Show password"}
          onPress={() => setRevealed((value) => !value)}
          style={s.show}
        >
          <Feather
            name={revealed ? "eye-off" : "eye"}
            size={21}
            color={p.link}
          />
          <Text style={s.actionText}>{revealed ? "Hide" : "Show"}</Text>
        </Pressable>
        {copy("password")}
      </View>
      <View style={s.field}>
        <View style={s.fieldIcon}>
          <Feather name="link" size={25} color={p.textSecondary} />
        </View>
        <View style={s.copy}>
          <Text style={s.label}>Website</Text>
          <Text selectable style={s.value}>
            {website || "Not added"}
          </Text>
        </View>
        {website && (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Open website"
            onPress={() =>
              void Linking.openURL(website).catch(() =>
                setLinkError("Unable to open website. Please try again."),
              )
            }
            style={s.show}
          >
            <Feather name="external-link" size={20} color={p.link} />
            <Text style={s.actionText}>Open</Text>
          </Pressable>
        )}
      </View>
      {!!linkError && (
        <Text accessibilityRole="alert" style={{ color: p.danger }}>
          {linkError}
        </Text>
      )}
      <View style={s.metadata}>
        {(
          [
            ["calendar", "Added on", entryDate(item.createdAt)],
            ["rotate-ccw", "Last updated", entryDate(item.updatedAt)],
            ["tag", "Category", category],
          ] as const
        ).map(([icon, label, value]) => (
          <View key={label} style={s.metaRow}>
            <View style={s.metaIcon}>
              <Feather name={icon} size={24} color={p.textSecondary} />
            </View>
            <View style={s.copy}>
              <Text style={s.label}>{label}</Text>
              {label === "Category" ? (
                <View style={s.categoryPill}>
                  <Text style={s.actionText}>{value}</Text>
                </View>
              ) : (
                <Text style={s.date}>{value}</Text>
              )}
            </View>
          </View>
        ))}
      </View>
      <View style={s.footer}>
        <Pressable
          accessibilityRole="button"
          onPress={() => onDelete(item._id)}
          style={[s.footerButton, s.delete]}
        >
          <Feather name="trash-2" size={25} color={p.danger} />
          <Text style={[s.footerText, { color: p.danger }]}>Delete</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => onEdit(item)}
          style={[s.footerButton, s.edit]}
        >
          <Feather name="edit-2" size={25} color={p.link} />
          <Text style={[s.footerText, { color: p.link }]}>Edit</Text>
        </Pressable>
      </View>
      {children}
    </View>
  );
}
const createStyles = (p: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: p.background },
    page: {
      width: "100%",
      maxWidth: 752,
      alignSelf: "center",
      padding: 20,
      paddingTop: 12,
      paddingBottom: 40,
      gap: 10,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 15,
      marginBottom: 18,
    },
    back: { width: 30, minHeight: 44, justifyContent: "center" },
    copy: { flex: 1, minWidth: 0 },
    heading: {
      color: p.text,
      fontSize: 21,
      fontWeight: "700",
      letterSpacing: -0.5,
    },
    subtitle: {
      color: p.textSecondary,
      fontSize: 12,
      lineHeight: 17,
      marginTop: 5,
    },
    hero: {
      minHeight: 124,
      padding: 20,
      backgroundColor: p.accentMuted,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: p.border,
      overflow: "hidden",
      flexDirection: "row",
      gap: 20,
      alignItems: "center",
      marginBottom: 4,
    },
    platform: {
      color: p.text,
      fontSize: 23,
      fontWeight: "600",
      marginBottom: 12,
    },
    badge: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      backgroundColor: p.backgroundSelected,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    dot: { width: 10, height: 10, borderRadius: 6, backgroundColor: p.accent },
    category: { color: p.textSecondary, fontSize: 14 },
    waveOne: {
      position: "absolute",
      width: 210,
      height: 130,
      borderRadius: 85,
      backgroundColor: p.backgroundSelected,
      right: -55,
      bottom: -90,
      transform: [{ rotate: "-25deg" }],
    },
    waveTwo: {
      position: "absolute",
      width: 180,
      height: 120,
      borderRadius: 70,
      backgroundColor: p.accentMuted,
      right: 55,
      bottom: -87,
      transform: [{ rotate: "35deg" }],
    },
    field: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: p.backgroundElement,
      borderWidth: 1,
      borderColor: p.border,
      borderRadius: 17,
      padding: 14,
      minHeight: 77,
      flexWrap: "wrap",
    },
    fieldIcon: {
      width: 45,
      height: 47,
      borderRadius: 12,
      backgroundColor: p.backgroundSelected,
      alignItems: "center",
      justifyContent: "center",
    },
    label: { color: p.textSecondary, fontSize: 13, marginBottom: 7 },
    value: { color: p.text, fontSize: 16 },
    iconButton: {
      minWidth: 42,
      minHeight: 42,
      borderWidth: 1,
      borderColor: p.border,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
    },
    show: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      minHeight: 42,
      paddingHorizontal: 12,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: p.border,
      backgroundColor: p.accentMuted,
    },
    actionText: { color: p.link, fontSize: 14, fontWeight: "500" },
    metadata: {
      backgroundColor: p.backgroundElement,
      borderWidth: 1,
      borderColor: p.border,
      borderRadius: 17,
      padding: 20,
      gap: 19,
      marginTop: 4,
    },
    metaRow: { flexDirection: "row", alignItems: "center", gap: 22 },
    metaIcon: { width: 39, alignItems: "center" },
    date: { color: p.textSecondary, fontSize: 14 },
    categoryPill: {
      alignSelf: "flex-start",
      backgroundColor: p.accentMuted,
      borderRadius: 20,
      paddingHorizontal: 15,
      paddingVertical: 7,
    },
    footer: { flexDirection: "row", gap: 12, marginTop: 7 },
    footerButton: {
      flex: 1,
      minHeight: 58,
      flexDirection: "row",
      gap: 16,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderRadius: 17,
    },
    delete: { borderColor: `${p.danger}55`, backgroundColor: `${p.danger}18` },
    edit: { borderColor: p.border, backgroundColor: p.accentMuted },
    footerText: { fontSize: 18, fontWeight: "600" },
    menu: {
      alignSelf: "flex-end",
      backgroundColor: p.backgroundElement,
      borderWidth: 1,
      borderColor: p.border,
      borderRadius: 12,
      padding: 7,
    },
    menuAction: { padding: 12 },
  });
