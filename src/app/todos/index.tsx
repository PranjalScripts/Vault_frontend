import { useFeedbackModal } from "@/contexts/FeedbackModalContext";
import { shadow } from "@/styles/shadow";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Button } from "@/components/subjects/SubjectUI";
import { AppLayout } from "@/components/AppLayout";
import {
  createTodo,
  deleteTodo,
  getTodoStats,
  getTodos,
  updateTodo,
} from "@/api/api";
import { useTheme } from "@/hooks/use-theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Feather from "@expo/vector-icons/Feather";
import { TodoCard } from "@/features/todos/features/TodoCard";
import {
  TodoFormModal,
  type TodoDraft,
} from "@/features/todos/features/TodoFormModal";
import type {
  Todo,
  TodoSort,
  TodoStatus,
} from "@/features/todos/features/types";

import { TODO_CATEGORIES } from "@/features/todos/features/types";

const PAGE_SIZE = 10;
type MenuAnchor = { x: number; y: number; width: number; height: number };
type Stats = {
  total: number;
  completed: number;
  pending: number;
  dueToday: number;
};
const initialStats: Stats = { total: 0, completed: 0, pending: 0, dueToday: 0 };

export default function TodosScreen() {
  const { showSuccess, showError, confirm } = useFeedbackModal();
  const theme = useTheme();
  const dark = useColorScheme() === "dark";
  const { itemId } = useLocalSearchParams<{ itemId?: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 700;
  const isCompact = width < 1100;
  const [todos, setTodos] = useState<Todo[]>([]);
  const [stats, setStats] = useState<Stats>(initialStats);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const [loading, setLoading] = useState(true);
  const toggleLock = useRef(false);
  const deleteLock = useRef(false);
  const [updating, setUpdating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [category, setCategory] = useState("all");
  const [categories, setCategories] = useState<string[]>(TODO_CATEGORIES);
  const [status, setStatus] = useState<TodoStatus>("all");
  const [sort, setSort] = useState<TodoSort>("newest");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [showSort, setShowSort] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const filterAnchor = useRef<View>(null);
  const sortAnchor = useRef<View>(null);
  const [menuAnchor, setMenuAnchor] = useState<MenuAnchor | null>(null);
  const openOptions = (mode: "filter" | "sort") => {
    const open = () => {
      setShowFilter(mode === "filter");
      setShowSort(mode === "sort");
    };
    if (Platform.OS === "web") {
      const ref = mode === "filter" ? filterAnchor : sortAnchor;
      ref.current?.measureInWindow((x, y, width, height) => {
        setMenuAnchor({ x, y, width, height });
        open();
      });
    } else open();
  };


  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(
    async (requestedPage = 1) => {
      setLoading(true);
      try {
        const [listResponse, statsResponse] = await Promise.all([
          getTodos({
            page: requestedPage,
            limit: PAGE_SIZE,
            status: itemId || status === "all" ? undefined : status,
            search: itemId ? undefined : query,
            sort,
            pendingFirst: isMobile,
            category: itemId || category === "all" ? undefined : category,
            itemId,
          }),
          getTodoStats(),
        ]);
        setTodos(listResponse.data?.data || []);
        setCategories(listResponse.data?.categories || TODO_CATEGORIES);
        setPage(listResponse.data?.pagination?.page || 1);
        setTotalPages(listResponse.data?.pagination?.totalPages || 0);
        setTotalMatches(listResponse.data?.pagination?.total || 0);
        setStats(statsResponse.data?.data || initialStats);
      } catch (error) {
        console.log("TODO LOAD ERROR:", error);
        showError({ title: "Unable to load tasks", message: "Please check your connection and try again." });
      } finally {
        setLoading(false);
      }
    },
    [query, sort, status, category, itemId, isMobile, showError],
  );

  useFocusEffect(
    useCallback(() => {
      void load(1);
    }, [load]),
  );

  const saveTodo = async (draft: TodoDraft) => {
    try {
      setSaving(true);
      if (editingTodo) await updateTodo(editingTodo._id, draft);
      else await createTodo(draft);
      setFormVisible(false);
      setEditingTodo(null);
      showSuccess({ title: editingTodo ? "Task Updated" : "Task Created", message: editingTodo ? "Your task has been updated successfully." : "Your task has been created successfully." });
      await load(editingTodo ? page : 1);
    } catch (error: any) {
      showError({ title: editingTodo ? "Unable to update task" : "Unable to add task", message: error?.response?.data?.message || "Please check the task details." });
    } finally {
      setSaving(false);
    }
  };

  const toggleTodo = async (todo: Todo) => {
    if (toggleLock.current) return;
    toggleLock.current = true;
    setUpdating(true);
    const completed = !todo.isCompleted;
    setTodos((current) =>
      current.map((item) =>
        item._id === todo._id ? { ...item, isCompleted: completed } : item,
      ),
    );
    setStats((current) => ({
      ...current,
      completed: current.completed + (completed ? 1 : -1),
      pending: current.pending + (completed ? -1 : 1),
    }));
    try {
      await updateTodo(todo._id, { isCompleted: completed });
      showSuccess({ title: completed ? "Task Completed" : "Task Reopened", message: completed ? "Your task has been marked as completed." : "Your task has been marked as pending." });
      if (status !== "all" || isMobile) await load(page);
    } catch {
      setTodos(current => current.map(item => item._id === todo._id ? todo : item));
      setStats(current => ({ ...current, completed: current.completed - (completed ? 1 : -1), pending: current.pending - (completed ? -1 : 1) }));
      await load(page);
      showError({ title: "Unable to update task", message: "Please try again." });
    } finally {
      toggleLock.current = false;
      setUpdating(false);
    }
  };

  const removeTodo = async (id: string) => {
    if (deleteLock.current) return;
    deleteLock.current = true;
    try {
      if (!(await confirm({ title: "Delete Task?", message: "Are you sure you want to delete this task? This action cannot be undone." }))) return;
      await deleteTodo(id);
      showSuccess({ title: "Task Deleted", message: "The task has been deleted successfully." });
      await load(page);
    } catch {
      showError({ title: "Unable to delete task", message: "Please try again." });
    } finally {
      deleteLock.current = false;
    }
  };

  const statCards = useMemo(
    () => [
      {
        label: "All Tasks",
        value: stats.total,
        detail: "Total tasks",
        icon: "check-square" as const,
        color: "#16824B",
        tint: "#EFF8F2",
        target: "all" as TodoStatus,
      },
      {
        label: "Completed",
        value: stats.completed,
        detail: `${stats.total ? Math.round((stats.completed / stats.total) * 100) : 0}% completed`,
        icon: "check-circle" as const,
        color: "#7047EB",
        tint: "#F4F0FF",
        target: "completed" as TodoStatus,
      },
      {
        label: "Pending",
        value: stats.pending,
        detail: `${stats.total ? Math.round((stats.pending / stats.total) * 100) : 0}% pending`,
        icon: "clock" as const,
        color: "#EF8217",
        tint: "#FFF6EC",
        target: "pending" as TodoStatus,
      },
      {
        label: "Due Today",
        value: stats.dueToday,
        detail: "Stay focused",
        icon: "calendar" as const,
        color: "#2878F0",
        tint: "#EFF6FF",
        target: "all" as TodoStatus,
      },
    ],
    [stats],
  );

  const rangeStart = totalMatches ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, totalMatches);
  const sortLabel = {
    newest: "Newest",
    oldest: "Oldest",
    dueSoon: "Due soon",
    priority: "Priority",
  }[sort];
  const mobileHeaderActions = (
    <View style={styles.headerActions}>
      <TouchableOpacity
        accessibilityLabel="Add task"
        onPress={() => {
          setEditingTodo(null);
          setFormVisible(true);
        }}
        style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
      >
        <Feather name="plus" size={27} color={theme.accent} />
      </TouchableOpacity>
    </View>
  );

  const header = (
    <View>
      {!!itemId && (
        <View style={{ paddingVertical: 12, gap: 8 }}>
          <Text style={{ color: theme.textSecondary }}>
            Showing the task selected in search.
          </Text>
          <Button
            label="Show all todos"
            secondary
            onPress={() => {
              router.setParams({ itemId: "" });
              setSearch("");
              setStatus("all");
              setCategory("all");
            }}
          />
        </View>
      )}
      {!isMobile && (
        <View style={styles.heading}>
          <View>
            <Text style={[styles.headingTitle, { color: theme.text }]}>
              To Do
            </Text>
            <Text
              style={[styles.headingSubtitle, { color: theme.textSecondary }]}
            >
              Stay on track and get things done.
            </Text>
          </View>
        </View>
      )}
      {!isCompact && (
        <View style={styles.desktopToolbar}>
          <View
            style={[
              styles.search,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.searchIcon, { color: theme.textSecondary }]}>
              ⌕
            </Text>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search tasks..."
              placeholderTextColor={theme.textSecondary}
              style={[styles.searchInput, { color: theme.text }]}
            />
          </View>
          <View ref={filterAnchor} collapsable={false} style={styles.menuAnchor}>
            <ToolbarButton
              label="Filter"
              icon="▽"
              theme={theme}
              onPress={() => openOptions("filter")}
            />
          </View>
          <View ref={sortAnchor} collapsable={false} style={[styles.menuAnchor, styles.sortAnchor]}>
            <ToolbarButton
              label={`Sort: ${sortLabel}`}
              icon="⇆"
              theme={theme}
              onPress={() => openOptions("sort")}
              wide
            />
          </View>
          <TouchableOpacity
            style={[styles.addTask, { backgroundColor: theme.accent }]}
            onPress={() => {
              setEditingTodo(null);
              setFormVisible(true);
            }}
          >
            <Text style={styles.addTaskText}>＋ Add Task</Text>
          </TouchableOpacity>
        </View>
      )}
      {isCompact && !isMobile && (
        <View style={styles.tabletToolbar}>
          <View
            style={[
              styles.search,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.searchIcon, { color: theme.textSecondary }]}>
              ⌕
            </Text>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search tasks..."
              placeholderTextColor={theme.textSecondary}
              style={[styles.searchInput, { color: theme.text }]}
            />
          </View>
          <TouchableOpacity
            style={[styles.tabletAdd, { backgroundColor: theme.accent }]}
            onPress={() => {
              setEditingTodo(null);
              setFormVisible(true);
            }}
          >
            <Text style={styles.addTaskText}>＋ Add Task</Text>
          </TouchableOpacity>
        </View>
      )}
      <View
        style={[
          styles.stats,
          isCompact && styles.compactStats,
          isMobile && styles.mobileStats,
        ]}
      >
        {statCards.map((card) => (
          <TouchableOpacity
            key={card.label}
            accessibilityRole="button"
            accessibilityLabel={`${card.label}: ${card.value}. ${card.detail}`}
            activeOpacity={0.8}
            onPress={() => {
              setStatus(card.target);
              if (card.label === "Due Today") setSearch("");
            }}
            style={[
              styles.statCard,
              isCompact && styles.compactStatCard,
              isMobile && styles.mobileStatCard,
              {
                backgroundColor: dark ? theme.backgroundElement : card.tint,
                borderColor: dark ? theme.border : `${card.color}18`,
              },
            ]}
          >
            <View
              style={[
                styles.statIcon,
                isCompact && styles.compactStatIcon,
                {
                  backgroundColor: dark
                    ? theme.backgroundSelected
                    : `${card.color}0D`,
                },
              ]}
            >
              <Feather
                name={card.icon}
                size={isCompact ? 22 : 24}
                color={dark ? theme.accent : card.color}
              />
            </View>
            <Text
              style={[
                styles.statValue,
                isCompact && styles.mobileStatValue,
                { color: theme.text },
              ]}
            >
              {card.value}
            </Text>
            <Text
              numberOfLines={1}
              style={[
                styles.statLabel,
                isCompact && styles.mobileStatLabel,
                isMobile && styles.phoneStatLabel,
                { color: theme.textSecondary },
              ]}
            >
              {isMobile && card.label === "Completed" ? "Done" : isMobile && card.label === "Due Today" ? "Today" : card.label}
            </Text>
            {!isCompact && (
              <Text style={[styles.statDetail, { color: theme.textSecondary }]}>
                {card.detail}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
      {isCompact && (
        <View style={styles.mobileToolbar}>
          <View ref={filterAnchor} collapsable={false} style={[styles.menuAnchor, styles.mobileMenuAnchor]}>
            <ToolbarButton
              label="Filter"
              icon="▽"
              theme={theme}
              compact
              onPress={() => openOptions("filter")}
            />
          </View>
          <View ref={sortAnchor} collapsable={false} style={[styles.menuAnchor, styles.mobileMenuAnchor]}>
            <ToolbarButton
              label={`Sort: ${sortLabel}`}
              icon="⇆"
              theme={theme}
              compact
              onPress={() => openOptions("sort")}
            />
          </View>
        </View>
      )}
      {isMobile && status !== "completed" && <Text style={{ color: theme.textSecondary, fontSize: 12, paddingTop: 8 }}>Swipe left on a task to complete it. Pending tasks appear first.</Text>}
      {!itemId && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 12 }}>
        {["all", ...Array.from(new Set([...categories, ...(category !== "all" ? [category] : [])]))].map(value => <TouchableOpacity
          key={value} accessibilityRole="radio" accessibilityState={{ checked: category === value }} accessibilityLabel={value === "all" ? "All categories" : `Category: ${value}`}
          onPress={() => setCategory(value)}
          style={{ paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderRadius: 9, borderColor: category === value ? theme.accent : theme.border, backgroundColor: category === value ? theme.accentMuted : theme.backgroundElement }}>
          <Text style={{ color: category === value ? theme.accent : theme.textSecondary, fontSize: 12, fontWeight: "600" }}>{value === "all" ? "All categories" : value}</Text>
        </TouchableOpacity>)}
      </ScrollView>}
      <View style={[styles.tabs, { borderBottomColor: theme.border }]}>
        {(["all", "pending", "completed"] as TodoStatus[]).map((value) => (
          <TouchableOpacity
            key={value}
            onPress={() => setStatus(value)}
            style={[
              styles.tab,
              status === value && { borderBottomColor: theme.accent },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: status === value ? theme.accent : theme.textSecondary,
                },
              ]}
            >
              {value === "all"
                ? "All"
                : value[0].toUpperCase() + value.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
        {!isCompact && (
          <View style={styles.topPager}>
            <Text style={[styles.range, { color: theme.textSecondary }]}>
              {rangeStart}–{rangeEnd} of {totalMatches}
            </Text>
            <PagerButton
              direction="‹"
              disabled={page <= 1}
              theme={theme}
              onPress={() => load(page - 1)}
            />
            <PagerButton
              direction="›"
              disabled={page >= totalPages}
              theme={theme}
              onPress={() => load(page + 1)}
            />
          </View>
        )}
      </View>
      {!isCompact && (
        <View
          style={[
            styles.tableHeader,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.hCheck, { color: theme.textSecondary }]}>□</Text>
          <Text style={[styles.hTask, { color: theme.text }]}>Task</Text>
          <Text style={[styles.hCategory, { color: theme.text }]}>
            Category
          </Text>
          <Text style={[styles.hDue, { color: theme.text }]}>Due Date</Text>
          <Text style={[styles.hPriority, { color: theme.text }]}>
            Priority
          </Text>
          <Text style={[styles.hStatus, { color: theme.text }]}>Status</Text>
          <Text style={[styles.hAction, { color: theme.text }]}>Actions</Text>
        </View>
      )}
    </View>
  );

  return (
    <AppLayout
      scrollable={false}
      mobileTitle="To Do"
      mobileHeaderActions={mobileHeaderActions}
    >
      <View style={styles.screen}>
        {isMobile && (
          <View
            style={[
              styles.mobileSearch,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={{ color: theme.textSecondary }}>⌕</Text>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search tasks..."
              placeholderTextColor={theme.textSecondary}
              style={[styles.searchInput, { color: theme.text }]}
            />
          </View>
        )}
        <FlatList
          data={isMobile ? [...todos].sort((a, b) => Number(a.isCompleted) - Number(b.isCompleted)) : todos}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TodoCard
              item={item}
              theme={theme}
              isMobile={isCompact}
              swipeEnabled={isMobile}
              updating={updating}
              onToggle={toggleTodo}
              onEdit={(todo) => {
                setEditingTodo(todo);
                setFormVisible(true);
              }}
              onDelete={removeTodo}
            />
          )}
          ListHeaderComponent={header}
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator style={styles.loading} color={theme.accent} />
            ) : (
              <View style={[styles.empty, { borderColor: theme.border }]}>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>
                  No tasks found
                </Text>
                <Text
                  style={[styles.emptyText, { color: theme.textSecondary }]}
                >
                  Try a different filter or add a new task.
                </Text>
              </View>
            )
          }
          ListFooterComponent={
            <View style={styles.footerPager}>
              <Text style={[styles.range, { color: theme.textSecondary }]}>
                {rangeStart}–{rangeEnd} of {totalMatches}
              </Text>
              <PagerButton
                direction="‹"
                disabled={page <= 1}
                theme={theme}
                onPress={() => load(page - 1)}
              />
              <PagerButton
                direction="›"
                disabled={page >= totalPages}
                theme={theme}
                onPress={() => load(page + 1)}
              />
            </View>
          }
          contentContainerStyle={[
            styles.content,
            isCompact && styles.mobileContent,
          ]}
          showsVerticalScrollIndicator={false}
        />
      </View>
      <OptionsModal
        anchor={menuAnchor}
        visible={showFilter || showSort}
        mode={showFilter ? "filter" : "sort"}
        compact={isCompact}
        status={status}
        sort={sort}
        theme={theme}
        onClose={() => {
          setShowFilter(false);
          setShowSort(false);
        }}
        onStatus={(value) => {
          setStatus(value);
          setShowFilter(false);
        }}
        onSort={(value) => {
          setSort(value);
          setShowSort(false);
        }}
      />
      <TodoFormModal
        visible={formVisible}
        saving={saving}
        theme={theme}
        initialTodo={editingTodo}
        availableCategories={categories}
        onClose={() => {
          setFormVisible(false);
          setEditingTodo(null);
        }}
        onSave={saveTodo}
      />
    </AppLayout>
  );
}

function ToolbarButton({ label, icon, theme, onPress, wide, compact }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.toolbarButton,
        wide && styles.toolbarButtonWide,
        compact && styles.compactToolbarButton,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}
    >
      <Text style={[styles.toolbarIcon, { color: theme.textSecondary }]}>
        {icon}
      </Text>
      <Text
        numberOfLines={1}
        style={[styles.toolbarLabel, { color: theme.text }]}
      >
        {label}
      </Text>
      <Text style={[styles.toolbarChevron, { color: theme.textSecondary }]}>
        ⌄
      </Text>
    </TouchableOpacity>
  );
}
function Option({ label, active, theme, onPress }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.option, active && { backgroundColor: theme.accentMuted }]}
    >
      <Text
        style={{
          color: active ? theme.accent : theme.text,
          fontSize: 12,
          fontWeight: active ? "700" : "500",
        }}
      >
        {label}
      </Text>
      {active && <Text style={{ color: theme.accent }}>✓</Text>}
    </TouchableOpacity>
  );
}
function OptionsModal({
  anchor,
  visible,
  mode,
  compact,
  status,
  sort,
  theme,
  onClose,
  onStatus,
  onSort,
}: {
  anchor: MenuAnchor | null;
  visible: boolean;
  mode: "filter" | "sort";
  compact: boolean;
  status: TodoStatus;
  sort: TodoSort;
  theme: any;
  onClose: () => void;
  onStatus: (value: TodoStatus) => void;
  onSort: (value: TodoSort) => void;
}) {
  const { width, height } = useWindowDimensions();
  const dropdown = Platform.OS === "web";
  useEffect(() => {
    if (!dropdown || !visible) return;
    const dismiss = () => onClose();
    window.addEventListener("resize", dismiss);
    return () => window.removeEventListener("resize", dismiss);
  }, [dropdown, visible, onClose]);
  const dropdownWidth = Math.min(Math.max(anchor?.width ?? 180, 180), width - 16);
  const dropdownHeight = mode === "filter" ? 170 : 208;
  const dropdownTop = anchor ? anchor.y + anchor.height + 6 : 8;
  const values =
    mode === "filter"
      ? ["all", "pending", "completed"]
      : ["newest", "oldest", "dueSoon", "priority"];
  const labels: Record<string, string> = {
    all: "All tasks",
    pending: "Pending",
    completed: "Completed",
    newest: "Newest",
    oldest: "Oldest",
    dueSoon: "Due soon",
    priority: "Priority",
  };
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={[styles.optionsRoot, !dropdown && compact && styles.compactOptionsRoot]}>
        <TouchableOpacity
          style={[styles.optionsBackdrop, dropdown && { backgroundColor: "transparent" }]}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={[
            styles.optionsCard,
            !dropdown && compact && styles.compactOptionsCard,
            dropdown && {
              position: "absolute",
              width: dropdownWidth,
              left: Math.max(8, Math.min(anchor?.x ?? 8, width - dropdownWidth - 8)),
              top: dropdownTop + dropdownHeight <= height - 8 ? dropdownTop : Math.max(8, (anchor?.y ?? height) - dropdownHeight - 6),
            },
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.optionsHeader}>
            <Text style={[styles.optionsTitle, { color: theme.text }]}>
              {mode === "filter" ? "Filter tasks" : "Sort tasks"}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text
                style={[styles.optionsClose, { color: theme.textSecondary }]}
              >
                ×
              </Text>
            </TouchableOpacity>
          </View>
          {values.map((value) => (
            <Option
              key={value}
              active={(mode === "filter" ? status : sort) === value}
              label={labels[value]}
              theme={theme}
              onPress={() =>
                mode === "filter"
                  ? onStatus(value as TodoStatus)
                  : onSort(value as TodoSort)
              }
            />
          ))}
        </View>
      </View>
    </Modal>
  );
}
function PagerButton({ direction, disabled, theme, onPress }: any) {
  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.pagerButton,
        { borderColor: theme.border, opacity: disabled ? 0.35 : 1 },
      ]}
    >
      <Text style={[styles.pagerText, { color: theme.text }]}>{direction}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, width: "100%", minHeight: 0 },
  content: {
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
    paddingHorizontal: 8,
    paddingBottom: 24,
  },
  mobileContent: { paddingHorizontal: 4, paddingBottom: 16 },
  heading: { marginBottom: 16 },
  headingTitle: {
    fontSize: 28,
    lineHeight: 33,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  headingSubtitle: { fontSize: 12, marginTop: 4 },
  desktopToolbar: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
    zIndex: 30,
  },
  search: {
    height: 42,
    flex: 1,
    minWidth: 200,
    borderWidth: 1,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
  },
  searchIcon: { fontSize: 18, marginRight: 10 },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 12,
    outlineStyle: "none",
  } as any,
  toolbarButton: {
    height: 42,
    minWidth: 132,
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  toolbarButtonWide: { minWidth: 210, flex: 1 },
  compactToolbarButton: {
    width: "100%",
    minWidth: 0,
    paddingHorizontal: 10,
    gap: 5,
  },
  toolbarIcon: { fontSize: 14 },
  toolbarLabel: { flex: 1, fontSize: 11.5, fontWeight: "650" as any },
  toolbarChevron: { fontSize: 13 },
  addTask: {
    height: 42,
    minWidth: 150,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  addTaskText: { color: "#fff", fontSize: 12, fontWeight: "750" as any },
  menuAnchor: { position: "relative", zIndex: 40 },
  sortAnchor: { flex: 1 },
  mobileMenuAnchor: { flex: 1, minWidth: 0 },
  stats: { flexDirection: "row", gap: 16, marginBottom: 17 },
  compactStats: { flexWrap: "wrap", gap: 10 },
  mobileStats: { flexWrap: "nowrap", gap: 8, marginTop: 16, marginBottom: 20 },
  statCard: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderRadius: 9,
    padding: 8,
    alignItems: "flex-start",
    gap: 10,
  },
  compactStatCard: {
    flexBasis: "46%",
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  mobileStatCard: { flexBasis: 0, paddingHorizontal: 6 },
  statIcon: { borderRadius: 9, padding: 8 },
  compactStatIcon: { padding: 3 },
  statLabel: { fontSize: 12 },
  mobileStatLabel: { fontSize: 11 },
  phoneStatLabel: { fontSize: 10 },
  statValue: { fontSize: 28, fontWeight: "700" },
  mobileStatValue: { fontSize: 22 },
  statDetail: { fontSize: 10.5 },
  mobileToolbar: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
    paddingHorizontal: 4,
    zIndex: 30,
  },
  optionPanel: {
    position: "absolute",
    top: 47,
    left: 0,
    right: 0,
    minWidth: 140,
    borderWidth: 1,
    borderRadius: 10,
    padding: 5,
    zIndex: 100,
    elevation: 12,
    ...shadow({ opacity: 0.12, radius: 12, x: 0, y: 5 }),
  },
  option: {
    minHeight: 38,
    borderRadius: 7,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tabs: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "flex-end",
    borderBottomWidth: 1,
  },
  tab: {
    minWidth: 90,
    paddingHorizontal: 12,
    paddingVertical: 13,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabText: { fontSize: 12, fontWeight: "700" },
  topPager: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingBottom: 7,
  },
  range: { fontSize: 11, fontWeight: "600", marginRight: 8 },
  pagerButton: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  pagerText: { fontSize: 22 },
  tableHeader: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderTopLeftRadius: 11,
    borderTopRightRadius: 11,
    marginTop: 10,
  },
  hCheck: { width: "5%", textAlign: "center" },
  hTask: { width: "35%" },
  hCategory: { width: "11%" },
  hDue: { width: "17%" },
  hPriority: { width: "11%" },
  hStatus: { width: "13%" },
  hAction: { width: "8%", fontSize: 10, textAlign: "center" },
  loading: { marginVertical: 60 },
  empty: {
    minHeight: 180,
    marginTop: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 15, fontWeight: "700" },
  emptyText: { fontSize: 12, marginTop: 5 },
  footerPager: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    minHeight: 44,
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 7 },
  headerAction: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  headerSearchIcon: { fontSize: 24 },
  headerAddAction: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAddText: {
    color: "#fff",
    fontSize: 22,
    lineHeight: 25,
    fontWeight: "500",
  },
  mobileSearch: {
    height: 42,
    marginHorizontal: 4,
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tabletToolbar: { flexDirection: "row", gap: 10, marginBottom: 14 },
  tabletAdd: {
    minWidth: 120,
    height: 42,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  optionsRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  compactOptionsRoot: { justifyContent: "flex-end", padding: 0 },
  optionsBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10,16,13,.28)",
  },
  optionsCard: {
    width: 260,
    borderWidth: 1,
    borderRadius: 14,
    padding: 7,
    elevation: 30,
    ...shadow({ opacity: 0.18, radius: 18, x: 0, y: 8 }),
  },
  compactOptionsCard: {
    width: "100%",
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 24,
  },
  optionsHeader: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  optionsTitle: { fontSize: 15, fontWeight: "800" },
  optionsClose: { fontSize: 24, paddingHorizontal: 6 },
});
