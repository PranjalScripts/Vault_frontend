import React, { useState } from "react";
import { Text, View } from "react-native";
import { addTopic, updateTopic } from "@/api/api";
import { useTheme } from "@/hooks/use-theme";
import { Button, Field, Subject, SubjectFile, Topic } from "./SubjectUI";
import { TopicStatus, topicStatus, statusLabels } from "./TopicRow";
import { TopicFilesEditor } from "./TopicFilesEditor";
export function TopicEditor({
  subject,
  editing = null,
  onSaved,
  onBusyChange,
}: {
  subject: Subject;
  editing?: Topic | null;
  onSaved: (subject: Subject) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const t = useTheme();
  const [name, setName] = useState(editing?.topic || "");
  const [description, setDescription] = useState(editing?.description || "");
  const [number, setNumber] = useState(
    String(
      editing?.srNo ??
        Math.max(
          0,
          ...(subject.topics || []).map((topic) => Number(topic.srNo) || 0),
        ) + 1,
    ),
  );
  const [url, setUrl] = useState(editing?.url || "");
  const [status, setStatus] = useState<TopicStatus>(
    editing ? topicStatus(editing) : "not_started",
  );
  const [files, setFiles] = useState<SubjectFile[]>(
    (editing?.files || []).map((file) => ({ ...file })),
  );
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const normalizeUrl = (value: string) => {
    const clean = value.trim();
    const parsed = new URL(
      /^[a-z][a-z\d+.-]*:/i.test(clean) ? clean : `https://${clean}`,
    );
    if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname)
      throw new Error("Invalid URL");
    return parsed.href;
  };
  const save = async () => {
    if (busy) return;
    if (!Number.isInteger(Number(number)) || Number(number) < 1) {
      setFormError("Enter a positive whole number for the topic order.");
      return;
    }
    let resource = "";
    let attachments: SubjectFile[] = [];
    try {
      resource = url.trim() ? normalizeUrl(url) : "";
      attachments = files.map((file) => {
        if (!file.fileName.trim())
          throw new Error("Each attachment needs a file name.");
        if (!file.fileUrl.trim())
          throw new Error("Each attachment needs a hosted file URL.");
        if (
          !Number.isFinite(file.fileSize || 0) ||
          Number.isNaN(file.fileSize) ||
          (file.fileSize || 0) < 0
        )
          throw new Error("File size must be a non-negative number.");
        return {
          ...file,
          fileName: file.fileName.trim(),
          fileUrl: normalizeUrl(file.fileUrl),
        };
      });
    } catch (error) {
      setFormError(
        error instanceof Error && error.message !== "Invalid URL"
          ? error.message
          : "Enter a valid http or https URL for each resource and file.",
      );
      return;
    }
    setBusy(true);
    onBusyChange?.(true);
    setFormError("");
    try {
      const data = {
        topic: name.trim(),
        srNo: Number(number),
        url: resource,
        description: description.trim(),
        status,
        isCompleted: status === "completed",
        files: attachments,
      };
      const response = editing?._id
        ? await updateTopic(subject._id, editing._id, data)
        : await addTopic(subject._id, data);
      onSaved(response.data.data);
    } catch {
      setFormError("Unable to save this topic. Please try again.");
    } finally {
      setBusy(false);
      onBusyChange?.(false);
    }
  };
  return (
    <View style={{ gap: 20 }}>
      <Field
        label="Topic name (optional)"
        placeholder="e.g. Introduction to Java"
        value={name}
        onChangeText={setName}
      />
      <Field
        label="Description (optional)"
        placeholder="Overview, history, JDK, JVM, JRE"
        value={description}
        onChangeText={setDescription}
      />
      <Field
        numeric
        label="Topic order"
        placeholder="1"
        value={number}
        onChangeText={setNumber}
      />
      <Field
        url
        label="Resource URL (optional)"
        placeholder="https://example.com"
        value={url}
        onChangeText={setUrl}
      />
      <Text style={{ color: t.text, fontWeight: "600" }}>Status</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {(["not_started", "in_progress", "completed"] as const).map((value) => (
          <Button
            key={value}
            label={statusLabels[value]}
            secondary={status !== value}
            onPress={() => setStatus(value)}
          />
        ))}
      </View>
      <TopicFilesEditor files={files} onChange={setFiles} />
      {formError ? (
        <Text accessibilityRole="alert" style={{ color: t.danger }}>
          {formError}
        </Text>
      ) : null}
      <Button
        label={busy ? "Saving…" : editing ? "Save changes" : "Add Topic"}
        disabled={busy}
        onPress={save}
      />
    </View>
  );
}
