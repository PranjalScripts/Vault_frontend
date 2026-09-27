import { useFeedbackModal } from "@/contexts/FeedbackModalContext";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { ShareSubjectModal, ShareSelection } from "@/components/subjects/ShareSubjectModal";
import { shadow } from "@/styles/shadow";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Modal, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { AppLayout } from "@/components/AppLayout";
import {
  createSubject,
  deleteSubject,
  getSubjects,
  updateSubject,
} from "@/api/api";
import { useTheme } from "@/hooks/use-theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  Button,
  Empty,
  Field,
  FormModal,
  Search,
  Subject,
  SubjectStats,
  s,
} from "@/components/subjects/SubjectUI";
import { SubjectCard } from "@/components/subjects/SubjectCard";

const emptyStats: SubjectStats = {
  subjects: 0,
  topics: 0,
  links: 0,
  completed: 0,
  files: 0,
  withLinksPercent: 0,
};
const sorts = [
  { value: "recent", label: "Recently Added" },
  { value: "name", label: "Name A–Z" },
  { value: "updated", label: "Recently Updated" },
] as const;
export default function SubjectsScreen() {
  const t = useTheme();
  const { showSuccess } = useFeedbackModal();
  const dark = useColorScheme() === "dark";
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const mobile = width < 768;
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recent");
  const [sortOpen, setSortOpen] = useState(false);
  const sortButtonRef = useRef<View>(null);
  const [sortAnchor, setSortAnchor] = useState({ x: 0, y: 0, width: 240, height: 0 });
  const openSort = () => {
    if (Platform.OS === "web") {
      sortButtonRef.current?.measureInWindow((x, y, width, height) => {
        setSortAnchor({ x, y, width, height });
        setSortOpen(true);
      });
    } else setSortOpen(true);
  };
  useEffect(() => {
    if (Platform.OS !== "web" || !sortOpen) return;
    const dismiss = () => setSortOpen(false);
    window.addEventListener("resize", dismiss);
    return () => window.removeEventListener("resize", dismiss);
  }, [sortOpen]);
  const sortMenuWidth = Math.min(Math.max(sortAnchor.width, 220), width - 16);

  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<Subject | null>(null);
  const [sharing, setSharing] = useState<ShareSelection | null>(null);
  const [menu, setMenu] = useState<Subject | null>(null);
  const [deleting, setDeleting] = useState<Subject | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const request = useRef(0);
  const loadedQuery = useRef("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);
  const fetchSubjects = useCallback(async () => {
    const sequence = ++request.current;
    const queryKey = JSON.stringify({ page, query, sort });
    setLoading(loadedQuery.current !== queryKey);
    setError("");
    try {
      const response = await getSubjects({
        page,
        limit: 18,
        search: query,
        sort,
      });
      if (sequence !== request.current) return;
      if (page > 1 && page > response.data.pagination.totalPages) {
        setPage(Math.max(1, response.data.pagination.totalPages));
        return;
      }
      loadedQuery.current = queryKey;
      setSubjects(response.data.data);
      setStats(response.data.stats);
      setPages(response.data.pagination.totalPages);
      setTotal(response.data.pagination.total);
    } catch {
      if (sequence === request.current)
        setError("Your subjects could not be loaded. Please try again.");
    } finally {
      if (sequence === request.current) setLoading(false);
    }
  }, [page, query, sort]);
  useFocusEffect(
    useCallback(() => {
      void fetchSubjects();
      return () => {
        request.current++;
      };
    }, [fetchSubjects]),
  );
  const openForm = (subject?: Subject) => {
    setEditing(subject || null);
    setName(subject?.subjectName || "");
    setFormError("");
    setMenu(null);
    setShowForm(true);
  };
  const save = async () => {
    if (busy) return;
    if (!name.trim()) {
      setFormError("Enter a subject name to continue.");
      return;
    }
    setBusy(true);
    setFormError("");
    try {
      if (editing) await updateSubject(editing._id, name.trim());
      else await createSubject(name.trim());
      setShowForm(false);
      showSuccess({ title: editing ? "Subject Updated" : "Subject Created", message: "Your subject has been saved successfully." });
      await fetchSubjects();
    } catch {
      setFormError("Unable to save this subject. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!deleting || busy) return;
    setBusy(true);
    setFormError("");
    try {
      await deleteSubject(deleting._id);
      setDeleting(null);
      showSuccess({ title: "Subject Deleted", message: "The subject has been moved to Recently Deleted." });
      await fetchSubjects();
    } catch {
      setFormError("Unable to delete this subject. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  const statCards = [
    {
      icon: "book-open",
      value: stats.subjects,
      label: mobile ? "Subjects" : "Total Subjects",
      tint: "#F4FAF5",
      color: "#16813D",
    },
    {
      icon: "file-text",
      value: stats.topics,
      label: mobile ? "Topics" : "Total Topics",
      tint: "#F7F3FF",
      color: "#7033E8",
    },
    {
      icon: "link",
      value: stats.links,
      label: mobile ? "Links" : "Useful Links",
      tint: "#F1F8FF",
      color: "#087AE9",
    },
    {
      icon: "bar-chart-2",
      value: `${stats.withLinksPercent}%`,
      label: mobile ? "With links" : "Topics with links",
      tint: "#F2FAF4",
      color: "#16813D",
    },
  ] as const;
  const statsView = (
    <View style={{ flexDirection: "row", gap: mobile ? 8 : 16 }}>
      {statCards.map((stat) => (
        <View
          key={stat.label}
          style={{
            flex: 1,
            minWidth: 0,
            padding: mobile ? 10 : 18,
            paddingVertical: mobile ? 16 : 18,
            borderWidth: 1,
            borderColor: dark ? t.border : `${stat.color}18`,
            backgroundColor: dark ? t.backgroundElement : stat.tint,
            borderRadius: 9,
            alignItems: mobile ? "center" : "flex-start",
            gap: mobile ? 8 : 10,
          }}
        >
          <View
            style={{
              backgroundColor: dark ? t.backgroundSelected : `${stat.color}0D`,
              borderRadius: 9,
              padding: mobile ? 3 : 8,
            }}
          >
            <Feather
              name={stat.icon}
              size={mobile ? 22 : 24}
              color={dark ? t.accent : stat.color}
            />
          </View>
          <Text
            style={{
              color: t.text,
              fontSize: mobile ? 22 : 28,
              fontWeight: "700",
            }}
          >
            {loading || error ? "—" : stat.value}
          </Text>
          <Text
            numberOfLines={1}
            style={{ color: t.textSecondary, fontSize: mobile ? 10 : 12 }}
          >
            {stat.label}
          </Text>
        </View>
      ))}
    </View>
  );
  return (
    <AppLayout
      mobileTitle="Subjects"
      contentBackgroundColor={mobile || dark ? t.background : "#FFFFFF"}
      mobileHeaderActions={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add Subject"
          onPress={() => openForm()}
          style={{
            width: 44,
            height: 44,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Feather name="plus" size={27} color={t.accent} />
        </Pressable>
      }
    >
      <Stack.Screen options={{ headerShown: false }} />
      <View
        style={[s.page, { gap: mobile ? 14 : 18 }, mobile && { padding: 16 }]}
      >
        {!mobile && (
          <View>
            <Text
              style={{
                color: t.text,
                fontSize: 30,
                fontWeight: "800",
                letterSpacing: -0.8,
              }}
            >
              Subjects
            </Text>
            <Text style={[s.body, { color: t.textSecondary, marginTop: 4 }]}>
              Organize your learning resources by subjects and topics.
            </Text>
          </View>
        )}
        {mobile && statsView}
        <View
          style={{
            flexDirection: mobile ? "column" : "row",
            flexWrap: mobile ? "nowrap" : "wrap",
            gap: 12,
            alignItems: mobile ? "stretch" : "center",
          }}
        >
          <Search
            value={search}
            onChangeText={setSearch}
            placeholder="Search subjects or topics…"
          />
          <View
            style={{
              flexDirection: "row",
              flexWrap: "nowrap",
              gap: mobile ? 8 : 12,
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View ref={sortButtonRef} collapsable={false} style={mobile ? { flex: 1, minWidth: 0 } : undefined}>
              {mobile ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Sort subjects: ${sorts.find((item) => item.value === sort)?.label}`}
                  onPress={openSort}
                  style={({ pressed }) => ({ minHeight: 46, borderWidth: 1, borderColor: t.border, backgroundColor: t.backgroundElement, borderRadius: 9, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 6, opacity: pressed ? 0.75 : 1 })}
                >
                  <Feather name="sliders" size={16} color={t.textSecondary} />
                  <Text numberOfLines={1} style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: "600", color: t.text }}>
                    Sort: {sorts.find((item) => item.value === sort)?.label}
                  </Text>
                  <Feather name="chevron-down" size={16} color={t.textSecondary} />
                </Pressable>
              ) : (
                <Button
                  secondary
                  label={`↕  Sort: ${sorts.find((item) => item.value === sort)?.label}  ⌄`}
                  onPress={openSort}
                />
              )}
            </View>
            <View
              style={{
                flexDirection: "row",
                borderWidth: 1,
                borderColor: t.border,
                borderRadius: 9,
                padding: 2,
                flexShrink: 0,
              }}
            >
              {(["grid", "list"] as const).map((value) => (
                <Pressable
                  key={value}
                  accessibilityRole="button"
                  accessibilityLabel={`${value === "grid" ? "Grid" : "List"} view`}
                  accessibilityState={{ selected: layout === value }}
                  onPress={() => setLayout(value)}
                  style={{
                    width: 40,
                    height: 40,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 7,
                    backgroundColor:
                      layout === value ? t.backgroundSelected : "transparent",
                  }}
                >
                  <Feather
                    name={value === "grid" ? "grid" : "list"}
                    size={17}
                    color={layout === value ? t.accent : t.textSecondary}
                  />
                </Pressable>
              ))}
            </View>
          </View>
          {!mobile && (
            <Button label="+  Add Subject" onPress={() => openForm()} />
          )}
        </View>
        {!mobile && statsView}
        {loading ? (
          mobile ? (
            <View accessibilityLabel="Loading subjects" style={{ paddingVertical: 48, alignItems: "center" }}>
              <ActivityIndicator color={t.accent} />
            </View>
          ) : (
            <Empty loading title="Loading your library" description="Gathering your subjects and resources…" />
          )
        ) : error ? (
          <Empty
            title="Couldn’t load subjects"
            description={error}
            action="Try again"
            onPress={fetchSubjects}
          />
        ) : !subjects.length ? (
          <Empty
            title={query ? "No matching subjects" : "Create your first subject"}
            description={
              query
                ? "Try a different subject or topic name."
                : "Collect your topics, useful links, and files in one place."
            }
            action={query ? "Clear search" : "+ Add Subject"}
            onPress={query ? () => setSearch("") : () => openForm()}
          />
        ) : (
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: mobile ? 9 : 16,
            }}
          >
            {subjects.map((subject) => (
              <View
                key={subject._id}
                style={{
                  width:
                    mobile || layout === "list"
                      ? "100%"
                      : width >= 1150
                        ? "31.9%"
                        : width >= 850
                          ? "48.5%"
                          : "100%",
                }}
              >
                <SubjectCard
                  subject={subject}
                  compact={mobile ? layout === "grid" : layout === "list"}
                  onOpen={() =>
                    router.push({
                      pathname: "/subjects/[id]",
                      params: { id: subject._id },
                    })
                  }
                  onMenu={() => setMenu(subject)}
                />
              </View>
            ))}
          </View>
        )}
        {!loading && !error && total > 0 && (
          <View style={s.row}>
            <Text style={{ color: t.textSecondary, fontSize: 12 }}>
              {total} {total === 1 ? "subject" : "subjects"}
              {query ? " found" : ""}
              {pages > 1 ? ` · Page ${page} of ${pages}` : ""}
            </Text>
            {pages > 1 && (
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Button
                  secondary
                  label="Previous"
                  disabled={page <= 1}
                  onPress={() => setPage((value) => value - 1)}
                />
                <Button
                  secondary
                  label="Next"
                  disabled={page >= pages}
                  onPress={() => setPage((value) => value + 1)}
                />
              </View>
            )}
          </View>
        )}
      </View>
      {Platform.OS === "web" ? (
        <Modal visible={sortOpen} transparent animationType="fade" onRequestClose={() => setSortOpen(false)}>
          <View style={{ flex: 1 }}>
            <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setSortOpen(false)} accessibilityLabel="Close sort menu" />
            <View style={{
              position: "absolute",
              width: sortMenuWidth,
              left: Math.max(8, Math.min(sortAnchor.x, width - sortMenuWidth - 8)),
              top: sortAnchor.y + sortAnchor.height + 176 <= height - 8
                ? sortAnchor.y + sortAnchor.height + 6
                : Math.max(8, sortAnchor.y - 176),
              padding: 7,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: t.border,
              backgroundColor: t.backgroundElement,
              ...shadow({ opacity: 0.18, radius: 18, x: 0, y: 8 }),
            }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 10, minHeight: 42 }}>
                <Text style={{ color: t.text, fontSize: 15, fontWeight: "800" }}>Sort subjects</Text>
                <Pressable accessibilityRole="button" accessibilityLabel="Close sort menu" onPress={() => setSortOpen(false)}>
                  <Text style={{ color: t.textSecondary, fontSize: 24, paddingHorizontal: 6 }}>×</Text>
                </Pressable>
              </View>
              {sorts.map((item) => (
                <Pressable
                  key={item.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: sort === item.value }}
                  onPress={() => { setSort(item.value); setPage(1); setSortOpen(false); }}
                  style={({ pressed }) => ({ minHeight: 38, paddingHorizontal: 10, borderRadius: 7, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: sort === item.value ? t.accentMuted : pressed ? t.backgroundSelected : "transparent" })}
                >
                  <Text style={{ color: sort === item.value ? t.accent : t.text, fontSize: 12, fontWeight: sort === item.value ? "700" : "500" }}>{item.label}</Text>
                  {sort === item.value && <Text style={{ color: t.accent }}>✓</Text>}
                </Pressable>
              ))}
            </View>
          </View>
        </Modal>
      ) : (
      <FormModal
        visible={sortOpen}
        title="Sort subjects"
        subtitle="Choose how your library is ordered."
        onClose={() => setSortOpen(false)}
      >
        {sorts.map((item) => (
          <Button
            key={item.value}
            secondary={sort !== item.value}
            label={item.label}
            onPress={() => {
              setSort(item.value);
              setPage(1);
              setSortOpen(false);
            }}
          />
        ))}
      </FormModal>
      )}
      <ShareSubjectModal selection={sharing} onClose={() => setSharing(null)} />
      <FormModal
        visible={!!menu}
        title={menu?.subjectName || "Subject"}
        subtitle="Manage this learning collection."
        onClose={() => setMenu(null)}
      >
        <Button secondary label="Share entire subject" onPress={() => {
          if (menu) { setSharing({ subject: menu }); setMenu(null); }
        }} />
        <Button
          secondary
          label="Rename subject"
          onPress={() => {
            if (menu) openForm(menu);
          }}
        />
        <Button
          secondary
          danger
          label="Delete subject"
          onPress={() => {
            setDeleting(menu);
            setMenu(null);
            setFormError("");
          }}
        />
      </FormModal>
      <FormModal
        visible={showForm}
        title={editing ? "Rename subject" : "Add Subject"}
        subtitle="Give your learning collection a name."
        onClose={() => {
          if (!busy) setShowForm(false);
        }}
      >
        <Field
          label="Subject name"
          placeholder="e.g. Java"
          value={name}
          onChangeText={setName}
        />
        {formError ? (
          <Text
            accessibilityRole="alert"
            style={[s.error, { color: t.danger }]}
          >
            {formError}
          </Text>
        ) : null}
        <Button
          label={busy ? "Saving…" : editing ? "Save changes" : "Add Subject"}
          disabled={busy}
          onPress={save}
        />
      </FormModal>
      <ConfirmModal visible={!!deleting} title="Delete subject?"
        message={`“${deleting?.subjectName || ""}” and its topics and file references will move to Recently Deleted and can be restored during the restore period.`}
        busy={busy} error={formError} onClose={() => { if (!busy) setDeleting(null); }} onConfirm={remove} />
    </AppLayout>
  );
}
