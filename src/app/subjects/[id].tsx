import { ShareSubjectModal, ShareSelection } from "@/components/subjects/ShareSubjectModal";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Linking,
  Platform,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { BrandLogo } from "@/components/BrandLogo";
import { paletteFor } from "@/components/subjects/SubjectCard";
import {
  IconButton,
  TopicRow,
  TopicStatus,
  topicStatus,
  statusLabels,
} from "@/components/subjects/TopicRow";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Feather from "@expo/vector-icons/Feather";
import { TopicEditor } from "@/components/subjects/TopicEditor";
import { AppLayout } from "@/components/AppLayout";
import {
  deleteTopic,
  getSubject,
  updateTopic,
  updateSubject,
  deleteSubject,
} from "@/api/api";
import { useTheme } from "@/hooks/use-theme";
import {
  Button,
  Empty,
  Field,
  FormModal,
  Search,
  Subject,
  SubjectFile,
  Topic,
  s,
} from "@/components/subjects/SubjectUI";

export default function SubjectDetailScreen() {
  const { id, section } = useLocalSearchParams<{ id: string; section?: string }>();
  const [showNotes, setShowNotes] = useState(section === "notes");
  useEffect(() => { setShowNotes(section === "notes"); }, [section, id]);
  const router = useRouter();
  const t = useTheme();
  const { width } = useWindowDimensions();
  const mobile = width < 768;
  const compact = width < 1180;
  const dark = useColorScheme() === "dark";
  const [tab, setTab] = useState<"topics" | "resources">("topics");
  const [sort, setSort] = useState<"order" | "name" | "recent">("order");
  const [grid, setGrid] = useState(false);
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sharing, setSharing] = useState<ShareSelection | null>(null);
  const [topicMenu, setTopicMenu] = useState<Topic | null>(null);
  const [resourceTopic, setResourceTopic] = useState<Topic | null>(null);
  const [subjectMenu, setSubjectMenu] = useState(false);
  const [subjectForm, setSubjectForm] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [subjectDescription, setSubjectDescription] = useState("");
  const [deleteSubjectConfirm, setDeleteSubjectConfirm] = useState(false);
  const request = useRef(0);
  const loadedId = useRef(id);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Topic | null>(null);
  const [deleting, setDeleting] = useState<Topic | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "completed" | "in_progress"
  >("all");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const fetchSubject = useCallback(async () => {
    if (loadedId.current !== id) {
      loadedId.current = id;
      setPage(1);
    }
    const sequence = ++request.current;
    setLoading(true);
    setError("");
    try {
      const response = await getSubject(id);
      if (sequence !== request.current) return;
      setSubject(response.data.data);
    } catch {
      if (sequence === request.current)
        setError("This subject could not be loaded. Please try again.");
    } finally {
      if (sequence === request.current) setLoading(false);
    }
  }, [id]);
  useFocusEffect(
    useCallback(() => {
      void fetchSubject();
      return () => {
        request.current++;
      };
    }, [fetchSubject]),
  );
  const topics = [...(subject?.topics || [])].sort((a, b) =>
    sort === "name"
      ? a.topic.localeCompare(b.topic)
      : sort === "recent"
        ? (Date.parse(b.createdAt || "") || 0) -
          (Date.parse(a.createdAt || "") || 0)
        : a.srNo - b.srNo,
  );
  const filtered = topics.filter(
    (item) =>
      (statusFilter === "all" ||
        (statusFilter === "pending"
          ? topicStatus(item) !== "completed"
          : topicStatus(item) === statusFilter)) &&
      `${item.topic} ${item.description || ""} ${item.srNo} ${item.url || ""} ${(item.files || []).map((file) => file.fileName).join(" ")}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / 8));
  const currentPage = Math.min(page, pageCount);
  const visibleTopics = filtered.slice((currentPage - 1) * 8, currentPage * 8);
  const completedCount = topics.filter(
    (item) => topicStatus(item) === "completed",
  ).length;
  const percentage = topics.length
    ? Math.round((completedCount / topics.length) * 100)
    : 0;
  const linkCount = topics.filter((item) => item.url?.trim()).length;
  const fileCount = topics.reduce(
    (sum, item) => sum + (item.files?.length || 0),
    0,
  );
  const palette = paletteFor(subject?.subjectName || "");
  const openForm = (topic?: Topic) => {
    setTopicMenu(null);
    if (Platform.OS !== "web" || mobile) {
      router.push({
        pathname: "/subjects/[id]/topic",
        params: { id, ...(topic?._id ? { topicId: topic._id } : {}) },
      });
      return;
    }
    setEditing(topic || null);
    setShowForm(true);
  };
  const normalizeUrl = (value: string) => {
    const clean = value.trim();
    const parsed = new URL(
      /^[a-z][a-z\d+.-]*:/i.test(clean) ? clean : `https://${clean}`,
    );
    if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname)
      throw new Error("Invalid URL");
    return parsed.href;
  };
  const remove = async () => {
    if (!deleting?._id || busy) return;
    setBusy(true);
    setFormError("");
    try {
      const response = await deleteTopic(id, deleting._id);
      setSubject(response.data.data);
      setDeleting(null);
    } catch {
      setFormError("Unable to delete this topic. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  const changeStatus = async (topic: Topic, next: TopicStatus) => {
    if (!topic._id || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await updateTopic(id, topic._id, { status: next });
      setSubject(response.data.data);
      setTopicMenu(null);
    } catch {
      setError("Unable to update status. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  const openSubjectForm = () => {
    setSubjectName(subject?.subjectName || "");
    setSubjectDescription(subject?.description || "");
    setFormError("");
    setSubjectMenu(false);
    setSubjectForm(true);
  };
  const saveSubject = async () => {
    if (busy) return;
    if (!subjectName.trim()) {
      setFormError("Enter a subject name.");
      return;
    }
    setBusy(true);
    setFormError("");
    try {
      const response = await updateSubject(id, {
        subjectName: subjectName.trim(),
        description: subjectDescription.trim(),
      });
      setSubject(response.data.data);
      setSubjectForm(false);
    } catch {
      setFormError("Unable to save subject. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  const removeSubject = async () => {
    if (busy) return;
    setBusy(true);
    setFormError("");
    try {
      await deleteSubject(id);
      router.replace("/subjects");
    } catch {
      setFormError("Unable to delete subject. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  const openFile = async (file: SubjectFile) => {
    try {
      const target = normalizeUrl(file.fileUrl);
      if (Platform.OS === "web")
        window.open(target, "_blank", "noopener,noreferrer");
      else await Linking.openURL(target);
    } catch {
      setError(
        "Unable to open this attachment. Check its URL in the topic editor.",
      );
    }
  };
  const openResource = (topic: Topic) => {
    try {
      const target = normalizeUrl(topic.url || "");
      if (Platform.OS === "web")
        window.open(target, "_blank", "noopener,noreferrer");
      else
        router.push({
          pathname: "/browser",
          params: { url: target, title: topic.topic },
        });
    } catch {
      setError(
        "This resource has an invalid URL. Edit the topic to update its link.",
      );
    }
  };
  const renderResources = (items: Topic[]) => (
    <View style={{ gap: 10 }}>
      {items.map((topic) => (
        <View key={topic._id || topic.srNo} style={{ gap: 9 }}>
          {topic.url && (
            <Pressable
              accessibilityRole="link"
              onPress={() => openResource(topic)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: t.border,
                borderRadius: 10,
                backgroundColor: t.backgroundElement,
              }}
            >
              <Feather name="link" size={20} color={t.link} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  style={{ color: t.text, fontSize: 14, fontWeight: "600" }}
                >
                  {topic.topic || `Topic ${topic.srNo}`}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{ color: t.textSecondary, fontSize: 12, marginTop: 5 }}
                >
                  {topic.url}
                </Text>
              </View>
              <Feather name="external-link" size={17} color={t.textSecondary} />
            </Pressable>
          )}
          {(topic.files || []).map((file, index) => (
            <Pressable
              key={file._id || index}
              accessibilityRole="link"
              accessibilityLabel={`Open ${file.fileName}`}
              onPress={() => openFile(file)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: t.border,
                borderRadius: 10,
                backgroundColor: t.backgroundElement,
              }}
            >
              <Feather name="file-text" size={20} color={t.danger} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  numberOfLines={1}
                  style={{ color: t.text, fontSize: 14, fontWeight: "600" }}
                >
                  {file.fileName}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{ color: t.textSecondary, fontSize: 12, marginTop: 5 }}
                >
                  {topic.topic || `Topic ${topic.srNo}`} ·{" "}
                  {file.fileType.toUpperCase()}
                  {file.fileSize
                    ? ` · ${Math.ceil(file.fileSize / 1024)} KB`
                    : ""}
                </Text>
              </View>
              <Feather name="external-link" size={17} color={t.textSecondary} />
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
  const filters = (
    <View
      style={{
        flexDirection: "row",
        padding: 4,
        gap: 4,
        backgroundColor: t.backgroundSelected,
        borderRadius: 10,
      }}
    >
      {(["all", "pending", "completed"] as const).map((value) => (
        <Pressable
          key={value}
          accessibilityRole="button"
          accessibilityState={{ selected: statusFilter === value }}
          onPress={() => {
            setStatusFilter(value);
            setPage(1);
          }}
          style={{
            flex: 1,
            minHeight: 40,
            justifyContent: "center",
            alignItems: "center",
            borderRadius: 7,
            backgroundColor:
              statusFilter === value ? t.backgroundElement : "transparent",
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: statusFilter === value ? t.accent : t.textSecondary,
            }}
          >
            {value === "all"
              ? "All Topics"
              : value === "pending"
                ? "To learn"
                : "Completed"}
          </Text>
        </Pressable>
      ))}
    </View>
  );
  return (
    <AppLayout
      mobileTitle={subject?.subjectName || "Subject"}
      mobileBackAction={() => router.push("/subjects")}
      mobileHeaderActions={
        <IconButton
          icon="more-vertical"
          label="Subject actions"
          plain
          onPress={() => setSubjectMenu(true)}
          disabled={!subject}
        />
      }
      contentBackgroundColor={dark ? t.background : "#FFFFFF"}
      desktopBreadcrumb={
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push("/subjects")}
          >
            <Text style={{ color: t.textSecondary }}>Subjects</Text>
          </Pressable>
          <Feather name="chevron-right" size={16} color={t.textSecondary} />
          <Text
            numberOfLines={1}
            style={{ color: t.text, fontWeight: "700", flexShrink: 1 }}
          >
            {subject?.subjectName || "Subject"}
          </Text>
        </View>
      }
    >
      <Stack.Screen options={{ headerShown: false }} />
      <View
        style={[
          s.page,
          { gap: mobile ? 12 : 18 },
          mobile && {
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 24,
          },
        ]}
      >
        {loading ? (
          <Empty
            loading
            title="Loading your topics"
            description="Opening your learning collection…"
          />
        ) : !subject ? (
          <Empty
            title="Subject unavailable"
            description={error || "This subject may have been removed."}
            action="Try again"
            onPress={fetchSubject}
          />
        ) : (
          <>
            {!!subject.notes && <Button secondary label="View subject notes" onPress={() => setShowNotes(true)} />}
            <View
              style={{
                backgroundColor: dark ? t.backgroundSelected : palette.tint,
                borderRadius: 12,
                padding: mobile ? 16 : 20,
                flexDirection: "row",
                alignItems: "center",
                gap: mobile ? 14 : 24,
              }}
            >
              <BrandLogo name={subject.subjectName} size={mobile ? 58 : 82} />
              <View style={{ flex: 1, minWidth: 0, gap: mobile ? 8 : 12 }}>
                <View style={s.row}>
                  <Text
                    style={{
                      color: t.text,
                      fontSize: mobile ? 23 : 30,
                      fontWeight: "700",
                      flexShrink: 1,
                    }}
                  >
                    {subject.subjectName}
                  </Text>
                  {!mobile && (
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <Button
                        secondary
                        label="✎  Edit Subject"
                        onPress={openSubjectForm}
                      />
                      <IconButton
                        icon="more-vertical"
                        label="Subject actions"
                        onPress={() => setSubjectMenu(true)}
                      />
                    </View>
                  )}
                </View>
                {!mobile && (
                  <Text
                    numberOfLines={mobile ? 2 : undefined}
                    style={{
                      color: t.textSecondary,
                      fontSize: mobile ? 12 : 14,
                      lineHeight: 20,
                    }}
                  >
                    {subject.description ||
                      "Your topics and learning resources in one place."}
                  </Text>
                )}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: mobile ? 9 : 22,
                  }}
                >
                  {(
                    [
                      {
                        icon: "book-open",
                        text: `${topics.length} ${topics.length === 1 ? "topic" : "topics"}`,
                      },
                      {
                        icon: "link",
                        text: `${linkCount} ${linkCount === 1 ? "link" : "links"}`,
                      },
                      {
                        icon: "file-text",
                        text: `${fileCount} ${fileCount === 1 ? "file" : "files"}`,
                      },
                    ] as const
                  ).map((item) => (
                    <View
                      key={item.icon}
                      style={{
                        flexDirection: "row",
                        gap: 6,
                        alignItems: "center",
                      }}
                    >
                      {!mobile && (
                        <Feather
                          name={item.icon}
                          size={17}
                          color={t.textSecondary}
                        />
                      )}
                      <Text
                        style={{
                          color: t.textSecondary,
                          fontSize: mobile ? 11 : 13,
                        }}
                      >
                        {item.text}
                      </Text>
                    </View>
                  ))}
                  {!mobile && (
                    <Text
                      style={{
                        color: t.accent,
                        fontWeight: "600",
                        fontSize: 13,
                      }}
                    >
                      ◉ {percentage}% completed
                    </Text>
                  )}
                </View>
                {mobile && (
                  <View
                    accessibilityRole="progressbar"
                    accessibilityLabel="Topic completion"
                    accessibilityValue={{ min: 0, max: 100, now: percentage }}
                    style={{ gap: 7, maxWidth: mobile ? undefined : 300 }}
                  >
                    {mobile && (
                      <Text
                        style={{
                          color: t.text,
                          fontSize: 12,
                          fontWeight: "600",
                        }}
                      >
                        ◉ {percentage}% completed
                      </Text>
                    )}
                    <View
                      style={{
                        height: 4,
                        backgroundColor: dark ? t.border : "#DDDFE1",
                        borderRadius: 4,
                      }}
                    >
                      <View
                        style={{
                          width: `${percentage}%`,
                          height: 4,
                          backgroundColor: t.accent,
                          borderRadius: 4,
                        }}
                      />
                    </View>
                  </View>
                )}
              </View>
            </View>
            {error ? (
              <Text accessibilityRole="alert" style={{ color: t.danger }}>
                {error}
              </Text>
            ) : null}
            <View
              style={{
                flexDirection: "row",
                borderBottomWidth: 1,
                borderColor: t.border,
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View
                accessibilityRole="tablist"
                style={{ flexDirection: "row", flex: mobile ? 1 : undefined }}
              >
                {(["topics", "resources"] as const).map((value) => (
                  <Pressable
                    key={value}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: tab === value }}
                    onPress={() => {
                      setTab(value);
                      setSearch("");
                      setPage(1);
                    }}
                    style={{
                      flex: mobile ? 1 : undefined,
                      minHeight: 50,
                      justifyContent: "center",
                      alignItems: "center",
                      paddingHorizontal: mobile ? 10 : 28,
                      borderBottomWidth: 2,
                      borderBottomColor:
                        tab === value ? t.accent : "transparent",
                    }}
                  >
                    <Text
                      style={{
                        color: tab === value ? t.accent : t.textSecondary,
                        fontSize: 14,
                        fontWeight: tab === value ? "700" : "500",
                      }}
                    >
                      {value.charAt(0).toUpperCase() + value.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {!mobile && (
                <Button label="+  Add Topic" onPress={() => openForm()} />
              )}
            </View>
            <>
              {mobile && (
                <Button label="+  Add Topic" onPress={() => openForm()} />
              )}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <Search
                  value={search}
                  onChangeText={(value) => {
                    setSearch(value);
                    setPage(1);
                  }}
                  placeholder={
                    tab === "topics" ? "Search topics…" : "Search resources…"
                  }
                />
                {mobile ? (
                  <IconButton
                    icon="sliders"
                    label="Filter and sort topics"
                    onPress={() => setFilterOpen(true)}
                  />
                ) : (
                  <>
                    <Button
                      secondary
                      label={`${statusFilter === "all" ? "All Topics" : statusFilter === "pending" ? "To learn" : statusFilter === "completed" ? "Completed" : "In Progress"}  ⌄`}
                      onPress={() => setFilterOpen(true)}
                    />
                    <Button
                      secondary
                      label={`⇅  Sort: ${sort === "order" ? "Sr. No." : sort === "name" ? "Name" : "Recently Added"}  ⌄`}
                      onPress={() => setFilterOpen(true)}
                    />
                    {tab === "topics" && (
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        <IconButton
                          icon="list"
                          label="List view"
                          onPress={() => setGrid(false)}
                          selected={!grid}
                        />
                        <IconButton
                          icon="grid"
                          label="Grid view"
                          onPress={() => setGrid(true)}
                          selected={grid}
                        />
                      </View>
                    )}
                  </>
                )}
              </View>
              {mobile && filters}
              {tab === "resources" ? (
                filtered.some((item) => item.url || item.files?.length) ? (
                  renderResources(
                    filtered.filter((item) => item.url || item.files?.length),
                  )
                ) : (
                  <Empty
                    title="No resources here yet"
                    description="Add a link or attach a file to a topic, and it will appear here."
                    action="Add Topic"
                    onPress={() => openForm()}
                  />
                )
              ) : !filtered.length ? (
                <Empty
                  title={
                    topics.length
                      ? "No matching topics"
                      : "Add your first topic"
                  }
                  description={
                    topics.length
                      ? "Try a different search or filter."
                      : "Start with a topic, then add descriptions, links, and files."
                  }
                  action={topics.length ? "Reset filters" : "Add Topic"}
                  onPress={
                    topics.length
                      ? () => {
                          setSearch("");
                          setStatusFilter("all");
                        }
                      : () => openForm()
                  }
                />
              ) : (
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: mobile ? 10 : grid ? 12 : 0,
                  }}
                >
                  {visibleTopics.map((item) => (
                    <View
                      key={item._id || item.srNo}
                      style={{
                        width:
                          grid && !mobile && width >= 1000 ? "49%" : "100%",
                      }}
                    >
                      <TopicRow
                        topic={item}
                        compact={compact}
                        grid={grid}
                        busy={busy}
                        onEdit={() => openForm(item)}
                        onMenu={() => setTopicMenu(item)}
                        onStatus={() => setTopicMenu(item)}
                        onResources={() => setResourceTopic(item)}
                      />
                    </View>
                  ))}
                </View>
              )}
              {tab === "topics" && !!filtered.length && (
                <View style={[s.row, { paddingTop: 8 }]}>
                  <Text style={{ color: t.textSecondary, fontSize: 13 }}>
                    Showing {(currentPage - 1) * 8 + 1}–
                    {Math.min(currentPage * 8, filtered.length)} of{" "}
                    {filtered.length} topics
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <IconButton
                      icon="chevron-left"
                      label="Previous page"
                      disabled={currentPage === 1}
                      onPress={() => setPage(currentPage - 1)}
                    />
                    <View
                      style={{
                        minWidth: 40,
                        height: 40,
                        borderRadius: 8,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: t.accent,
                      }}
                    >
                      <Text style={{ color: t.background, fontWeight: "600" }}>
                        {currentPage}
                      </Text>
                    </View>
                    <IconButton
                      icon="chevron-right"
                      label="Next page"
                      disabled={currentPage === pageCount}
                      onPress={() => setPage(currentPage + 1)}
                    />
                  </View>
                </View>
              )}
            </>
          </>
        )}
      </View>
      <FormModal visible={showNotes && !!subject} title={`${subject?.subjectName || "Subject"} notes`} subtitle="Your saved subject notes." onClose={() => { setShowNotes(false); router.setParams({ section: "" }); }}>
        <Text selectable style={{ color: t.text, lineHeight: 24 }}>{subject?.notes || "No notes saved for this subject."}</Text>
      </FormModal>
      <FormModal
        visible={showForm}
        title={editing ? "Edit topic" : "Add Topic"}
        subtitle="Organize what you’re learning and the resources that help."
        onClose={() => {
          if (!busy) setShowForm(false);
        }}
      >
        {showForm && subject && (
          <TopicEditor
            subject={subject}
            editing={editing}
            onBusyChange={setBusy}
            onSaved={(updated) => {
              setSubject(updated);
              setShowForm(false);
            }}
          />
        )}
      </FormModal>
      <ShareSubjectModal selection={sharing} onClose={() => setSharing(null)} />
      <FormModal
        visible={!!topicMenu}
        title={topicMenu?.topic || "Topic actions"}
        subtitle="Update your progress or manage this topic."
        onClose={() => setTopicMenu(null)}
      >
        {(["not_started", "in_progress", "completed"] as const).map((value) => (
          <Button
            key={value}
            label={statusLabels[value]}
            disabled={busy}
            secondary={!topicMenu || topicStatus(topicMenu) !== value}
            onPress={() => {
              if (topicMenu) void changeStatus(topicMenu, value);
            }}
          />
        ))}
        <Button secondary label="Share topic" disabled={busy} onPress={() => {
          if (subject && topicMenu) { setSharing({ subject, topic: topicMenu }); setTopicMenu(null); }
        }} />
        <Button
          secondary
          label="Edit topic"
          disabled={busy}
          onPress={() => {
            if (topicMenu) openForm(topicMenu);
          }}
        />
        <Button
          secondary
          danger
          label="Delete topic"
          disabled={busy}
          onPress={() => {
            setDeleting(topicMenu);
            setTopicMenu(null);
            setFormError("");
          }}
        />
      </FormModal>
      <FormModal
        visible={!!resourceTopic}
        title={resourceTopic?.topic || "Topic resources"}
        subtitle="Links and files attached to this topic."
        onClose={() => setResourceTopic(null)}
      >
        {resourceTopic && renderResources([resourceTopic])}
      </FormModal>
      <FormModal
        visible={filterOpen}
        title="Filter & sort"
        subtitle="Choose the topics you want to see."
        onClose={() => setFilterOpen(false)}
      >
        {filters}
        <Button
          secondary={statusFilter !== "in_progress"}
          label="In Progress"
          onPress={() => {
            setStatusFilter("in_progress");
            setPage(1);
          }}
        />
        <Text style={{ color: t.text, fontWeight: "700" }}>Sort by</Text>
        {(["order", "name", "recent"] as const).map((value) => (
          <Button
            key={value}
            secondary={sort !== value}
            label={
              value === "order"
                ? "Serial number"
                : value === "name"
                  ? "Name A–Z"
                  : "Recently Added"
            }
            onPress={() => {
              setSort(value);
              setPage(1);
            }}
          />
        ))}
        <Button label="Done" onPress={() => setFilterOpen(false)} />
      </FormModal>
      <FormModal
        visible={subjectMenu}
        title="Subject actions"
        subtitle={subject?.subjectName || ""}
        onClose={() => setSubjectMenu(false)}
      >
        <Button secondary label="Share entire subject" onPress={() => {
          if (subject) { setSharing({ subject }); setSubjectMenu(false); }
        }} />
        <Button secondary label="Edit Subject" onPress={openSubjectForm} />
        <Button
          secondary
          danger
          label="Delete subject"
          onPress={() => {
            setSubjectMenu(false);
            setFormError("");
            setDeleteSubjectConfirm(true);
          }}
        />
      </FormModal>
      <FormModal
        visible={subjectForm}
        title="Edit Subject"
        subtitle="Give your collection a name and a short description."
        onClose={() => {
          if (!busy) setSubjectForm(false);
        }}
      >
        <Field
          label="Subject name"
          value={subjectName}
          onChangeText={setSubjectName}
          placeholder="Java"
        />
        <Field
          label="Subject description"
          value={subjectDescription}
          onChangeText={setSubjectDescription}
          placeholder="Learn core Java concepts, OOP, collections and more."
        />
        {formError ? (
          <Text accessibilityRole="alert" style={{ color: t.danger }}>
            {formError}
          </Text>
        ) : null}
        <Button
          label={busy ? "Saving…" : "Save subject"}
          disabled={busy}
          onPress={saveSubject}
        />
      </FormModal>
      <FormModal
        visible={!!deleting || deleteSubjectConfirm}
        title={deleting ? "Delete topic?" : "Delete subject?"}
        subtitle={
          deleting
            ? `“${deleting.topic || `Topic ${deleting.srNo}`}” and its resource references will move to Recently Deleted and can be restored during the restore period.`
            : "This subject and all its topics and file references will move to Recently Deleted and can be restored during the restore period."
        }
        onClose={() => {
          if (!busy) {
            setDeleting(null);
            setDeleteSubjectConfirm(false);
          }
        }}
      >
        {formError ? (
          <Text accessibilityRole="alert" style={{ color: t.danger }}>
            {formError}
          </Text>
        ) : null}
        <Button
          danger
          label={
            busy ? "Deleting…" : deleting ? "Delete topic" : "Delete subject"
          }
          disabled={busy}
          onPress={deleting ? remove : removeSubject}
        />
        <Button
          secondary
          label="Cancel"
          disabled={busy}
          onPress={() => {
            setDeleting(null);
            setDeleteSubjectConfirm(false);
          }}
        />
      </FormModal>
    </AppLayout>
  );
}
