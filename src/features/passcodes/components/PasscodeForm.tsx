import React, { useState } from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";

import { PasscodeEditorShell } from "./PasscodeEditorShell";
import { styles } from "@/features/passcodes/styles";

export function PasscodeForm(props: any) {
  const {
    showForm,
    theme,
    cancelCreate,
    platform,
    setPlatform,
    username,
    setUsername,
    password,
    setPassword,
    creating,
    handleCreate,
  } = props;

  const [showPassword, setShowPassword] = useState(false);

  return (
    <PasscodeEditorShell
      visible={showForm}
      busy={creating}
      onClose={() => {
        if (!creating) cancelCreate();
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 520,
          alignSelf: "center",
          paddingVertical: 8,
        }}
      >
        {/* Header */}
        <View
          style={{
            marginBottom: 28,
          }}
        >
          <View
            style={{
              width: 50,
              height: 50,
              borderRadius: 15,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: `${theme.accent}14`,
              marginBottom: 16,
            }}
          >
            <Feather name="key" size={22} color={theme.accent} />
          </View>

          <Text
            style={{
              color: theme.text,
              fontSize: 24,
              fontWeight: "700",
              marginBottom: 7,
            }}
          >
            Save a passcode
          </Text>

          <Text
            style={{
              color: theme.textSecondary,
              fontSize: 14,
              lineHeight: 21,
            }}
          >
            Add your login details and keep them securely stored in your Vault.
          </Text>
        </View>

        {/* Platform */}
        <View style={{ marginBottom: 18 }}>
          <Text
            style={{
              color: theme.textSecondary,
              fontSize: 12,
              fontWeight: "600",
              marginBottom: 8,
            }}
          >
            PLATFORM
          </Text>

          <View
            style={{
              position: "relative",
              justifyContent: "center",
            }}
          >
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: 14,
                zIndex: 1,
              }}
            >
              <Feather name="globe" size={18} color={theme.textSecondary} />
            </View>

            <TextInput
              style={[
                styles.input,
                {
                  color: theme.text,
                  borderColor: theme.border,
                  backgroundColor: theme.background,
                  paddingLeft: 44,
                  marginBottom: 0,
                },
              ]}
              placeholder="e.g. Instagram"
              placeholderTextColor={theme.textSecondary}
              value={platform}
              onChangeText={setPlatform}
              autoCapitalize="words"
              editable={!creating}
            />
          </View>
        </View>

        {/* Username */}
        <View style={{ marginBottom: 18 }}>
          <Text
            style={{
              color: theme.textSecondary,
              fontSize: 12,
              fontWeight: "600",
              marginBottom: 8,
            }}
          >
            USERNAME OR EMAIL
          </Text>

          <View
            style={{
              position: "relative",
              justifyContent: "center",
            }}
          >
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: 14,
                zIndex: 1,
              }}
            >
              <Feather name="user" size={18} color={theme.textSecondary} />
            </View>

            <TextInput
              style={[
                styles.input,
                {
                  color: theme.text,
                  borderColor: theme.border,
                  backgroundColor: theme.background,
                  paddingLeft: 44,
                  marginBottom: 0,
                },
              ]}
              placeholder="Enter username or email"
              placeholderTextColor={theme.textSecondary}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!creating}
              keyboardType="email-address"
            />
          </View>
        </View>

        {/* Password */}
        <View>
          <Text
            style={{
              color: theme.textSecondary,
              fontSize: 12,
              fontWeight: "600",
              marginBottom: 8,
            }}
          >
            PASSWORD
          </Text>

          <View
            style={{
              position: "relative",
              justifyContent: "center",
            }}
          >
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: 14,
                zIndex: 1,
              }}
            >
              <Feather name="lock" size={18} color={theme.textSecondary} />
            </View>

            <TextInput
              style={[
                styles.input,
                {
                  color: theme.text,
                  borderColor: theme.border,
                  backgroundColor: theme.background,
                  paddingLeft: 44,
                  paddingRight: 48,
                  marginBottom: 0,
                },
              ]}
              placeholder="Enter password"
              placeholderTextColor={theme.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!creating}
              onSubmitEditing={handleCreate}
            />

            <TouchableOpacity
              onPress={() => setShowPassword((value) => !value)}
              disabled={creating}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={
                showPassword ? "Hide password" : "Show password"
              }
              style={{
                position: "absolute",
                right: 8,
                width: 40,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather
                name={showPassword ? "eye-off" : "eye"}
                size={19}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Security information */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 9,
            marginTop: 16,
            paddingHorizontal: 12,
            paddingVertical: 11,
            borderRadius: 10,
            backgroundColor: `${theme.accent}0D`,
          }}
        >
          <Feather name="shield" size={16} color={theme.accent} />

          <Text
            style={{
              flex: 1,
              color: theme.textSecondary,
              fontSize: 12,
              lineHeight: 17,
            }}
          >
            Your credentials are encrypted before being stored in your Vault.
          </Text>
        </View>

        {/* Actions */}
        <View
          style={{
            flexDirection: "row",
            gap: 10,
            marginTop: 28,
          }}
        >
          <TouchableOpacity
            onPress={cancelCreate}
            disabled={creating}
            activeOpacity={0.7}
            style={{
              height: 48,
              flex: 1,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.border,
              alignItems: "center",
              justifyContent: "center",
              opacity: creating ? 0.5 : 1,
            }}
          >
            <Text
              style={{
                color: theme.text,
                fontSize: 14,
                fontWeight: "600",
              }}
            >
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCreate}
            disabled={creating || !platform.trim() || !password.trim()}
            activeOpacity={0.8}
            style={[
              {
                height: 48,
                flex: 1.4,
                borderRadius: 12,
                backgroundColor: theme.accent,
                flexDirection: "row",
                gap: 8,
                alignItems: "center",
                justifyContent: "center",
              },
              (creating || !platform.trim() || !password.trim()) && {
                opacity: 0.5,
              },
            ]}
          >
            {creating ? (
              <ActivityIndicator color={theme.background} />
            ) : (
              <>
                <Feather name="lock" size={16} color={theme.background} />

                <Text
                  style={{
                    color: theme.background,
                    fontSize: 14,
                    fontWeight: "700",
                  }}
                >
                  Save Passcode
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </PasscodeEditorShell>
  );
}
