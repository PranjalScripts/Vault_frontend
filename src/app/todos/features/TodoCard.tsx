import React from "react";
import {
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Todo, PAGE_SIZE } from "./types";
import styles from "./todos.styles";

interface TodoCardProps {
  item: Todo;
  index: number;
  page: number;
  theme: any;
  isMobile: boolean;
  isDesktop: boolean;
  onToggle: (todo: Todo) => void;
  onDelete: (id: string) => void;
}

export function TodoCard({
  item,
  index,
  page,
  theme,
  isMobile,
  isDesktop,
  onToggle,
  onDelete,
}: TodoCardProps) {
  /*
   * Serial number based on actual
   * pagination position.
   */

  const serialNumber = (page - 1) * PAGE_SIZE + index + 1;

  return (
    <TouchableOpacity
      activeOpacity={0.94}
      onPress={() => onToggle(item)}
      style={[
        styles.card,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
        },
        isMobile && styles.mobileCard,
        isDesktop && styles.desktopCard,
      ]}
    >
      <View style={styles.cardTop}>
        {/* =================================================
            SR NO
            ================================================= */}

        <View style={styles.cardTopLeft}>
          <View
            style={[
              styles.serialNumber,
              { backgroundColor: `${theme.accent}14` },
            ]}
          >
            <Text
              style={[
                styles.serialNumberText,
                { color: theme.accent },
              ]}
            >
              {serialNumber}
            </Text>
          </View>

          {/* =================================================
              CHECKBOX
              ================================================= */}

          <TouchableOpacity
            style={[
              styles.checkbox,
              {
                borderColor: item.isCompleted
                  ? theme.accent
                  : theme.border,
                backgroundColor: item.isCompleted
                  ? theme.accent
                  : "transparent",
              },
            ]}
            onPress={() => onToggle(item)}
            activeOpacity={0.75}
          >
            {item.isCompleted && (
              <Text style={styles.tick}>✓</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* =================================================
            STATUS
            ================================================= */}

        <View
          style={[
            styles.status,
            {
              backgroundColor: item.isCompleted
                ? `${theme.accent}14`
                : `${theme.textSecondary}12`,
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: item.isCompleted
                  ? theme.accent
                  : theme.textSecondary,
              },
            ]}
          />

          <Text
            style={[
              styles.statusText,
              {
                color: item.isCompleted
                  ? theme.accent
                  : theme.textSecondary,
              },
            ]}
          >
            {item.isCompleted ? "Done" : "Open"}
          </Text>
        </View>
      </View>

      <Text
        style={[
          styles.cardTitle,
          { color: theme.text },
          item.isCompleted && styles.completedTitle,
        ]}
        numberOfLines={4}
      >
        {item.title}
      </Text>

      {item.description ? (
        <Text
          style={[
            styles.description,
            { color: theme.textSecondary },
            item.isCompleted && styles.completedDescription,
          ]}
          numberOfLines={3}
        >
          {item.description}
        </Text>
      ) : null}

      <View style={styles.cardBottom}>
        <View style={styles.dateContainer}>
          <Text
            style={[
              styles.dateIcon,
              { color: theme.textSecondary },
            ]}
          >
            •
          </Text>

          <Text
            style={[styles.date, { color: theme.textSecondary }]}
          >
            {item.createdAt
              ? new Date(item.createdAt).toLocaleDateString(
                  undefined,
                  {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }
                )
              : ""}
          </Text>
        </View>

        {/* =================================================
            DELETE BUTTON
            IMPORTANT:
            stop card toggle by using nested
            TouchableOpacity.
            ================================================= */}

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(item._id)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.deleteText,
              { color: theme.textSecondary },
            ]}
          >
            Delete
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}
