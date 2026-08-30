import React, {
  useCallback,
  useMemo,
  useState,
  useEffect,
  useRef,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import { addTopic, deleteTopic, getSubject, updateTopic } from "@/api/api";
import { useTheme } from "@/hooks/use-theme";

type Topic = {
  _id?: string;
  srNo: number | string;
  topic: string;
  url?: string;
};

type Subject = {
  _id: string;
  subjectName: string;
  topics: Topic[];
};

export default function SubjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();

  // Animations
  const modalSlideAnim = useRef(new Animated.Value(0)).current;
  const cardAnimationsRef = useRef<{ [key: string]: Animated.Value }>({});
  const toastAnimRef = useRef(new Animated.Value(-100)).current;

  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);

  const [srNo, setSrNo] = useState("");
  const [topicName, setTopicName] = useState("");
  const [url, setUrl] = useState("");

  const [saving, setSaving] = useState(false);

  // Toast state
  type ToastType = "success" | "error" | "info";
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: ToastType;
  }>({
    visible: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ visible: true, message, type });

    Animated.sequence([
      Animated.timing(toastAnimRef, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2500),
      Animated.timing(toastAnimRef, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast({ visible: false, message: "", type: "success" });
    });
  };

  const fetchSubject = async () => {
    try {
      setLoading(true);

      const response = await getSubject(id);

      setSubject(response.data.data);
    } catch (error) {
      console.log("GET SUBJECT ERROR:", error);

      Alert.alert("Error", "Unable to load this subject.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSubject();
    }, [id]),
  );

  // Animate modal open/close
  useEffect(() => {
    if (modalVisible) {
      Animated.timing(modalSlideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(modalSlideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [modalVisible]);

  // Animate topic cards on subject change
  useEffect(() => {
    if (subject?.topics) {
      subject.topics.forEach((topic) => {
        const topicId = topic._id || `${topic.srNo}`;
        if (!cardAnimationsRef.current[topicId]) {
          cardAnimationsRef.current[topicId] = new Animated.Value(0);
          Animated.timing(cardAnimationsRef.current[topicId], {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }).start();
        }
      });
    }
  }, [subject?.topics]);

  const getCardAnimatedStyle = (item: Topic) => {
    const topicId = item._id || `${item.srNo}`;
    const animValue = cardAnimationsRef.current[topicId];

    if (!animValue) return {};

    return {
      opacity: animValue,
      transform: [
        {
          scale: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.9, 1],
          }),
        },
      ],
    };
  };

  const filteredTopics = useMemo(() => {
    if (!subject) return [];

    const searchText = search.trim().toLowerCase();

    if (!searchText) {
      return subject.topics || [];
    }

    return (subject.topics || []).filter((item) => {
      return (
        item.topic.toLowerCase().includes(searchText) ||
        String(item.srNo).toLowerCase().includes(searchText) ||
        (item.url || "").toLowerCase().includes(searchText)
      );
    });
  }, [subject, search]);

  const openAddModal = () => {
    setEditingTopic(null);

    setSrNo(String((subject?.topics?.length || 0) + 1));

    setTopicName("");
    setUrl("");

    setModalVisible(true);
  };

  const openEditModal = (topic: Topic) => {
    setEditingTopic(topic);

    setSrNo(String(topic.srNo));
    setTopicName(topic.topic);
    setUrl(topic.url || "");

    setModalVisible(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalVisible(false);
    setEditingTopic(null);
    setSrNo("");
    setTopicName("");
    setUrl("");
  };

  const handleSaveTopic = async () => {
    if (!topicName.trim()) {
      Alert.alert("Missing Topic", "Please enter a topic name.");
      return;
    }

    try {
      setSaving(true);

      const topicData = {
        srNo: srNo.trim() || "1",
        topic: topicName.trim(),
        url: url.trim(),
      };

      let response;
      let isUpdating = false;

      if (editingTopic?._id) {
        response = await updateTopic(id, editingTopic._id, topicData);
        isUpdating = true;
      } else {
        response = await addTopic(id, topicData);
      }

      setSubject(response.data.data);
      closeModal();

      // Show toast
      if (isUpdating) {
        showToast("✅ Topic updated successfully!", "success");
      } else {
        showToast("✨ Topic added successfully!", "success");
      }
    } catch (error) {
      console.log("SAVE TOPIC ERROR:", error);
      showToast("❌ Failed to save topic", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTopic = (topicId?: string) => {
    if (!topicId) return;

    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to delete this topic?")) {
        deleteTopicAndUpdateSubject(topicId);
      }
      return;
    }

    Alert.alert("Delete Topic", "Are you sure you want to delete this topic?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteTopicAndUpdateSubject(topicId),
      },
    ]);
  };

  const deleteTopicAndUpdateSubject = async (topicId: string) => {
    try {
      const response = await deleteTopic(id, topicId);
      setSubject(response.data.data);
      showToast("🗑️ Topic deleted successfully!", "success");
    } catch (error) {
      console.log("DELETE TOPIC ERROR:", error);
      showToast("❌ Failed to delete topic", "error");
    }
  };

const openUrl = (topicUrl: string, topic: string) => {
  if (!topicUrl || !topicUrl.trim()) {
    Alert.alert(
      "Invalid URL",
      "This topic does not have a valid URL."
    );
    return;
  }

  let cleanUrl = topicUrl.trim();

  // Add https:// if it is missing
  if (
    !cleanUrl.startsWith("http://") &&
    !cleanUrl.startsWith("https://")
  ) {
    cleanUrl = `https://${cleanUrl}`;
  }

  console.log("🌐 Opening URL:", cleanUrl);

  /*
   * =====================================================
   * WEB
   * =====================================================
   *
   * Open website in a NEW browser tab.
   */
  if (Platform.OS === "web") {
    window.open(
      cleanUrl,
      "_blank",
      "noopener,noreferrer"
    );

    return;
  }

  /*
   * =====================================================
   * ANDROID / IOS
   * =====================================================
   *
   * Keep the website inside our native WebView.
   */
  router.push({
    pathname: "/browser",
    params: {
      url: cleanUrl,
      title: topic,
    },
  });
};

  const renderTopic = ({ item }: { item: Topic }) => {
    const animatedStyle = getCardAnimatedStyle(item);

    return (
      <Animated.View style={animatedStyle}>
        <View
          style={[
            styles.topicCard,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
            },
          ]}
        >
          <View
            style={[
              styles.srNoContainer,
              { backgroundColor: theme.accentMuted },
            ]}
          >
            <Text style={[styles.srNoText, { color: theme.accent }]}>
              {item.srNo}
            </Text>
          </View>

          <View style={styles.topicContainer}>
            <Text style={[styles.topicText, { color: theme.text }]}>
              {item.topic}
            </Text>

            {item.url ? (
              <TouchableOpacity
                style={[
                  styles.linkChip,
                  { backgroundColor: theme.accentMuted },
                ]}
                onPress={() => openUrl(item.url!, item.topic)}
              >
                <Text style={[styles.openLink, { color: theme.link }]}>
                  Open URL
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => openEditModal(item)}
            >
              <Text style={[styles.editText, { color: theme.link }]}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteTopic(item._id)}
            >
              <Text style={[styles.deleteText, { color: theme.danger }]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: theme.background }]}
      >
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Loading topics...
        </Text>
      </View>
    );
  }

  if (!subject) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: theme.background }]}
      >
        <Text style={{ color: theme.text }}>Subject not found.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: subject.subjectName,
        }}
      />

      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text
              style={[styles.subjectTitle, { color: theme.text }]}
              numberOfLines={2}
            >
              {subject.subjectName}
            </Text>
            <Text style={[styles.topicCount, { color: theme.textSecondary }]}>
              {subject.topics?.length || 0} topics
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.accent }]}
            onPress={openAddModal}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={styles.searchIcon}>🔍</Text>

          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search topics..."
            placeholderTextColor={theme.textSecondary}
            value={search}
            onChangeText={setSearch}
          />

          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Text style={[styles.clearText, { color: theme.textSecondary }]}>
                ✕
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {search.length > 0 && (
          <Text
            style={[styles.searchResultText, { color: theme.textSecondary }]}
          >
            {filteredTopics.length} result
            {filteredTopics.length !== 1 ? "s" : ""} found
          </Text>
        )}

        <FlatList
          data={filteredTopics}
          keyExtractor={(item, index) => item._id || `${item.srNo}-${index}`}
          renderItem={renderTopic}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            filteredTopics.length === 0 ? styles.emptyList : styles.list
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View
                style={[
                  styles.emptyIconWrap,
                  { backgroundColor: theme.accentMuted },
                ]}
              >
                <Text style={styles.emptyIcon}>📚</Text>
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                {search ? "No topics found" : "No topics yet"}
              </Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                {search ? "Try a different search." : "Add your first topic."}
              </Text>
            </View>
          }
        />
      </View>

      <Modal
        visible={modalVisible}
        animationType="none"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContainer,
              { backgroundColor: theme.backgroundElement },
              {
                transform: [
                  {
                    translateY: modalSlideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [400, 0],
                    }),
                  },
                ],
              },
              {
                opacity: modalSlideAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 0.7, 1],
                }),
              },
            ]}
          >
            <View
              style={[styles.modalHandle, { backgroundColor: theme.border }]}
            />

            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {editingTopic ? "Edit Topic" : "Add Topic"}
              </Text>

              <TouchableOpacity onPress={closeModal} disabled={saving}>
                <Text
                  style={[styles.closeText, { color: theme.textSecondary }]}
                >
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: theme.textSecondary }]}>
              Sr No.
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: theme.text,
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                },
              ]}
              placeholder="Enter serial number"
              placeholderTextColor={theme.textSecondary}
              value={srNo}
              onChangeText={setSrNo}
              keyboardType="numeric"
            />

            <Text style={[styles.label, { color: theme.textSecondary }]}>
              Topic
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: theme.text,
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                },
              ]}
              placeholder="Enter topic name"
              placeholderTextColor={theme.textSecondary}
              value={topicName}
              onChangeText={setTopicName}
            />

            <Text style={[styles.label, { color: theme.textSecondary }]}>
              URL
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: theme.text,
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                },
              ]}
              placeholder="https://example.com"
              placeholderTextColor={theme.textSecondary}
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              keyboardType="url"
            />

            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: theme.accent },
                saving && styles.disabledButton,
              ]}
              onPress={handleSaveTopic}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {editingTopic ? "Update Topic" : "Add Topic"}
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* Toast Notification */}
      {toast.visible && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              backgroundColor:
                toast.type === "success"
                  ? theme.accent
                  : toast.type === "error"
                    ? theme.danger
                    : theme.textSecondary,
              transform: [{ translateY: toastAnimRef }],
            },
          ]}
        >
          <Text style={styles.toastMessage}>{toast.message}</Text>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 8,
    marginBottom: 16,
  },
  subjectTitle: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  topicCount: {
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  addButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 50,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 17,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  clearText: {
    fontSize: 16,
    padding: 6,
    fontWeight: "600",
  },
  searchResultText: {
    fontSize: 12,
    marginBottom: 12,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  list: {
    paddingBottom: 40,
  },
  topicCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 12,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  srNoContainer: {
    minWidth: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    marginRight: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  srNoText: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  topicContainer: {
    flex: 1,
    paddingRight: 8,
  },
  topicText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  linkChip: {
    alignSelf: "flex-start",
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  openLink: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  actionsContainer: {
    alignItems: "flex-end",
    gap: 8,
  },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  editText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  deleteButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  deleteText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 14,
    fontSize: 15,
    fontWeight: "500",
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHandle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 999,
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  closeText: {
    fontSize: 22,
    padding: 6,
    fontWeight: "600",
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 10,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    marginBottom: 18,
    fontWeight: "500",
  },
  saveButton: {
    height: 54,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  disabledButton: {
    opacity: 0.65,
  },
  toastContainer: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
  },
  toastMessage: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.3,
    textAlign: "center",
  },
});
