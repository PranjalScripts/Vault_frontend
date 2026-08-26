import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
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

  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);

  const [srNo, setSrNo] = useState("");
  const [topicName, setTopicName] = useState("");
  const [url, setUrl] = useState("");

  const [saving, setSaving] = useState(false);

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

      if (editingTopic?._id) {
        response = await updateTopic(id, editingTopic._id, topicData);
      } else {
        response = await addTopic(id, topicData);
      }

      setSubject(response.data.data);

      closeModal();
    } catch (error) {
      console.log("SAVE TOPIC ERROR:", error);

      Alert.alert("Error", "Unable to save the topic.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTopic = (topicId?: string) => {
    if (!topicId) return;

    Alert.alert("Delete Topic", "Are you sure you want to delete this topic?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await deleteTopic(id, topicId);

            setSubject(response.data.data);
          } catch (error) {
            console.log("DELETE TOPIC ERROR:", error);

            Alert.alert("Error", "Unable to delete the topic.");
          }
        },
      },
    ]);
  };

  const openUrl = (topicUrl: string, topic: string) => {
    router.push({
      pathname: "/browser",
      params: {
        url: topicUrl,
        title: topic,
      },
    });
  };

  const renderTopic = ({ item }: { item: Topic }) => {
    return (
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
          style={[styles.srNoContainer, { backgroundColor: theme.accentMuted }]}
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
              style={[styles.linkChip, { backgroundColor: theme.accentMuted }]}
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
          <View>
            <Text style={[styles.topicCount, { color: theme.textSecondary }]}>
              {subject.topics?.length || 0} topics in this subject
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
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: theme.backgroundElement },
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
                <Text style={[styles.closeText, { color: theme.textSecondary }]}>
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
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  topicCount: {
    fontSize: 14,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  clearText: {
    fontSize: 16,
    padding: 5,
  },
  searchResultText: {
    fontSize: 13,
    marginBottom: 8,
  },
  list: {
    paddingBottom: 30,
  },
  topicCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  srNoContainer: {
    minWidth: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    marginRight: 12,
  },
  srNoText: {
    fontSize: 13,
    fontWeight: "700",
  },
  topicContainer: {
    flex: 1,
    paddingRight: 8,
  },
  topicText: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "600",
  },
  linkChip: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  openLink: {
    fontSize: 12,
    fontWeight: "700",
  },
  actionsContainer: {
    alignItems: "flex-end",
  },
  editButton: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  editText: {
    fontSize: 13,
    fontWeight: "700",
  },
  deleteButton: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  deleteText: {
    fontSize: 13,
    fontWeight: "700",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 28,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  emptyText: {
    marginTop: 6,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  modalHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 999,
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  closeText: {
    fontSize: 20,
    padding: 5,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 7,
    letterSpacing: 0.2,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    marginBottom: 15,
  },
  saveButton: {
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 5,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.6,
  },
});
