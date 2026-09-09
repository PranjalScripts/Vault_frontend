import React from "react";
import { Text, View } from "react-native";

import { PAGE_SIZE } from "@/features/todos/features/types";
import styles from "@/features/todos/features/todos.styles";

interface SectionHeaderProps {
  search: string;
  filteredCount: number;
  page: number;
  totalTodos: number;
  theme: any;
}

export function SectionHeader({
  search,
  filteredCount,
  page,
  totalTodos,
  theme,
}: SectionHeaderProps) {
  const hasSearch = search.trim().length > 0;

  let countText = "";

  if (hasSearch) {
    countText = `${filteredCount} ${
      filteredCount === 1 ? "task" : "tasks"
    }`;
  } else if (totalTodos === 0) {
    countText = "0 / 0";
  } else {
    countText = `${(page - 1) * PAGE_SIZE + 1}–${Math.min(
      page * PAGE_SIZE,
      totalTodos
    )} / ${totalTodos}`;
  }

  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionLeft}>
        <View
          style={[
            styles.sectionIndicator,
            { backgroundColor: theme.accent },
          ]}
        />

        <Text
          style={[styles.sectionTitle, { color: theme.text }]}
        >
          All tasks
        </Text>
      </View>

      <Text
        style={[
          styles.sectionCount,
          { color: theme.textSecondary },
        ]}
      >
        {countText}
      </Text>
    </View>
  );
}
