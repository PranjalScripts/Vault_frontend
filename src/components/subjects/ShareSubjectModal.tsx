import React, { useEffect, useState } from "react";
import { Platform, Share, Text } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Button, FormModal, Subject, Topic } from "./SubjectUI";
import { createSubjectShare } from "@/api/api";
import { useTheme } from "@/hooks/use-theme";

export type ShareSelection = { subject: Subject; topic?: Topic };

export function ShareSubjectModal({ selection, onClose }: {
  selection: ShareSelection | null;
  onClose: () => void;
}) {
  const t = useTheme();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setUrl("");
    setFeedback("");
    if (!selection) return;
    setLoading(true);
    async function generate() {
      try {
        const origin = process.env.EXPO_PUBLIC_WEB_URL ||
          (Platform.OS === "web" && typeof window !== "undefined" ? window.location.origin : "");
        if (!/^https?:\/\//i.test(origin)) throw new Error("The website address is not configured. Set EXPO_PUBLIC_WEB_URL to your public website URL.");
        if (selection!.topic && !selection!.topic._id) throw new Error("Save this topic before sharing it.");
        const result = await createSubjectShare(selection!.subject._id, selection!.topic?._id);
        const link = new URL(`${origin.replace(/\/$/, "")}/share`);
        link.searchParams.set("token", result.data.data.token);
        if (active) setUrl(link.toString());
      } catch (error) {
        if (active) setFeedback(error instanceof Error ? error.message : "Unable to create link. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void generate();
    return () => { active = false; };
  }, [selection, retry]);
  async function send(copy: boolean) {
    setBusy(true);
    setFeedback("");
    try {
      if (copy) {
        if (!await Clipboard.setStringAsync(url)) throw new Error("Copy failed");
        setFeedback("Link copied.");
      } else if (Platform.OS === "web") {
        if (typeof navigator !== "undefined" && navigator.share) {
          await navigator.share({ title: selection?.subject.subjectName, url });
        } else {
          if (!await Clipboard.setStringAsync(url)) throw new Error("Copy failed");
          setFeedback("Link copied. Paste it into a message to someone.");
        }
      } else {
        await Share.share({ message: url });
      }
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError")) {
        setFeedback("Unable to share or copy the link. Please try again.");
      }
    } finally { setBusy(false); }
  }
  return (
    <FormModal visible={!!selection} title={selection?.topic ? "Share topic" : "Share entire subject"}
      subtitle="Anyone with this link can view the shared content on our website without signing in. Changes you make will appear there too."
      onClose={() => { if (!busy) onClose(); }}>
      {loading && <Text style={{ color: t.textSecondary }}>Creating share link…</Text>}
      {!!url && <>
        <Text selectable style={{ color: t.accent, lineHeight: 22 }}>{url}</Text>
        <Button label={busy ? "Please wait…" : "Share link"} disabled={busy} onPress={() => void send(false)} />
        <Button secondary label="Copy link" disabled={busy} onPress={() => void send(true)} />
      </>}
      {!!feedback && <Text accessibilityRole="alert" style={{ color: t.textSecondary }}>{feedback}</Text>}
      {!loading && !url && <Button label="Try again" onPress={() => setRetry((value) => value + 1)} />}
    </FormModal>
  );
}
