import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useVault } from "../contexts/vaultContext";

interface VaultSetupModalProps {
  visible: boolean;
  onClose?: () => void;
}

const VaultSetupModal: React.FC<
  VaultSetupModalProps
> = ({
  visible,
  onClose,
}) => {
  const {
    setupVault,
  } = useVault();

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const handleCreateVault = async () => {
    // ==========================================
    // VALIDATION
    // ==========================================

    if (!password.trim()) {
      Alert.alert(
        "Vault Password",
        "Please enter a vault password."
      );
      return;
    }

    if (!confirmPassword.trim()) {
      Alert.alert(
        "Confirm Password",
        "Please confirm your vault password."
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        "Password Mismatch",
        "Vault passwords do not match."
      );
      return;
    }

    // ==========================================
    // CREATE VAULT
    // ==========================================

    try {
      setLoading(true);

      /*
       * VaultContext handles:
       *
       * password
       *     ↓
       * generate salt
       *     ↓
       * derive Vault Key
       *     ↓
       * encrypt verifier
       *     ↓
       * send salt + verifier
       *
       * Vault Key remains locally in memory.
       */

      await setupVault(password);

      // ========================================
      // SUCCESS
      // ========================================

      setPassword("");
      setConfirmPassword("");

      Alert.alert(
        "Vault Created",
        "Your vault has been created successfully."
      );

      onClose?.();
    } catch (error: any) {
      console.error(
        "VAULT SETUP ERROR:",
        error
      );

      Alert.alert(
        "Vault Setup Failed",
        error?.message ||
          "Unable to create your vault."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!loading) {
          onClose?.();
        }
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>

          {/* =====================================
              HEADER
          ===================================== */}

          <Text style={styles.title}>
            Create Your Vault
          </Text>

          <Text style={styles.subtitle}>
            Create a password to protect your
            passcodes.
          </Text>

          {/* =====================================
              PASSWORD
          ===================================== */}

          <Text style={styles.label}>
            Vault Password
          </Text>

          <View style={styles.passwordContainer}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter vault password"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              style={styles.passwordInput}
            />

            <TouchableOpacity
              onPress={() =>
                setShowPassword(
                  (previous) => !previous
                )
              }
              disabled={loading}
            >
              <Text style={styles.showText}>
                {showPassword
                  ? "Hide"
                  : "Show"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* =====================================
              CONFIRM PASSWORD
          ===================================== */}

          <Text style={styles.label}>
            Confirm Password
          </Text>

          <View style={styles.passwordContainer}>
            <TextInput
              value={confirmPassword}
              onChangeText={
                setConfirmPassword
              }
              placeholder="Confirm vault password"
              secureTextEntry={
                !showConfirmPassword
              }
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              style={styles.passwordInput}
            />

            <TouchableOpacity
              onPress={() =>
                setShowConfirmPassword(
                  (previous) => !previous
                )
              }
              disabled={loading}
            >
              <Text style={styles.showText}>
                {showConfirmPassword
                  ? "Hide"
                  : "Show"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* =====================================
              SECURITY WARNING
          ===================================== */}

          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>
              Important
            </Text>

            <Text style={styles.warningText}>
              Your vault password cannot be
              recovered from the server. Make
              sure you remember it.
            </Text>
          </View>

          {/* =====================================
              CREATE BUTTON
          ===================================== */}

          <TouchableOpacity
            style={[
              styles.button,
              loading &&
                styles.buttonDisabled,
            ]}
            onPress={handleCreateVault}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator
                size="small"
              />
            ) : (
              <Text style={styles.buttonText}>
                Create Vault
              </Text>
            )}
          </TouchableOpacity>

          {/* =====================================
              CANCEL
          ===================================== */}

          {onClose && !loading && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelText}>
                Cancel
              </Text>
            </TouchableOpacity>
          )}

        </View>
      </View>
    </Modal>
  );
};

export default VaultSetupModal;

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor:
      "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  container: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
    color: "#111111",
  },

  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: "#666666",
    marginBottom: 24,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 8,
  },

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dddddd",
    borderRadius: 10,
    marginBottom: 18,
    paddingHorizontal: 12,
  },

  passwordInput: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: "#111111",
  },

  showText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2563eb",
    paddingLeft: 10,
  },

  warningBox: {
    backgroundColor: "#fff7ed",
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },

  warningTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#9a3412",
    marginBottom: 4,
  },

  warningText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#9a3412",
  },

  button: {
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563eb",
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },

  cancelButton: {
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },

  cancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666666",
  },
});