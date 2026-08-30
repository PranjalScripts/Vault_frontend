import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { useFocusEffect, useRouter, Stack } from "expo-router";
import { AppLayout } from "@/components/AppLayout";

import { createSubject, deleteSubject, getSubjects, logout } from "@/api/api";
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
  updatedAt?: string;
};

export default function SubjectsScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectName, setSubjectName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchSubjects = async () => {
    try {
      setLoading(true);

      const response = await getSubjects();

      setSubjects(response.data.data);
    } catch (error) {
      console.log("GET SUBJECTS ERROR:", error);

      Alert.alert(
        "Error",
        "Unable to load subjects. Please check your backend connection.",
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSubjects();
    }, []),
  );

  const handleCreateSubject = async () => {
    const name = subjectName.trim();

    if (!name) {
      Alert.alert("Missing name", "Please enter a subject name.");
      return;
    }

    try {
      setCreating(true);

      const response = await createSubject(name);

      const newSubject = response.data.data;

      setSubjects((currentSubjects) => [...currentSubjects, newSubject]);

      setSubjectName("");
    } catch (error) {
      console.log("CREATE SUBJECT ERROR:", error);

      Alert.alert("Error", "Unable to create the subject.");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSubject = (id: string) => {
    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to delete this subject?")) {
        deleteSubjectAndUpdateList(id);
      }
      return;
    }

    Alert.alert(
      "Delete Subject",
      "Are you sure you want to delete this subject?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteSubjectAndUpdateList(id),
        },
      ],
    );
  };

  const deleteSubjectAndUpdateList = async (id: string) => {
    try {
      await deleteSubject(id);

      setSubjects((currentSubjects) =>
        currentSubjects.filter((subject) => subject._id !== id),
      );
    } catch (error) {
      console.log("DELETE SUBJECT ERROR:", error);

      Alert.alert("Error", "Unable to delete the subject.");
    }
  };

  const getSubjectIcon = (subjectName: string) => {
    const name = subjectName.toLowerCase();
    if (name.includes("spring") || name.includes("boot") || name.includes("java")) {
      return "🌱";
    } else if (name.includes("react") || name.includes("js") || name.includes("javascript")) {
      return "⚛️";
    } else if (name.includes("python") || name.includes("py")) {
      return "🐍";
    } else if (name.includes("data") || name.includes("database") || name.includes("sql")) {
      return "🗄️";
    } else if (name.includes("design") || name.includes("ui") || name.includes("ux")) {
      return "🎨";
    } else if (name.includes("web") || name.includes("html") || name.includes("css")) {
      return "🌐";
    } else if (name.includes("mobile") || name.includes("app") || name.includes("ios") || name.includes("android")) {
      return "📱";
    } else if (name.includes("security") || name.includes("auth") || name.includes("password")) {
      return "🔒";
    } else if (name.includes("algorithm") || name.includes("code") || name.includes("programming")) {
      return "💻";
    } else {
      return "📁";
    }
  };

  const formatUpdatedTime = (updatedAt?: string) => {
    if (!updatedAt) return "";
    const date = new Date(updatedAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Updated today";
    if (diffDays === 1) return "Updated 1 day ago";
    if (diffDays < 7) return `Updated ${diffDays} days ago`;
    if (diffDays < 30) return `Updated ${Math.floor(diffDays / 7)} weeks ago`;
    return `Updated ${Math.floor(diffDays / 30)} months ago`;
  };

  const renderSubject = (item: Subject) => {
    const topicCount = item.topics?.length || 0;
    const subjectIcon = getSubjectIcon(item.subjectName);
    const updatedTime = formatUpdatedTime(item.updatedAt);

    return (
      <TouchableOpacity
        style={[
          styles.subjectCard,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
          },
        ]}
        activeOpacity={0.82}
        onPress={() =>
          router.push({
            pathname: "/subjects/[id]",
            params: {
              id: item._id,
            },
          })
        }
      >
        <View style={styles.subjectIconContainer}>
          <Text style={styles.subjectIcon}>{subjectIcon}</Text>
        </View>

        <View style={styles.subjectInfo}>
          <Text style={[styles.subjectName, { color: theme.text }]}>
            {item.subjectName}
          </Text>

          <View style={styles.subjectMeta}>
            <Text style={[styles.topicCount, { color: theme.textSecondary }]}>
              {topicCount} {topicCount === 1 ? "topic" : "topics"}
            </Text>
            {updatedTime && (
              <>
                <Text style={[styles.metaSeparator, { color: theme.textSecondary }]}>•</Text>
                <Text style={[styles.updatedTime, { color: theme.textSecondary }]}>
                  {updatedTime}
                </Text>
              </>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => handleDeleteSubject(item._id)}
          hitSlop={8}
        >
          <Text style={[styles.moreIcon, { color: theme.textSecondary }]}>⋮</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <AppLayout
      title="Subjects"
      subtitle="Organize your subjects and their topics"
      scrollable={false}
    >
      <View
        style={[
          styles.createContainer,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
          },
        ]}
      >
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.border }]}
          placeholder="Enter new subject name..."
          placeholderTextColor={theme.textSecondary}
          value={subjectName}
          onChangeText={setSubjectName}
          onSubmitEditing={handleCreateSubject}
          returnKeyType="done"
        />

        <TouchableOpacity
          style={[
            styles.addButton,
            { backgroundColor: theme.accent },
            creating && styles.disabledButton,
          ]}
          onPress={handleCreateSubject}
          disabled={creating}
        >
          {creating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.addButtonText}>+ Add Subject</Text>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading subjects...
          </Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.subjectList}
          contentContainerStyle={
            subjects.length === 0 ? styles.emptyList : styles.list
          }
          showsVerticalScrollIndicator={false}
        >
          {subjects.length === 0 ? (
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
                No subjects yet
              </Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                Add your first subject above.
              </Text>
            </View>
          ) : (
            subjects.map((subject) => (
              <View key={subject._id}>
                {renderSubject(subject)}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  createContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 12,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 15,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  addButton: {
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    minWidth: 120,
  },
  disabledButton: {
    opacity: 0.6,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  list: {
    paddingBottom: 24,
    flexGrow: 1,
  },
  subjectList: {
    flex: 1,
  },
  subjectCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingRight: 16,
    paddingLeft: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    minHeight: 72,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  subjectIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  subjectIcon: {
    fontSize: 22,
  },
  subjectInfo: {
    flex: 1,
    marginRight: 10,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
    marginBottom: 4,
  },
  subjectMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  topicCount: {
    fontSize: 13,
  },
  metaSeparator: {
    marginHorizontal: 6,
    fontSize: 13,
  },
  updatedTime: {
    fontSize: 13,
  },
  moreButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  moreIcon: {
    fontSize: 20,
    fontWeight: "300",
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
    paddingBottom: 100,
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
});
