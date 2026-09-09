import React from "react";
import { ActivityIndicator, Modal, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from "react-native";

import { PasscodeEditorShell } from "./PasscodeEditorShell";

import { styles } from "@/features/passcodes/styles";

export function PasscodeModals(props: any) {
  const {
    editingPasscode,
    setEditingPasscode,
    theme,
    editUsername,
    setEditUsername,
    editPassword,
    setEditPassword,
    updating,
    handleUpdate,
    deleteConfirmId,
    setDeleteConfirmId,
    deleting,
    confirmDelete,
  } = props;

  const mobile = useWindowDimensions().width < 768;
  return (
    <>
          <PasscodeEditorShell
            visible={!!editingPasscode}
            title="Edit Passcode"
            onClose={() => { if (!updating) setEditingPasscode(null); }}
          >
              {editingPasscode && (
                <View
                  style={[
                    styles.editModal,
                    mobile && { width: "100%", maxWidth: "100%", borderRadius: 0, padding: 0, elevation: 0, shadowOpacity: 0, boxShadow: "none" },
                    {
                      backgroundColor:
                        mobile ? theme.background : theme.backgroundElement,
                    },
                  ]}
                >
                  <View
                    style={
                      [styles.modalTop, mobile && { display: "none" }]
                    }
                  >
                    <View
                      style={
                        styles.modalIconCircle
                      }
                    >
                      <Text
                        style={
                          styles.modalIcon
                        }
                      >
                        ✏️
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() =>
                        setEditingPasscode(
                          null
                        )
                      }
                      style={
                        styles.modalCloseButton
                      }
                      activeOpacity={
                        0.7
                      }
                    >
                      <Text
                        style={[
                          styles.modalCloseText,
                          {
                            color:
                              theme.textSecondary,
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
                      mobile && { display: "none" },
                      {
                        color:
                          theme.text,
                      },
                    ]}
                  >
                    Edit passcode
                  </Text>

                  <Text
                    style={[
                      styles.modalSubtitle,
                      {
                        color:
                          theme.textSecondary,
                      },
                    ]}
                  >
                    Update your login
                    details for{" "}
                    <Text
                      style={{
                        fontWeight:
                          "700",
                        color:
                          theme.text,
                      }}
                    >
                      {
                        editingPasscode.platform
                      }
                    </Text>
                  </Text>

                  <Text
                    style={[
                      styles.fieldLabel,
                      {
                        color:
                          theme.textSecondary,
                      },
                    ]}
                  >
                    USERNAME
                  </Text>

                  <TextInput
                    style={[
                      styles.modalInput,
                      {
                        color:
                          theme.text,

                        backgroundColor:
                          theme.background,

                        borderColor:
                          theme.border,
                      },
                    ]}
                    placeholder="Username / Email"
                    placeholderTextColor={
                      theme.textSecondary
                    }
                    value={
                      editUsername
                    }
                    onChangeText={
                      setEditUsername
                    }
                    autoCapitalize="none"
                  />

                  <Text
                    style={[
                      styles.fieldLabel,
                      {
                        color:
                          theme.textSecondary,
                        marginTop: 2,
                      },
                    ]}
                  >
                    PASSWORD
                  </Text>

                  <TextInput
                    style={[
                      styles.modalInput,
                      {
                        color:
                          theme.text,

                        backgroundColor:
                          theme.background,

                        borderColor:
                          theme.border,
                      },
                    ]}
                    placeholder="Password"
                    placeholderTextColor={
                      theme.textSecondary
                    }
                    value={
                      editPassword
                    }
                    onChangeText={
                      setEditPassword
                    }
                    secureTextEntry
                    autoCapitalize="none"
                  />

                  <View
                    style={
                      styles.modalActions
                    }
                  >
                    <TouchableOpacity
                      style={[
                        styles.modalCancelButton,
                        {
                          borderColor:
                            theme.border,
                        },
                      ]}
                      onPress={() =>
                        setEditingPasscode(
                          null
                        )
                      }
                      activeOpacity={
                        0.7
                      }
                    >
                      <Text
                        style={[
                          styles.modalCancelText,
                          {
                            color:
                              theme.text,
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
                          backgroundColor:
                            theme.accent,
                        },

                        updating &&
                        styles.disabledButton,
                      ]}
                      onPress={
                        handleUpdate
                      }
                      disabled={
                        updating
                      }
                      activeOpacity={
                        0.8
                      }
                    >
                      {updating ? (
                        <ActivityIndicator
                          color="#fff"
                        />
                      ) : (
                        <Text
                          style={
                            styles.modalUpdateText
                          }
                        >
                          Save changes
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
          </PasscodeEditorShell>

          {/* =================================================
              DELETE MODAL
          ================================================= */}

          <Modal
            visible={
              !!deleteConfirmId
            }
            transparent
            animationType="none"
            onRequestClose={() =>
              setDeleteConfirmId(
                null
              )
            }
          >
            <View
              style={
                styles.modalOverlay
              }
            >
              <View
                style={[
                  styles.deleteModal,
                  {
                    backgroundColor:
                      theme.backgroundElement,
                  },
                ]}
              >
                <View
                  style={
                    styles.deleteModalTop
                  }
                >
                  <View
                    style={[
                      styles.deleteIconCircle,
                      {
                        backgroundColor:
                          theme.danger +
                          "18",
                      },
                    ]}
                  >
                    <Text
                      style={
                        styles.deleteModalIcon
                      }
                    >
                      🗑
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() =>
                      setDeleteConfirmId(
                        null
                      )
                    }
                    style={
                      styles.modalCloseButton
                    }
                    activeOpacity={
                      0.7
                    }
                  >
                    <Text
                      style={[
                        styles.modalCloseText,
                        {
                          color:
                            theme.textSecondary,
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
                      color:
                        theme.text,
                    },
                  ]}
                >
                  Delete passcode?
                </Text>

                <Text
                  style={[
                    styles.modalSubtitle,
                    {
                      color:
                        theme.textSecondary,
                    },
                  ]}
                >
                  This passcode will
                  be permanently
                  removed. This action
                  cannot be undone.
                </Text>

                <View
                  style={[
                    styles.warningBox,
                    {
                      backgroundColor:
                        theme.danger +
                        "0D",

                      borderColor:
                        theme.danger +
                        "25",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.warningText,
                      {
                        color:
                          theme.text,
                      },
                    ]}
                  >
                    🔒 Your saved
                    credentials will
                    be deleted from
                    your account.
                  </Text>
                </View>

                <View
                  style={
                    styles.modalActions
                  }
                >
                  <TouchableOpacity
                    style={[
                      styles.modalCancelButton,
                      {
                        borderColor:
                          theme.border,
                      },
                    ]}
                    onPress={() =>
                      setDeleteConfirmId(
                        null
                      )
                    }
                    activeOpacity={
                      0.7
                    }
                  >
                    <Text
                      style={[
                        styles.modalCancelText,
                        {
                          color:
                            theme.text,
                        },
                      ]}
                    >
                      Keep it
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modalDeleteButton,
                      {
                        backgroundColor:
                          theme.danger,
                      },

                      deleting &&
                      styles.disabledButton,
                    ]}
                    onPress={
                      confirmDelete
                    }
                    disabled={
                      deleting
                    }
                    activeOpacity={
                      0.8
                    }
                  >
                    {deleting ? (
                      <ActivityIndicator
                        color="#fff"
                      />
                    ) : (
                      <Text
                        style={
                          styles.modalDeleteText
                        }
                      >
                        Delete permanently
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
    </>
  );
}

