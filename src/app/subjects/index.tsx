import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import { createSubject, deleteSubject, getSubjects } from "@/api/api";
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
          onPress: async () => {
            try {
              await deleteSubject(id);

              setSubjects((currentSubjects) =>
                currentSubjects.filter((subject) => subject._id !== id),
              );
            } catch (error) {
              console.log("DELETE SUBJECT ERROR:", error);

              Alert.alert("Error", "Unable to delete the subject.");
            }
          },
        },
      ],
    );
  };

  const renderSubject = ({ item }: { item: Subject }) => {
    const topicCount = item.topics?.length || 0;

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
        <View
          style={[styles.accentMark, { backgroundColor: theme.accent }]}
        />

        <View style={styles.subjectInfo}>
          <Text style={[styles.subjectName, { color: theme.text }]}>
            {item.subjectName}
          </Text>

          <View
            style={[
              styles.countPill,
              { backgroundColor: theme.accentMuted },
            ]}
          >
            <Text style={[styles.topicCount, { color: theme.accent }]}>
              {topicCount} {topicCount === 1 ? "topic" : "topics"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteSubject(item._id)}
          hitSlop={8}
        >
          <Text style={[styles.deleteText, { color: theme.danger }]}>
            Delete
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
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
          style={[styles.input, { color: theme.text }]}
          placeholder="New subject name"
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
            <Text style={styles.addButtonText}>Add</Text>
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
        <FlatList
          data={subjects}
          keyExtractor={(item) => item._id}
          renderItem={renderSubject}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            subjects.length === 0 ? styles.emptyList : styles.list
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
                No subjects yet
              </Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                Add your first subject above.
              </Text>
            </View>
          }
        />
      )}
    </View>
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
    marginBottom: 20,
    borderWidth: 1,
    borderRadius: 16,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 16,
  },
  addButton: {
    minWidth: 68,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  list: {
    paddingBottom: 24,
  },
  subjectCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingRight: 12,
    marginBottom: 12,
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  accentMark: {
    width: 4,
    alignSelf: "stretch",
    marginRight: 14,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 17,
    fontWeight: "700",
  },
  countPill: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  topicCount: {
    fontSize: 12,
    fontWeight: "700",
  },
  deleteButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  deleteText: {
    fontSize: 13,
    fontWeight: "600",
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
