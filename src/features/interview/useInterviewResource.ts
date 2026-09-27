import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";

export function useInterviewResource<T>(loader: () => Promise<T>, enabled = true) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(enabled);
  const revision = useRef(0);
  const reload = useCallback(async () => {
    const request = ++revision.current;
    if (!enabled) { setLoading(false); setData(null); setError(""); return; }
    setLoading(true); setError("");
    try {
      const value = await loader();
      if (request === revision.current) setData(value);
    } catch {
      if (request === revision.current) setError("Unable to load interview prep. Please check your connection and try again.");
    } finally { if (request === revision.current) setLoading(false); }
  }, [loader, enabled]);
  useFocusEffect(useCallback(() => { void reload(); return () => { revision.current++; }; }, [reload]));
  return { data, setData, error, loading, reload };
}
