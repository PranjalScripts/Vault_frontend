import React from "react";
import {
  ActivityIndicator,
  Text,
  View,
} from "react-native";

import { FilterType } from "@/features/todos/features/types";
import styles from "@/features/todos/features/todos.styles";

interface EmptyStateProps {
  loading: boolean;
  search: string;
  filter: FilterType;
  theme: any;
}

export function EmptyState({
  loading,
  search,
  filter,
  theme,
}: EmptyStateProps) {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={theme.accent} />
      </View>
    );
  }

  if (
    search.trim() ||
    filter === "completed" ||
    filter === "pending"
  ) {
    return (
      <View
        style={[styles.empty, { borderColor: theme.border }]}
      >
        <View
          style={[
            styles.emptyIcon,
            { backgroundColor: `${theme.accent}14` },
          ]}
        >
          <Text
            style={[
              styles.emptyIconText,
              { color: theme.accent },
            ]}
          >
            ⌕
          </Text>
        </View>

        <Text
          style={[styles.emptyTitle, { color: theme.text }]}
        >
          No matching tasks
        </Text>

        <Text
          style={[
            styles.emptyText,
            { color: theme.textSecondary },
          ]}
        >
          Try changing your search or filter.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.empty, { borderColor: theme.border }]}>
      <View
        style={[
          styles.emptyIcon,
          { backgroundColor: `${theme.accent}14` },
        ]}
      >
        <Text
          style={[
            styles.emptyIconText,
            { color: theme.accent },
          ]}
        >
          ✓
        </Text>
      </View>

      <Text style={[styles.emptyTitle, { color: theme.text }]}>
        No tasks yet
      </Text>

      <Text
        style={[
          styles.emptyText,
          { color: theme.textSecondary },
        ]}
      >
        Add your first task above.
      </Text>
    </View>
  );
}
