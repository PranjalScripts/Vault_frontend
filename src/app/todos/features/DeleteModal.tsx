import React from "react";
import {
  ActivityIndicator,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { DeleteType } from "./types";
import styles from "./todos.styles";

interface DeleteModalProps {
  visible: boolean;
  deleteType: DeleteType;
  deleteSingleId: string | null;
  deletingMultiple: boolean;
  theme: any;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteModal({
  visible,
  deleteType,
  deleteSingleId,
  deletingMultiple,
  theme,
  onClose,
  onConfirm,
}: DeleteModalProps) {
  const isBulk = deleteType !== null;

  let titleText = "Delete task";
  let messageText =
    "Are you sure you want to delete this task?";

  if (deleteType === "completed") {
    titleText = "Delete completed tasks";
    messageText =
      "Are you sure you want to delete all completed tasks?";
  }

  if (deleteType === "pending") {
    titleText = "Delete pending tasks";
    messageText =
      "Are you sure you want to delete all pending tasks?";
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!deletingMultiple) {
          onClose();
        }
      }}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity
          style={styles.modalBackground}
          activeOpacity={1}
          onPress={() => {
            if (!deletingMultiple) {
              onClose();
            }
          }}
        />

        <View
          style={[
            styles.deleteModal,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
            },
          ]}
        >
          <View
            style={[
              styles.deleteModalIcon,
              { backgroundColor: `${theme.accent}14` },
            ]}
          >
            <Text
              style={[
                styles.deleteModalIconText,
                { color: theme.accent },
              ]}
            >
              {isBulk ? "×" : "!"}
            </Text>
          </View>

          <Text
            style={[
              styles.deleteModalTitle,
              { color: theme.text },
            ]}
          >
            {titleText}
          </Text>

          <Text
            style={[
              styles.deleteModalMessage,
              { color: theme.textSecondary },
            ]}
          >
            {messageText}
          </Text>

          <View style={styles.deleteModalActions}>
            <TouchableOpacity
              style={[
                styles.cancelButton,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.backgroundElement,
                },
              ]}
              disabled={deletingMultiple}
              onPress={onClose}
            >
              <Text
                style={[
                  styles.cancelButtonText,
                  { color: theme.text },
                ]}
              >
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmDeleteButton,
                { backgroundColor: theme.accent },
                deletingMultiple && styles.disabled,
              ]}
              disabled={deletingMultiple}
              onPress={onConfirm}
            >
              {deletingMultiple ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.confirmDeleteText}>
                  Delete
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
