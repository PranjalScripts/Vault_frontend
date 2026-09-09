import React from "react";
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from "react-native";

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

  return (
    <>
          {showForm && (
            <View
              style={[
                styles.formCard,
                {
                  backgroundColor:
                    theme.backgroundElement,

                  borderColor:
                    theme.border,
                },
              ]}
            >
              <View
                style={
                  styles.formHeader
                }
              >
                <View>
                  <Text
                    style={[
                      styles.formTitle,
                      {
                        color:
                          theme.text,
                      },
                    ]}
                  >
                    Save Passcode
                  </Text>

                  <Text
                    style={[
                      styles.formSubtitle,
                      {
                        color:
                          theme.textSecondary,
                      },
                    ]}
                  >
                    Add your login
                    credentials
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={
                    cancelCreate
                  }
                  style={
                    styles.cancelButton
                  }
                  activeOpacity={
                    0.7
                  }
                >
                  <Text
                    style={[
                      styles.cancelText,
                      {
                        color:
                          theme.textSecondary,
                      },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={[
                  styles.input,
                  {
                    color:
                      theme.text,

                    borderColor:
                      theme.border,

                    backgroundColor:
                      theme.background,
                  },
                ]}
                placeholder="Platform e.g. Instagram"
                placeholderTextColor={
                  theme.textSecondary
                }
                value={platform}
                onChangeText={
                  setPlatform
                }
                autoCapitalize="words"
              />

              <TextInput
                style={[
                  styles.input,
                  {
                    color:
                      theme.text,

                    borderColor:
                      theme.border,

                    backgroundColor:
                      theme.background,
                  },
                ]}
                placeholder="Username / Email"
                placeholderTextColor={
                  theme.textSecondary
                }
                value={username}
                onChangeText={
                  setUsername
                }
                autoCapitalize="none"
              />

              <TextInput
                style={[
                  styles.input,
                  {
                    color:
                      theme.text,

                    borderColor:
                      theme.border,

                    backgroundColor:
                      theme.background,
                  },
                ]}
                placeholder="Password"
                placeholderTextColor={
                  theme.textSecondary
                }
                value={password}
                onChangeText={
                  setPassword
                }
                secureTextEntry
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  {
                    backgroundColor:
                      theme.accent,
                  },

                  creating &&
                  styles.disabledButton,
                ]}
                onPress={
                  handleCreate
                }
                disabled={creating}
                activeOpacity={0.8}
              >
                {creating ? (
                  <ActivityIndicator
                    color="#fff"
                  />
                ) : (
                  <Text
                    style={
                      styles.saveButtonText
                    }
                  >
                    Save Passcode
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
    </>
  );
}
