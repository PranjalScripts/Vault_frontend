import React from "react";
import { Platform, ScrollView, Text, View } from "react-native";
import { useTheme } from "@/hooks/use-theme";

// Render the portable Markdown subset used by interview imports, without HTML execution.
export function InterviewContent({ content, code = false }: { content: string; code?: boolean }) {
  const theme = useTheme();
  const mono = Platform.OS === "ios" ? "Menlo" : "monospace";
  const blocks: { text: string; code: boolean; language?: string }[] = [];
  const fences = /```([^\n`]*)\r?\n([\s\S]*?)```/g;
  let cursor = 0, match: RegExpExecArray | null;
  while ((match = fences.exec(content))) {
    if (match.index > cursor) blocks.push({ text: content.slice(cursor, match.index).trim(), code: false });
    blocks.push({ text: match[2].replace(/\r?\n$/, ""), code: true, language: match[1].trim() });
    cursor = fences.lastIndex;
  }
  if (cursor < content.length) blocks.push({ text: content.slice(cursor).trim(), code: code && cursor === 0 });
  return <View style={{ gap: 14, minWidth: 0 }}>{blocks.filter(block => block.text).map((block, index) => block.code ?
    <View key={index} style={{ backgroundColor: theme.backgroundSelected, borderRadius: 10, padding: 14, minWidth: 0 }}>
      {!!block.language && <Text style={{ color: theme.textSecondary, marginBottom: 8, fontSize: 12 }}>{block.language}</Text>}
      <ScrollView horizontal style={{ maxWidth: "100%" }}><Text selectable style={{ color: theme.text, fontFamily: mono, fontSize: 14, lineHeight: 23 }}>{block.text}</Text></ScrollView>
    </View> : <Text key={index} selectable style={{ color: theme.text, fontSize: 16, lineHeight: 27 }}>{block.text.split(/(\*\*[^*]+\*\*|`[^`\n]+`)/g).map((part, i) => part.startsWith('**') ? <Text key={i} style={{ fontWeight: "700" }}>{part.slice(2, -2)}</Text> : part.startsWith('`') ? <Text key={i} style={{ fontFamily: mono, backgroundColor: theme.backgroundSelected }}>{part.slice(1, -1)}</Text> : part)}</Text>
  )}</View>;
}
