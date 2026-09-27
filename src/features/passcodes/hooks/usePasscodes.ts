import { useFeedbackModal } from "@/contexts/FeedbackModalContext";
import { useCallback, useState } from "react";
import * as Clipboard from "expo-clipboard";
import Toast from "react-native-toast-message";

export function usePasscodes() {
  const { showError } = useFeedbackModal();
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const toggleReveal = useCallback((id: string) => {
    setRevealedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const copyToClipboard = useCallback(async (value: string, fieldId: string, fieldName: string) => {
    try {
      await Clipboard.setStringAsync(value);
      setCopiedField(fieldId);
      Toast.show({ type: "success", text1: "Copied", text2: `${fieldName} copied to clipboard.` });
      setTimeout(() => setCopiedField(null), 1500);
    } catch (error) {
      console.log("COPY ERROR:", error);
      showError({ title: "Copy failed", message: "Unable to copy to clipboard." });
    }
  }, [showError]);

  return { revealedIds, copiedField, toggleReveal, copyToClipboard };
}
