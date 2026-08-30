import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { MenuPosition } from "./useTodosState";
import styles from "./todos.styles";

interface MultipleDeleteOverlayProps {
  visible: boolean;
  multipleDeletePosition: MenuPosition;
  isMobile: boolean;
  theme: any;
  onClose: () => void;
  onDeleteCompleted: () => void;
  onDeletePending: () => void;
}

export function MultipleDeleteOverlay({
  visible,
  multipleDeletePosition,
  isMobile,
  theme,
  onClose,
  onDeleteCompleted,
  onDeletePending,
}: MultipleDeleteOverlayProps) {
  if (!visible) {
    return null;
  }

  const menuWidth = isMobile ? 190 : 210;

  return (
    <View style={styles.filterOverlay} pointerEvents="box-none">
      <TouchableOpacity
        style={styles.modalBackdrop}
        activeOpacity={1}
        onPress={onClose}
      />

      <View
        style={[
          styles.filterMenu,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
            top: multipleDeletePosition.top,
            left: multipleDeletePosition.left,
            width: menuWidth,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.deleteMenuOption}
          activeOpacity={0.7}
          onPress={onDeleteCompleted}
        >
          <Text
            style={[
              styles.deleteMenuIcon,
              { color: theme.accent },
            ]}
          >
            ✓
          </Text>

          <Text
            style={[
              styles.deleteMenuText,
              { color: theme.text },
            ]}
          >
            Delete completed
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteMenuOption}
          activeOpacity={0.7}
          onPress={onDeletePending}
        >
          <Text
            style={[
              styles.deleteMenuIcon,
              { color: theme.textSecondary },
            ]}
          >
            ○
          </Text>

          <Text
            style={[
              styles.deleteMenuText,
              { color: theme.text },
            ]}
          >
            Delete pending
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
