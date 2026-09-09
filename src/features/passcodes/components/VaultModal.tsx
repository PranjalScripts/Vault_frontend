import React from "react";
import {
  ActivityIndicator,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { styles } from "@/features/passcodes/styles";

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
    <Modal
      visible={showVaultModal}
      transparent
      animationType="fade"
      onRequestClose={closeVaultModal}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.unlockModal,
            {
              backgroundColor: theme.backgroundElement,
            },
          ]}
        >
          <View style={styles.modalTop}>
            <View style={styles.unlockIconCircle}>
              <Text style={styles.unlockModalIcon}>
                {isVaultCreated ? "🔐" : "🛡️"}
              </Text>
            </View>

            <TouchableOpacity
              onPress={closeVaultModal}
              style={styles.modalCloseButton}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.modalCloseText,
                  {
                    color: theme.textSecondary,
                  },
                ]}
              >
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          <Text
            style={[
              styles.modalTitle,
              {
                color: theme.text,
              },
            ]}
          >
            {isVaultCreated ? "Unlock your vault" : "Create your vault"}
          </Text>

          <Text
            style={[
              styles.modalSubtitle,
              {
                color: theme.textSecondary,
              },
            ]}
          >
            {isVaultCreated
              ? "Enter your vault password to access your saved credentials."
              : "Create a strong password. This password protects your encrypted credentials."}
          </Text>

          <Text
            style={[
              styles.fieldLabel,
              {
                color: theme.textSecondary,
              },
            ]}
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
                  ? "Enter vault password"
                  : "Create vault password"
              }
              placeholderTextColor={theme.textSecondary}
              value={vaultPassword}
              onChangeText={(value: string) => {
                setVaultPassword(value);

                if (vaultError) {
                  setVaultError("");
                }
              }}
              secureTextEntry={!showVaultPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!unlocking && !creatingVault}
              onSubmitEditing={
                isVaultCreated ? handleUnlock : handleCreateVault
              }
            />

            <TouchableOpacity
              style={styles.passwordVisibilityButton}
              onPress={() => setShowVaultPassword((value: boolean) => !value)}
              disabled={unlocking || creatingVault}
              activeOpacity={0.7}
            >
              <Text style={styles.passwordVisibilityText}>
                {showVaultPassword ? "🙈" : "👁️"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* CONFIRM PASSWORD ONLY DURING CREATION */}

          {!isVaultCreated && (
            <>
              <Text
                style={[
                  styles.fieldLabel,
                  {
                    color: theme.textSecondary,
                    marginTop: 14,
                  },
                ]}
              >
                CONFIRM VAULT PASSWORD
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
                  placeholder="Confirm vault password"
                  placeholderTextColor={theme.textSecondary}
                  value={confirmVaultPassword}
                  onChangeText={(value: string) => {
                    setConfirmVaultPassword(value);

                    if (vaultError) {
                      setVaultError("");
                    }
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
                  activeOpacity={0.7}
                >
                  <Text style={styles.passwordVisibilityText}>
                    {showConfirmVaultPassword ? "🙈" : "👁️"}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {vaultError ? (
            <Text
              style={[
                styles.unlockError,
                {
                  color: theme.danger,
                },
              ]}
            >
              {vaultError}
            </Text>
          ) : null}

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[
                styles.modalCancelButton,
                {
                  borderColor: theme.border,
                },
              ]}
              onPress={closeVaultModal}
              disabled={unlocking || creatingVault}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.modalCancelText,
                  {
                    color: theme.text,
                  },
                ]}
              >
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalUpdateButton,
                {
                  backgroundColor: theme.accent,
                },

                (unlocking || creatingVault) && styles.disabledButton,
              ]}
              onPress={isVaultCreated ? handleUnlock : handleCreateVault}
              disabled={unlocking || creatingVault}
              activeOpacity={0.8}
            >
              {unlocking || creatingVault ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.modalUpdateText}>
                  {isVaultCreated ? "Unlock Vault" : "Create Vault"}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {isVaultCreated && (
            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={onForgotPassword}
              disabled={unlocking || creatingVault}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.forgotPasswordText,
                  {
                    color: theme.accent,
                  },
                ]}
              >
                Forgot Password?
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}
