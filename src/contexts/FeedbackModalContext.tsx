import { SuccessModal } from "@/components/modals/SuccessModal";
import { ErrorModal } from "@/components/modals/ErrorModal";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import React, { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import { FeedbackDialog } from "@/components/modals/FeedbackDialog";

type Notice = { title: string; message: string; buttonLabel?: string };
type Item = Notice & { id: number; kind: "success" | "error" | "info" | "confirm"; resolve?: (confirmed: boolean) => void };
type API = {
  showSuccess: (notice: Notice) => void;
  showError: (notice: Notice) => void;
  showInfo: (notice: Notice) => void;
  confirm: (notice: Notice) => Promise<boolean>;
};
const FeedbackContext = createContext<API | null>(null);
const HostContext = createContext<{ register: (id: string) => () => void; host?: string; item?: Item; closing: boolean; close: (confirmed?: boolean) => void } | null>(null);

export function FeedbackModalProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<Item[]>([]);
  const [hosts, setHosts] = useState<string[]>([]);
  const [closing, setClosing] = useState(false);
  const sequence = useRef(0);
  const pending = useRef(new Map<number, (value: boolean) => void>());
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dismissing = useRef(false);
  const enqueue = useCallback((kind: Item["kind"], notice: Notice, resolve?: Item["resolve"]) => {
    const id = ++sequence.current;
    if (resolve) pending.current.set(id, resolve);
    setQueue(current => [...current, { ...notice, id, kind, resolve }]);
  }, []);
  const api = useMemo<API>(() => ({
    showSuccess: notice => enqueue("success", notice),
    showError: notice => enqueue("error", notice),
    showInfo: notice => enqueue("info", notice),
    confirm: notice => new Promise(resolve => enqueue("confirm", notice, resolve)),
  }), [enqueue]);
  const item = queue[0];
  const [readyId, setReadyId] = useState<number>();
  useEffect(() => {
    if (!item) return;
    const opening = setTimeout(() => setReadyId(item.id), 220);
    return () => clearTimeout(opening);
  }, [item]);
  const close = useCallback((confirmed = false) => {
    if (!item || dismissing.current) return;
    dismissing.current = true;
    setClosing(true);
    timer.current = setTimeout(() => {
      setQueue(current => current.filter(entry => entry.id !== item.id));
      setClosing(false);
      dismissing.current = false;
      pending.current.delete(item.id);
      item.resolve?.(confirmed);
    }, 180);
  }, [item]);
  const register = useCallback((id: string) => {
    setHosts(current => [...current, id]);
    return () => setHosts(current => current.filter(value => value !== id));
  }, []);
  useEffect(() => {
    const outstanding = pending.current;
    return () => { clearTimeout(timer.current); outstanding.forEach(resolve => resolve(false)); outstanding.clear(); };
  }, []);
  const host = hosts[hosts.length - 1];
  return <FeedbackContext.Provider value={api}>
    <HostContext.Provider value={{ register, host, item: item?.id === readyId ? item : undefined, closing, close }}>
      {children}
      {!host && item && item.id === readyId && (item.kind === "confirm"
        ? <ConfirmModal key={item.id} {...item} visible={!closing} onClose={() => close()} onConfirm={() => close(true)} />
        : item.kind === "success" ? <SuccessModal key={item.id} {...item} visible={!closing} onClose={() => close()} />
        : item.kind === "error" ? <ErrorModal key={item.id} {...item} visible={!closing} onClose={() => close()} />
        : <FeedbackDialog key={item.id} {...item} visible={!closing} onClose={() => close()} />)}
    </HostContext.Provider>
  </FeedbackContext.Provider>;
}
export function useFeedbackModal() {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error("useFeedbackModal must be used inside FeedbackModalProvider");
  return context;
}
// Mount inside existing native form modals so errors appear above the form on iOS,
// without presenting a second native Modal. Draft fields remain intact underneath.
export function FeedbackModalHost({ active }: { active: boolean }) {
  const context = useContext(HostContext);
  const id = useId();
  const register = context?.register;
  useEffect(() => { if (active && register) return register(id); }, [active, id, register]);
  if (!context || context.host !== id || !context.item) return null;
  const { item, closing, close } = context;
  return <FeedbackDialog key={item.id} {...item} inline visible={!closing} buttonLabel={item.buttonLabel || (item.kind === "confirm" ? "Delete" : "Done")} onClose={() => close()} onConfirm={item.kind === "confirm" ? () => close(true) : undefined} />;
}

export function useDismissFeedback() {
  const context = useContext(HostContext);
  return () => {
    if (!context?.item) return false;
    context.close();
    return true;
  };
}
