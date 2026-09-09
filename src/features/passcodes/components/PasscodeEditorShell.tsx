import React from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import { useTheme } from "@/hooks/use-theme";
import { styles } from "@/features/passcodes/styles";

export function PasscodeEditorShell({ visible, title, onClose, children }: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const mobile = useWindowDimensions().width < 768;
  return (
    <Modal visible={visible} transparent={!mobile} animationType="none" presentationStyle={mobile ? "fullScreen" : "overFullScreen"} onRequestClose={onClose}>
      {mobile ? (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
          <View style={{ minHeight: 56, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, borderBottomWidth: 1, borderColor: theme.border }}>
            <Pressable accessibilityRole="button" accessibilityLabel="Back to passcodes" onPress={onClose} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
              <Feather name="arrow-left" size={24} color={theme.text} />
            </Pressable>
            <Text style={{ flex: 1, color: theme.text, fontSize: 20, fontWeight: "700" }}>{title}</Text>
          </View>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : Platform.OS === "android" ? "height" : undefined}>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, flexGrow: 1 }}>
              {children}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      ) : <View style={styles.modalOverlay}>{children}</View>}
    </Modal>
  );
}
