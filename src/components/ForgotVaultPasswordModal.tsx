import React, { useState, useEffect, useRef } from "react";

import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";

import {
  sendVaultRecoveryOtp,
  verifyVaultRecoveryOtp,
  getVaultRecoveryPayload,
  resetVaultPassword,
} from "../api/api";

import {
  generateVaultSalt,
  deriveVaultKey,
  encryptWithVaultKey,
} from "../crypto/vaultCrypto";
import { useTheme } from "../hooks/use-theme";

// =====================================================
// TYPES
// =====================================================

type RecoveryStep = "confirm" | "otp" | "password" | "success";

interface ForgotVaultPasswordModalProps {
  visible: boolean;
  onClose?: () => void;
  onSuccess?: (masterVaultKey: string) => void;
}

// =====================================================
// CONSTANTS
// =====================================================

const OTP_LENGTH = 6;
const OTP_RESEND_COOLDOWN = 30; // seconds

// =====================================================
// COMPONENT
// =====================================================

const ForgotVaultPasswordModal: React.FC<ForgotVaultPasswordModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const theme = useTheme();

  // =======================================================
  // STATE
  // =======================================================

  const [step, setStep] = useState<RecoveryStep>("confirm");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // OTP State
  const [otp, setOtp] = useState("");

  const [otpSent, setOtpSent] = useState(false);

  const [resendCountdown, setResendCountdown] = useState(0);

  // Password State
  const [newPassword, setNewPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Recovery State
  const [recoveryToken, setRecoveryToken] = useState<string | null>(null);

  const [recoveredMasterKey, setRecoveredMasterKey] = useState<string | null>(
    null,
  );

  const otpInputRef = useRef<TextInput>(null);

  // =======================================================
  // COUNTDOWN TIMER
  // =======================================================

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (resendCountdown > 0) {
      timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
    }

    return () => clearTimeout(timer);
  }, [resendCountdown]);

  // =======================================================
  // STEP 1: SEND OTP
  // =======================================================

  const handleSendOtp = async () => {
    try {
      setLoading(true);

      setError(null);

      await sendVaultRecoveryOtp();

      console.log("✅ OTP sent successfully");

      setOtpSent(true);

      setResendCountdown(OTP_RESEND_COOLDOWN);

      setStep("otp");
    } catch (err: any) {
      console.error("❌ Failed to send OTP:", err);

      setError(
        err?.response?.data?.message || err.message || "Failed to send OTP",
      );
    } finally {
      setLoading(false);
    }
  };

  // =======================================================
  // STEP 2: VERIFY OTP
  // =======================================================

  const handleVerifyOtp = async () => {
    // -----------------------------------------------
    // VALIDATION
    // -----------------------------------------------

    if (!otp || otp.length !== OTP_LENGTH) {
      setError(`Please enter a ${OTP_LENGTH}-digit OTP`);

      return;
    }

    try {
      setLoading(true);

      setError(null);

      const response = await verifyVaultRecoveryOtp(otp);

      if (!response?.data?.success) {
        setError("Invalid OTP");

        return;
      }

      const token = response.data.data?.recoveryToken;

      if (!token) {
        setError("Recovery token not received");

        return;
      }

      console.log("✅ OTP verified successfully");

      setRecoveryToken(token);

      setStep("password");

      setOtp("");
    } catch (err: any) {
      console.error("❌ Failed to verify OTP:", err);

      setError(
        err?.response?.data?.message || err.message || "Invalid or expired OTP",
      );
    } finally {
      setLoading(false);
    }
  };

  // =======================================================
  // STEP 3: RESET PASSWORD
  // =======================================================

  const handleResetPassword = async () => {
    // -----------------------------------------------
    // VALIDATION
    // -----------------------------------------------

    if (!newPassword.trim()) {
      setError("Please enter a new vault password");

      return;
    }

    if (!confirmPassword.trim()) {
      setError("Please confirm your vault password");

      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");

      return;
    }

    if (newPassword.length < 4) {
      setError("Password must be at least 4 characters");

      return;
    }

    // -----------------------------------------------
    // RECOVER MASTER VAULT KEY
    // -----------------------------------------------

    try {
      setLoading(true);

      setError(null);

      if (!recoveryToken) {
        setError("Recovery session expired");

        return;
      }

      // Get the recovered Master Vault Key from backend
      const recoveryResponse = await getVaultRecoveryPayload(recoveryToken);

      if (!recoveryResponse?.data?.success) {
        setError("Failed to recover vault key");

        return;
      }

      const masterKey = recoveryResponse.data.data?.masterVaultKey;

      if (!masterKey) {
        setError("Master vault key not received");

        return;
      }

      console.log("✅ Master vault key recovered");
      console.log("RECOVERED FRONTEND KEY LENGTH:", masterKey?.length);

      setRecoveredMasterKey(masterKey);

      // -----------------------------------------------
      // GENERATE NEW PASSWORD WRAPPING
      // -----------------------------------------------

      const newSalt = await generateVaultSalt();

      const newVaultKey = await deriveVaultKey(newPassword, newSalt);

      const newPasswordWrappedVaultKey = await encryptWithVaultKey(
        masterKey,
        newVaultKey,
      );

      const newVerifier = await encryptWithVaultKey(
        "VAULT_VERIFIER_V1",
        newVaultKey,
      );

      // -----------------------------------------------
      // RESET ON BACKEND
      // -----------------------------------------------

      const resetResponse = await resetVaultPassword({
        recoveryToken,
        passwordSalt: newSalt,
        passwordWrappedVaultKey: newPasswordWrappedVaultKey,
        verifier: newVerifier,
      });

      if (!resetResponse?.data?.success) {
        setError("Failed to reset vault password");

        return;
      }

      console.log("✅ Vault password reset successfully");

      // -----------------------------------------------
      // UPDATE LOCAL VAULT STATE
      // -----------------------------------------------

      // Option: Automatically unlock with new password
      // Or just close modal and ask user to unlock again

      setStep("success");

      setTimeout(() => {
        handleClose();

        onSuccess?.(masterKey);
      }, 2000);
    } catch (err: any) {
      console.error("❌ Failed to reset vault password:", err);

      setError(
        err?.response?.data?.message ||
          err.message ||
          "Unable to reset vault password",
      );
    } finally {
      setLoading(false);
    }
  };

  // =======================================================
  // RESEND OTP
  // =======================================================

  const handleResendOtp = async () => {
    if (resendCountdown > 0) {
      return;
    }

    try {
      setLoading(true);

      setError(null);

      await sendVaultRecoveryOtp();

      console.log("✅ OTP resent successfully");

      setResendCountdown(OTP_RESEND_COOLDOWN);
    } catch (err: any) {
      console.error("❌ Failed to resend OTP:", err);

      setError(
        err?.response?.data?.message || err.message || "Failed to resend OTP",
      );
    } finally {
      setLoading(false);
    }
  };

  // =======================================================
  // CLOSE MODAL
  // =======================================================

  const handleClose = () => {
    if (loading) {
      return;
    }

    setStep("confirm");

    setError(null);

    setOtp("");

    setOtpSent(false);

    setResendCountdown(0);

    setNewPassword("");

    setConfirmPassword("");

    setShowPassword(false);

    setShowConfirmPassword(false);

    setRecoveryToken(null);

    setRecoveredMasterKey(null);

    onClose?.();
  };

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[
              styles.container,
              { backgroundColor: theme.backgroundElement },
            ]}
          >
            {/* =========================================
                STEP 1: CONFIRM
            ========================================= */}

            {step === "confirm" && (
              <>
                <View style={styles.header}>
                  <Text style={styles.icon}>🔐</Text>

                  <Text style={[styles.title, { color: theme.text }]}>
                    Forgot Vault Password?
                  </Text>

                  <Text
                    style={[styles.subtitle, { color: theme.textSecondary }]}
                  >
                    You can reset your Vault password by verifying your account.
                  </Text>

                  <Text
                    style={[styles.subtitle, { color: theme.textSecondary }]}
                  >
                    Your existing encrypted data remains protected.
                  </Text>
                </View>

                {error && (
                  <View
                    style={[
                      styles.errorBox,
                      {
                        borderColor: theme.danger,
                        backgroundColor: theme.background,
                      },
                    ]}
                  >
                    <Text style={[styles.errorText, { color: theme.danger }]}>
                      {error}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.button,
                    { backgroundColor: theme.accent },
                    loading && styles.buttonDisabled,
                  ]}
                  onPress={handleSendOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.buttonText}>Send OTP</Text>
                  )}
                </TouchableOpacity>

                {onClose && !loading && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleClose}
                  >
                    <Text style={[styles.cancelText, { color: theme.text }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {/* =========================================
                STEP 2: OTP VERIFICATION
            ========================================= */}

            {step === "otp" && (
              <>
                <View style={styles.header}>
                  <Text style={styles.icon}>✉️</Text>

                  <Text style={[styles.title, { color: theme.text }]}>
                    Verify Your Identity
                  </Text>

                  <Text
                    style={[styles.subtitle, { color: theme.textSecondary }]}
                  >
                    We sent a verification code to your email.
                  </Text>

                  <Text
                    style={[styles.subtitle, { color: theme.textSecondary }]}
                  >
                    OTP expires in 5 minutes.
                  </Text>
                </View>

                {error && (
                  <View
                    style={[
                      styles.errorBox,
                      {
                        borderColor: theme.danger,
                        backgroundColor: theme.background,
                      },
                    ]}
                  >
                    <Text style={[styles.errorText, { color: theme.danger }]}>
                      {error}
                    </Text>
                  </View>
                )}

                <Text style={[styles.label, { color: theme.textSecondary }]}>
                  VERIFICATION CODE
                </Text>

                <TextInput
                  ref={otpInputRef}
                  value={otp}
                  onChangeText={(text) => {
                    // Only allow digits
                    const digits = text.replace(/[^0-9]/g, "");

                    setOtp(digits.slice(0, OTP_LENGTH));
                  }}
                  placeholder="000000"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="number-pad"
                  maxLength={OTP_LENGTH}
                  editable={!loading}
                  style={[
                    styles.otpInput,
                    styles.input,
                    {
                      color: theme.text,
                      borderColor: theme.border,
                      backgroundColor: theme.background,
                    },
                  ]}
                  autoFocus
                />

                <TouchableOpacity
                  style={[
                    styles.button,
                    { backgroundColor: theme.accent },
                    loading && styles.buttonDisabled,
                  ]}
                  onPress={handleVerifyOtp}
                  disabled={loading || otp.length !== OTP_LENGTH}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.buttonText}>Verify OTP</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={handleResendOtp}
                  disabled={resendCountdown > 0 || loading}
                >
                  <Text
                    style={[
                      styles.resendText,
                      resendCountdown > 0 && styles.resendDisabled,
                      {
                        color:
                          resendCountdown > 0
                            ? theme.textSecondary
                            : theme.accent,
                      },
                    ]}
                  >
                    {resendCountdown > 0
                      ? `Resend in ${resendCountdown}s`
                      : "Didn't receive the code? Resend"}
                  </Text>
                </TouchableOpacity>

                {onClose && !loading && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleClose}
                  >
                    <Text style={[styles.cancelText, { color: theme.text }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {/* =========================================
                STEP 3: NEW PASSWORD
            ========================================= */}

            {step === "password" && (
              <>
                <View style={styles.header}>
                  <Text style={styles.icon}>🔑</Text>

                  <Text style={[styles.title, { color: theme.text }]}>
                    Create New Vault Password
                  </Text>

                  <Text
                    style={[styles.subtitle, { color: theme.textSecondary }]}
                  >
                    Choose a strong password to secure your vault.
                  </Text>
                </View>

                {error && (
                  <View
                    style={[
                      styles.errorBox,
                      {
                        borderColor: theme.danger,
                        backgroundColor: theme.background,
                      },
                    ]}
                  >
                    <Text style={[styles.errorText, { color: theme.danger }]}>
                      {error}
                    </Text>
                  </View>
                )}

                <Text style={[styles.label, { color: theme.textSecondary }]}>
                  NEW VAULT PASSWORD
                </Text>

                <View
                  style={[
                    styles.passwordContainer,
                    { borderColor: theme.border },
                  ]}
                >
                  <TextInput
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Enter new password"
                    placeholderTextColor={theme.textSecondary}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                    style={[styles.passwordInput, { color: theme.text }]}
                  />

                  <TouchableOpacity
                    onPress={() => setShowPassword((prev) => !prev)}
                    disabled={loading}
                  >
                    <Text style={[styles.showText, { color: theme.accent }]}>
                      {showPassword ? "Hide" : "Show"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.label, { color: theme.textSecondary }]}>
                  CONFIRM VAULT PASSWORD
                </Text>

                <View
                  style={[
                    styles.passwordContainer,
                    { borderColor: theme.border },
                  ]}
                >
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm password"
                    placeholderTextColor={theme.textSecondary}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                    style={[styles.passwordInput, { color: theme.text }]}
                  />

                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword((prev) => !prev)}
                    disabled={loading}
                  >
                    <Text style={[styles.showText, { color: theme.accent }]}>
                      {showConfirmPassword ? "Hide" : "Show"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[
                    styles.button,
                    { backgroundColor: theme.accent },
                    loading && styles.buttonDisabled,
                  ]}
                  onPress={handleResetPassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.buttonText}>Reset Vault Password</Text>
                  )}
                </TouchableOpacity>

                {onClose && !loading && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleClose}
                  >
                    <Text style={[styles.cancelText, { color: theme.text }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {/* =========================================
                STEP 4: SUCCESS
            ========================================= */}

            {step === "success" && (
              <>
                <View style={styles.header}>
                  <Text style={styles.icon}>✅</Text>

                  <Text style={[styles.title, { color: theme.text }]}>
                    Vault Password Updated
                  </Text>

                  <Text
                    style={[styles.subtitle, { color: theme.textSecondary }]}
                  >
                    Your Vault password has been reset successfully.
                  </Text>

                  <Text
                    style={[styles.subtitle, { color: theme.textSecondary }]}
                  >
                    Your existing encrypted data remains unchanged.
                  </Text>
                </View>

                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.accent} />

                  <Text
                    style={[styles.loadingText, { color: theme.textSecondary }]}
                  >
                    Redirecting...
                  </Text>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default ForgotVaultPasswordModal;

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },

  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },

  container: {
    width: "100%",
    maxWidth: 440,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 10 },
    elevation: 15,
  },

  header: {
    alignItems: "center",
    marginBottom: 19,
  },

  icon: {
    fontSize: 25,
    marginBottom: 10,
  },

  title: {
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: -0.4,
    marginBottom: 5,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 4,
  },

  label: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.7,
    marginBottom: 6,
  },

  input: {
    borderWidth: 1,
    borderRadius: 11,
    paddingHorizontal: 13,
    marginBottom: 13,
    height: 46,
    fontSize: 13,
  },

  otpInput: {
    letterSpacing: 8,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
  },

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 11,
    paddingHorizontal: 13,
    marginBottom: 13,
  },

  passwordInput: {
    flex: 1,
    height: 46,
    fontSize: 13,
  },

  showText: {
    fontSize: 12,
    fontWeight: "700",
    paddingLeft: 10,
  },

  errorBox: {
    borderRadius: 11,
    padding: 10,
    marginBottom: 13,
    borderWidth: 1,
  },

  errorText: {
    fontSize: 11,
    lineHeight: 18,
    fontWeight: "600",
  },

  button: {
    height: 45,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },

  resendButton: {
    alignItems: "center",
    paddingVertical: 10,
    marginBottom: 12,
  },

  resendText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2563eb",
  },

  resendDisabled: {
    color: "#999999",
  },

  cancelButton: {
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  cancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666666",
  },

  loadingContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666666",
    fontWeight: "500",
  },
});
