import React from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { PasscodeEditorShell } from "./PasscodeEditorShell";
import { styles } from "@/features/passcodes/styles";
import Feather from "@expo/vector-icons/Feather";
export function VaultModal(props: any) {
  const {
    showVaultModal,
    closeVaultModal,
    theme,
    isVaultCreated,
    vaultPassword,
    setVaultPassword,
    confirmVaultPassword,
    setConfirmVaultPassword,
    vaultError,
    setVaultError,
    showVaultPassword,
    setShowVaultPassword,
    showConfirmVaultPassword,
    setShowConfirmVaultPassword,
    unlocking,
    creatingVault,
    handleUnlock,
    handleCreateVault,
    onForgotPassword,
  } = props;

  return (
    <PasscodeEditorShell
      visible={showVaultModal}
      onClose={closeVaultModal}
      busy={unlocking || creatingVault}
    >
      <View
        style={[
          styles.unlockModal,
          {
            width: "100%",
            maxWidth: 520,
            alignSelf: "center",
            borderRadius: 20,
            padding: 24,
            backgroundColor: theme.background,
            borderWidth: 1,
            borderColor: theme.border,
          },
        ]}
      >
        {/* Icon */}
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: `${theme.accent}14`,
            marginBottom: 18,
          }}
        >
          <Text style={{ fontSize: 25 }}>{isVaultCreated ? "🔐" : "🛡️"}</Text>
        </View>

        {/* Heading */}
        <Text
          style={{
            color: theme.text,
            fontSize: 24,
            fontWeight: "700",
            marginBottom: 7,
          }}
        >
          {isVaultCreated ? "Unlock your Vault" : "Create your Vault"}
        </Text>

        <Text
          style={{
            color: theme.textSecondary,
            fontSize: 14,
            lineHeight: 21,
            marginBottom: 20,
          }}
        >
          {isVaultCreated
            ? "Enter your master password to access your encrypted credentials."
            : "Create a master password to protect all your saved credentials."}
        </Text>

        {/* Security message */}
        {!isVaultCreated && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              padding: 12,
              borderRadius: 12,
              backgroundColor: `${theme.accent}0D`,
              marginBottom: 24,
            }}
          >
            <Feather name="shield" size={18} color={theme.accent} />

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: theme.text,
                  fontSize: 13,
                  fontWeight: "600",
                }}
              >
                End-to-end encrypted
              </Text>

              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: 12,
                  marginTop: 2,
                }}
              >
                Your credentials stay protected inside your Vault.
              </Text>
            </View>
          </View>
        )}

        {/* Password */}
        <Text
          style={{
            color: theme.textSecondary,
            fontSize: 12,
            fontWeight: "600",
            marginBottom: 8,
          }}
        >
          VAULT PASSWORD
        </Text>

        <View style={styles.passwordInputWrapper}>
          <TextInput
            style={[
              styles.unlockInput,
              {
                color: theme.text,
                backgroundColor: theme.background,
                borderColor: vaultError ? theme.danger : theme.border,
              },
            ]}
            placeholder={
              isVaultCreated
                ? "Enter your vault password"
                : "Create a strong password"
            }
            placeholderTextColor={theme.textSecondary}
            value={vaultPassword}
            onChangeText={(value) => {
              setVaultPassword(value);
              if (vaultError) setVaultError("");
            }}
            secureTextEntry={!showVaultPassword}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!unlocking && !creatingVault}
            onSubmitEditing={isVaultCreated ? handleUnlock : handleCreateVault}
          />

          <TouchableOpacity
            style={styles.passwordVisibilityButton}
            onPress={() => setShowVaultPassword((value: boolean) => !value)}
            disabled={unlocking || creatingVault}
          >
            <Feather
              name={showVaultPassword ? "eye-off" : "eye"}
              size={19}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Confirm password */}
        {!isVaultCreated && (
          <>
            <Text
              style={{
                color: theme.textSecondary,
                fontSize: 12,
                fontWeight: "600",
                marginTop: 18,
                marginBottom: 8,
              }}
            >
              CONFIRM PASSWORD
            </Text>

            <View style={styles.passwordInputWrapper}>
              <TextInput
                style={[
                  styles.unlockInput,
                  {
                    color: theme.text,
                    backgroundColor: theme.background,
                    borderColor: vaultError ? theme.danger : theme.border,
                  },
                ]}
                placeholder="Re-enter your password"
                placeholderTextColor={theme.textSecondary}
                value={confirmVaultPassword}
                onChangeText={(value) => {
                  setConfirmVaultPassword(value);
                  if (vaultError) setVaultError("");
                }}
                secureTextEntry={!showConfirmVaultPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!unlocking && !creatingVault}
                onSubmitEditing={handleCreateVault}
              />

              <TouchableOpacity
                style={styles.passwordVisibilityButton}
                onPress={() =>
                  setShowConfirmVaultPassword((value: boolean) => !value)
                }
                disabled={unlocking || creatingVault}
              >
                <Feather
                  name={showConfirmVaultPassword ? "eye-off" : "eye"}
                  size={19}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Password guidance */}
            <View
              style={{
                marginTop: 14,
                gap: 6,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 7,
                }}
              >
                
              </View>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 7,
                }}
              >
                <Feather
                  name="check-circle"
                  size={14}
                  color={theme.textSecondary}
                />
                <Text
                  style={{
                    color: theme.textSecondary,
                    fontSize: 12,
                  }}
                >
                  Choose a password you can remember
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Error */}
        {vaultError ? (
          <View
            style={{
              marginTop: 14,
              padding: 10,
              borderRadius: 10,
              backgroundColor: `${theme.danger}10`,
            }}
          >
            <Text
              accessibilityRole="alert"
              style={{
                color: theme.danger,
                fontSize: 13,
              }}
            >
              {vaultError}
            </Text>
          </View>
        ) : null}

        {/* Actions */}
        <View
          style={{
            flexDirection: "row",
            gap: 10,
            marginTop: 24,
          }}
        >
          <TouchableOpacity
            style={[
              styles.modalCancelButton,
              {
                flex: 1,
                borderColor: theme.border,
              },
            ]}
            onPress={closeVaultModal}
            disabled={unlocking || creatingVault}
          >
            <Text style={[styles.modalCancelText, { color: theme.text }]}>
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modalUpdateButton,
              {
                flex: 1.3,
                backgroundColor: theme.accent,
                flexDirection: "row",
                gap: 7,
              },
              (unlocking || creatingVault) && styles.disabledButton,
            ]}
            onPress={isVaultCreated ? handleUnlock : handleCreateVault}
            disabled={unlocking || creatingVault}
          >
            {unlocking || creatingVault ? (
              <ActivityIndicator color={theme.background} />
            ) : (
              <>
                <Text
                  style={[styles.modalUpdateText, { color: theme.background }]}
                >
                  {isVaultCreated ? "Unlock Vault" : "Create Vault"}
                </Text>

                <Feather
                  name="arrow-right"
                  size={16}
                  color={theme.background}
                />
              </>
            )}
          </TouchableOpacity>
        </View>

        {isVaultCreated && (
          <TouchableOpacity
            style={{
              alignSelf: "center",
              marginTop: 18,
              padding: 6,
            }}
            onPress={onForgotPassword}
            disabled={unlocking || creatingVault}
          >
            <Text
              style={{
                color: theme.accent,
                fontWeight: "600",
                fontSize: 13,
              }}
            >
              Forgot your password?
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </PasscodeEditorShell>
  );
}
