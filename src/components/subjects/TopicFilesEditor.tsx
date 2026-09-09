import React from "react";
import { Text, View } from "react-native";
import { useTheme } from "@/hooks/use-theme";
import { Button, Field, SubjectFile, s } from "./SubjectUI";
export function TopicFilesEditor({
  files,
  onChange,
}: {
  files: SubjectFile[];
  onChange: (files: SubjectFile[]) => void;
}) {
  const t = useTheme();
  const update = (index: number, data: Partial<SubjectFile>) =>
    onChange(
      files.map((file, i) => (i === index ? { ...file, ...data } : file)),
    );
  return (
    <View style={{ gap: 16 }}>
      <View>
        <Text style={{ color: t.text, fontWeight: "700", fontSize: 16 }}>
          File attachments
        </Text>
        <Text style={[s.body, { color: t.textSecondary, marginTop: 5 }]}>
          Attach a file using its hosted URL.
        </Text>
      </View>
      {files.map((file, index) => (
        <View
          key={file._id || index}
          style={{
            borderWidth: 1,
            borderColor: t.border,
            borderRadius: 12,
            padding: 14,
            gap: 14,
          }}
        >
          <View style={s.row}>
            <Text style={{ color: t.text, fontWeight: "600" }}>
              File {index + 1}
            </Text>
            <Button
              secondary
              danger
              label="Remove"
              onPress={() => onChange(files.filter((_, i) => i !== index))}
            />
          </View>
          <Field
            label="File name"
            value={file.fileName}
            onChangeText={(fileName) => update(index, { fileName })}
            placeholder="e.g. Java study guide.pdf"
          />
          <Field
            url
            label="File URL"
            value={file.fileUrl}
            onChangeText={(fileUrl) => update(index, { fileUrl })}
            placeholder="https://example.com/guide.pdf"
          />
          <Text style={{ color: t.text, fontSize: 13, fontWeight: "600" }}>
            File type
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {(
              ["pdf", "image", "document", "video", "audio", "other"] as const
            ).map((fileType) => (
              <Button
                key={fileType}
                label={fileType === "pdf" ? "PDF" : fileType}
                secondary={file.fileType !== fileType}
                onPress={() => update(index, { fileType })}
              />
            ))}
          </View>
          <Field
            url
            label="MIME type (optional)"
            value={file.mimeType || ""}
            onChangeText={(mimeType) => update(index, { mimeType })}
            placeholder="e.g. application/pdf"
          />
          <Field
            numeric
            label="Size in bytes (optional)"
            value={file.fileSize ? String(file.fileSize) : ""}
            onChangeText={(size) =>
              update(index, { fileSize: size === "" ? 0 : Number(size) })
            }
            placeholder="0"
          />
        </View>
      ))}
      <Button
        secondary
        label="+ Attach file link"
        onPress={() =>
          onChange([
            ...files,
            {
              fileName: "",
              fileUrl: "",
              fileType: "other",
              mimeType: "",
              fileSize: 0,
            },
          ])
        }
      />
    </View>
  );
}
