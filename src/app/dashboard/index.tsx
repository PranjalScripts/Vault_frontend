import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  Pressable,
  View,
  useColorScheme,
  useWindowDimensions,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import { AppLayout } from "@/components/AppLayout";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import {
  ActivityOverview,
  DashboardSubject,
  PasscodesPreview,
  SubjectsPreview,
  TodoPreview,
} from "@/components/dashboard/DashboardPreviews";
import { getPasscodes, getSubjects, getTodos, updateTodo } from "@/api/api";
import type { Todo } from "@/features/todos/features/types";
import type { Passcode, RawPasscode } from "@/features/passcodes/types";
import { isEncryptedField } from "@/features/passcodes/utils/passcodeCrypto";
import { decryptWithVaultKey } from "@/crypto/vaultCrypto";
import { useVault } from "@/contexts/vaultContext";
import { useTheme } from "@/hooks/use-theme";

type DashboardData = {
  todos: Todo[];
  totalTodos: number;
  completedTodos: number;
  subjects: DashboardSubject[];
  totalSubjects: number;
  totalTopics: number;
  passcodes: Passcode[];
  totalPasscodes: number;
};
const initialData: DashboardData = {
  todos: [],
  totalTodos: 0,
  completedTodos: 0,
  subjects: [],
  totalSubjects: 0,
  totalTopics: 0,
  passcodes: [],
  totalPasscodes: 0,
};

// TODO: Replace this adapter when streak tracking is added to the backend.
const getDashboardStreak = () => 0;

export default function DashboardScreen() {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { vaultKey, isVaultUnlocked } = useVault();
  const [data, setData] = useState<DashboardData>(initialData);
  const [loading, setLoading] = useState(true);
  const isMobile = width < 700;
  const isTablet = width >= 700 && width < 1100;

  const decryptPreview = useCallback(
    async (item: RawPasscode): Promise<Passcode> => {
      if (!vaultKey) throw new Error("Vault is locked");
      const username = isEncryptedField(item.username)
        ? await decryptWithVaultKey(item.username, vaultKey)
        : item.username;
      return {
        _id: item._id,
        platform: item.platform,
        username,
        updatedAt: item.updatedAt,
        srNo: item.srNo,
      };
    },
    [vaultKey],
  );

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    const [allTodosResult, completedResult, subjectsResult, passcodesResult] =
      await Promise.allSettled([
        getTodos({ page: 1, limit: 20 }),
        getTodos({ page: 1, limit: 1, status: "completed" }),
        getSubjects(),
        getPasscodes({ page: 1, limit: 3, sort: "newest" }),
      ]);
    try {
      const todoResponse =
        allTodosResult.status === "fulfilled" ? allTodosResult.value.data : {};
      const completedResponse =
        completedResult.status === "fulfilled"
          ? completedResult.value.data
          : {};
      const subjectResponse =
        subjectsResult.status === "fulfilled" ? subjectsResult.value.data : {};
      const passcodeResponse =
        passcodesResult.status === "fulfilled"
          ? passcodesResult.value.data
          : {};
      const subjects: DashboardSubject[] = Array.isArray(subjectResponse.data)
        ? subjectResponse.data
        : [];
      const rawPasscodes: RawPasscode[] = Array.isArray(passcodeResponse.data)
        ? passcodeResponse.data
        : [];
      const passcodes =
        isVaultUnlocked && vaultKey
          ? await Promise.all(rawPasscodes.map(decryptPreview))
          : [];
      setData({
        todos: Array.isArray(todoResponse.data) ? todoResponse.data : [],
        totalTodos:
          todoResponse.pagination?.total ?? todoResponse.data?.length ?? 0,
        completedTodos:
          completedResponse.pagination?.total ??
          completedResponse.data?.length ??
          0,
        subjects,
        totalSubjects: subjectResponse.pagination?.total ?? subjects.length,
        totalTopics: subjects.reduce(
          (sum, subject) => sum + (subject.topics?.length || 0),
          0,
        ),
        passcodes,
        totalPasscodes:
          passcodeResponse.pagination?.total ?? rawPasscodes.length,
      });
    } catch (error) {
      console.log("DASHBOARD DATA ERROR:", error);
    } finally {
      setLoading(false);
    }
  }, [decryptPreview, isVaultUnlocked, vaultKey]);

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
    }, [loadDashboard]),
  );

  const handleToggleTodo = useCallback(async (todo: Todo) => {
    const nextCompleted = !todo.isCompleted;
    setData((current) => ({
      ...current,
      todos: current.todos.map((item) =>
        item._id === todo._id ? { ...item, isCompleted: nextCompleted } : item,
      ),
      completedTodos: Math.max(
        0,
        current.completedTodos + (nextCompleted ? 1 : -1),
      ),
    }));
    try {
      const response = await updateTodo(todo._id, {
        isCompleted: nextCompleted,
      });
      setData((current) => ({
        ...current,
        todos: current.todos.map((item) =>
          item._id === todo._id ? response.data.data : item,
        ),
      }));
    } catch {
      setData((current) => ({
        ...current,
        todos: current.todos.map((item) =>
          item._id === todo._id ? todo : item,
        ),
        completedTodos: Math.max(
          0,
          current.completedTodos + (nextCompleted ? -1 : 1),
        ),
      }));
      Alert.alert("Unable to update", "Please try again.");
    }
  }, []);

  const statCards = useMemo(
    () => [
      {
        title: "To Do",
        value: data.totalTodos,
        detail: `${data.completedTodos} completed`,
        icon: "✓",
        accent: "#7047EB",
        lightTint: "#F6F2FF",
        darkTint: "#251F35",
      },
      {
        title: "Subjects",
        value: data.totalSubjects,
        detail: `${data.totalTopics} topics`,
        icon: "▤",
        accent: "#1FA357",
        lightTint: "#F1F8F2",
        darkTint: "#182B20",
      },
      {
        title: "Passcodes",
        value: data.totalPasscodes,
        detail: isVaultUnlocked ? "Vault unlocked" : "Vault locked",
        icon: "▣",
        accent: "#2878F0",
        lightTint: "#F0F6FF",
        darkTint: "#19283C",
      },
      {
        title: "Today's Streak",
        value: getDashboardStreak(),
        detail: "Days in a row",
        icon: "🔥",
        accent: "#F29B18",
        lightTint: "#FFF8E9",
        darkTint: "#332716",
      },
    ],
    [data, isVaultUnlocked],
  );
  const nav = useCallback(
    (path: string) => router.push(path as never),
    [router],
  );

  const todosCard = (
    <DashboardSection
      title="Today's To Do"
      theme={theme}
      actionLabel="Add Todo"
      compactAction={isMobile}
      onAction={() => nav("/todos")}
      footerLabel="View all todos"
      onFooter={() => nav("/todos")}
      minHeight={isMobile ? undefined : 326}
    >
      <TodoPreview
        todos={data.todos}
        loading={loading}
        theme={theme}
        onToggle={handleToggleTodo}
      />
    </DashboardSection>
  );
  const subjectsCard = (
    <DashboardSection
      title="Subjects"
      theme={theme}
      actionLabel="Add Subject"
      compactAction={isMobile}
      onAction={() => nav("/subjects")}
      footerLabel="View all subjects"
      onFooter={() => nav("/subjects")}
    >
      <SubjectsPreview
        subjects={data.subjects}
        loading={loading}
        theme={theme}
        onOpen={(id) =>
          router.push({ pathname: "/subjects/[id]", params: { id } })
        }
      />
    </DashboardSection>
  );
  const passcodesCard = (
    <DashboardSection
      title="Passcodes"
      theme={theme}
      actionLabel="Add Passcode"
      compactAction={isMobile}
      onAction={() => nav("/passcodes")}
      footerLabel="View all passcodes"
      onFooter={() => nav("/passcodes")}
    >
      <PasscodesPreview
        passcodes={data.passcodes}
        loading={loading}
        unlocked={isVaultUnlocked}
        theme={theme}
      />
    </DashboardSection>
  );
  const activityCard = (
    <DashboardSection
      title="Activity Overview"
      theme={theme}
      minHeight={isMobile ? undefined : 326}
    >
      <ActivityOverview
        completed={data.completedTodos}
        subjects={data.totalSubjects}
        passcodes={data.totalPasscodes}
        theme={theme}
      />
    </DashboardSection>
  );

  return (
    <AppLayout>
      <View style={styles.page}>
        <View style={styles.greetingRow}>
          <View style={styles.greeting}>
            <Text
              style={[
                styles.greetingTitle,
                isMobile && styles.mobileGreeting,
                { color: theme.text },
              ]}
            >
              Hello, Pranjal 👋
            </Text>
            <Text
              style={[styles.greetingSubtitle, { color: theme.textSecondary }]}
            >
              Stay organized. Stay secure.
            </Text>
          </View>
         
        </View>
        <View style={styles.statsGrid}>
          {statCards.map((card) => (
            <View
              key={card.title}
              style={[
                styles.statSlot,
                isMobile && styles.mobileStatSlot,
                isTablet && styles.tabletStatSlot,
              ]}
            >
              <DashboardStatCard
                {...card}
                tint={colorScheme === "dark" ? card.darkTint : card.lightTint}
                compact={isMobile}
                textColor={theme.text}
                mutedColor={theme.textSecondary}
              />
            </View>
          ))}
        </View>
        {isMobile ? (
          <View style={styles.stack}>
            {todosCard}
            {subjectsCard}
            {passcodesCard}
            {activityCard}
          </View>
        ) : (
          <>
            <View style={[styles.contentRow, isTablet && styles.tabletStack]}>
              <View style={styles.column}>{todosCard}</View>
              <View style={styles.column}>{activityCard}</View>
            </View>
            <View style={[styles.contentRow, isTablet && styles.tabletStack]}>
              <View style={styles.column}>{subjectsCard}</View>
              <View style={styles.column}>{passcodesCard}</View>
            </View>
          </>
        )}
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  page: {
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
    paddingBottom: 12,
  },
  greetingRow: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 24,
    marginBottom: 26,
  },
  greeting: { flexShrink: 0 },
  greetingTitle: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  mobileGreeting: { fontSize: 23, lineHeight: 29 },
  greetingSubtitle: { fontSize: 13, marginTop: 5 },
  searchBox: {
    width: "34%",
    minWidth: 280,
    maxWidth: 380,
    height: 46,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  searchIcon: { fontSize: 22, marginRight: 9 },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 13,
    outlineStyle: "none",
  } as any,
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -7,
    marginBottom: 12,
  },
  statSlot: { width: "25%", paddingHorizontal: 7, marginBottom: 14 },
  mobileStatSlot: { width: "50%", paddingHorizontal: 5, marginBottom: 10 },
  tabletStatSlot: { width: "50%" },
  contentRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
    alignItems: "stretch",
  },
  column: { flex: 1, minWidth: 0 },
  tabletStack: { flexDirection: "column" },
  stack: { gap: 12 },
});
