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

import ForgotVaultPasswordModal from "./ForgotVaultPasswordModal";

// =====================================================
// TYPES
// =====================================================

interface VaultUnlockModalProps {
  visible: boolean;
  onClose?: () => void;
}

// =====================================================
// COMPONENT
// =====================================================

const VaultUnlockModal: React.FC<VaultUnlockModalProps> = ({
  visible,
  onClose,
}) => {
  const { unlockVault } = useVault();

  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  // ===================================================
  // UNLOCK VAULT
  // ===================================================

  const handleUnlockVault = async () => {
    // -----------------------------------------------
    // VALIDATION
    // -----------------------------------------------

    if (!password.trim()) {
      Alert.alert("Vault Password", "Please enter your vault password.");

      return;
    }

    try {
      setLoading(true);

      /*
       * VaultContext handles the complete
       * cryptographic unlock process:
       *
       * password
       *     ↓
       * stored salt
       *     ↓
       * PBKDF2
       *     ↓
       * Vault Key
       *     ↓
       * decrypt verifier
       *     ↓
       * compare verifier
       *     ↓
       * Vault unlocked
       *
       * The Vault Key never goes to
       * the backend.
       */

      const unlocked = await unlockVault(password);

      // -----------------------------------------------
      // SUCCESS
      // -----------------------------------------------

      if (unlocked) {
        console.log("🔓 Vault unlocked successfully");

        setPassword("");

        onClose?.();

        return;
      }

      // -----------------------------------------------
      // WRONG PASSWORD
      // -----------------------------------------------

      Alert.alert(
        "Incorrect Password",
        "The vault password you entered is incorrect.",
      );
    } catch (error: any) {
      console.error("❌ VAULT UNLOCK ERROR:", error);

      Alert.alert(
        "Unable to Unlock Vault",
        error?.message || "Unable to unlock your vault. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // CLOSE
  // ===================================================

  const handleClose = () => {
    if (loading) {
      return;
    }

    setPassword("");
    setShowPassword(false);

    onClose?.();
  };

  // ===================================================
  // UI
  // ===================================================

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <View style={styles.overlay}>
          <View style={styles.container}>
            {/* =========================================
              HEADER
          ========================================= */}

            <View style={styles.header}>
              <Text style={styles.lockIcon}>🔐</Text>

              <Text style={styles.title}>Unlock Vault</Text>

              <Text style={styles.subtitle}>
                Enter your vault password to access your passcodes.
              </Text>
            </View>

            {/* =========================================
              PASSWORD LABEL
          ========================================= */}

            <Text style={styles.label}>Vault Password</Text>

            {/* =========================================
              PASSWORD INPUT
          ========================================= */}

            <View style={styles.passwordContainer}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter vault password"
                placeholderTextColor="#999999"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                returnKeyType="done"
                onSubmitEditing={handleUnlockVault}
                style={styles.passwordInput}
              />

              <TouchableOpacity
                onPress={() => setShowPassword((previous) => !previous)}
                disabled={loading}
              >
                <Text style={styles.showText}>
                  {showPassword ? "Hide" : "Show"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* =========================================
              SECURITY MESSAGE
          ========================================= */}

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Your password stays private</Text>

              <Text style={styles.infoText}>
                Your vault password is used on this device to derive your Vault
                Key. It is never sent to the server.
              </Text>
            </View>

            {/* =========================================
              UNLOCK BUTTON
          ========================================= */}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleUnlockVault}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" />
              ) : (
                <Text style={styles.buttonText}>Unlock Vault</Text>
              )}
            </TouchableOpacity>

            {/* =========================================
              FORGOT PASSWORD
          ========================================= */}

            {!loading && (
              <TouchableOpacity
                style={styles.forgotButton}
                onPress={() => setShowRecoveryModal(true)}
              >
                <Text style={styles.forgotText}>Forgot Vault Password?</Text>
              </TouchableOpacity>
            )}

            {/* =========================================
              CANCEL
          ========================================= */}

            {onClose && !loading && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* =========================================================
        FORGOT PASSWORD MODAL
    ========================================================= */}

      <ForgotVaultPasswordModal
        visible={showRecoveryModal}
        onClose={() => setShowRecoveryModal(false)}
        onSuccess={() => {
          setShowRecoveryModal(false);
          onClose?.();
        }}
      />
    </>
  );
};

export default VaultUnlockModal;

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
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

  header: {
    alignItems: "center",
    marginBottom: 24,
  },

  lockIcon: {
    fontSize: 34,
    marginBottom: 10,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111111",
    marginBottom: 8,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: "#666666",
    textAlign: "center",
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
    paddingHorizontal: 12,
    marginBottom: 18,
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

  infoBox: {
    backgroundColor: "#eff6ff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },

  infoTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1d4ed8",
    marginBottom: 4,
  },

  infoText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#1e40af",
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

  forgotButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    marginTop: 4,
  },

  forgotText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2563eb",
  },
});
