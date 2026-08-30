import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { FilterType } from "./types";
import { MenuPosition } from "./useTodosState";
import styles from "./todos.styles";

const FILTER_OPTIONS: {
  value: FilterType;
  label: string;
  icon: string;
}[] = [
  { value: "newest", label: "Newly added", icon: "↓" },
  { value: "oldest", label: "Oldest", icon: "↑" },
  { value: "completed", label: "Completed", icon: "✓" },
  { value: "pending", label: "Pending", icon: "○" },
];

interface FilterOverlayProps {
  visible: boolean;
  filter: FilterType;
  filterPosition: MenuPosition;
  isMobile: boolean;
  theme: any;
  onClose: () => void;
  onSelect: (value: FilterType) => void;
}

export function FilterOverlay({
  visible,
  filter,
  filterPosition,
  isMobile,
  theme,
  onClose,
  onSelect,
}: FilterOverlayProps) {
  if (!visible) {
    return null;
  }

  const menuWidth = isMobile ? 168 : 188;

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
            top: filterPosition.top,
            left: filterPosition.left,
            width: menuWidth,
          },
        ]}
      >
        {FILTER_OPTIONS.map((option) => {
          const active = filter === option.value;

          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.filterOption,
                active && {
                  backgroundColor: `${theme.accent}14`,
                },
              ]}
              activeOpacity={0.7}
              onPress={() => onSelect(option.value)}
            >
              <Text
                style={[
                  styles.filterOptionIcon,
                  {
                    color: active
                      ? theme.accent
                      : theme.textSecondary,
                  },
                ]}
              >
                {option.icon}
              </Text>

              <Text
                style={[
                  styles.filterOptionText,
                  {
                    color: active ? theme.accent : theme.text,
                  },
                ]}
              >
                {option.label}
              </Text>

              {active && (
                <Text
                  style={[
                    styles.filterCheck,
                    { color: theme.accent },
                  ]}
                >
                  ✓
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
