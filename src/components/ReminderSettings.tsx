import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Switch,
  Text,
  View,
} from "react-native";
import MobileNotificationSettings from "./settings/MobileNotificationSettings";
import Feather from "@expo/vector-icons/Feather";
import API, { forceRefresh } from "@/api/client";
import { useSettingsPalette } from "@/hooks/use-settings-palette";
import {
  disablePush,
  enablePush,
  pushRegistration,
} from "@/notifications/push";
import { getAuthUser } from "@/api/auth";

export type Preferences = {
  enabled: boolean;
  tasks: boolean;
  study: boolean;
  interview: boolean;
  games: boolean;
  agenda: boolean;
  streaks: boolean;
  security: boolean;
  recovery: boolean;
  updates: boolean;
  agendaHour: number;
  gameHour: number;
  streakHour: number;
  timeZone: string;
  quietStart: number;
  quietEnd: number;
};
export default function ReminderSettings({ mobile = false }: { mobile?: boolean } = {}) {
  const p = useSettingsPalette();
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [preferences, setPreferences] = useState<Preferences | null>(null),
    [busy, setBusy] = useState(false);
  const [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [push, setPush] = useState(false),
    [available, setAvailable] = useState(true),
    [pushAvailable, setPushAvailable] = useState(false);
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await forceRefresh("/notifications/preferences");
        if (!active) return;
        setPreferences(response.data.data);
        setAvailable(response.data.automaticAvailable);
        setPushAvailable(response.data.pushAvailable);
        const [registration, user] = await Promise.all([
          pushRegistration(),
          getAuthUser(),
        ]);
        if (active)
          setPush(
            !!registration &&
              registration.userId === String(user?._id || user?.id),
          );
      } catch {
        if (active)
          setError(
            "Could not load notification settings. Reopen Settings to retry.",
          );
      }
    })();
    return () => {
      active = false;
    };
  }, [loadAttempt]);
  const save = async (patch: Partial<Preferences>) => {
    if (!preferences || busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await API.put("/notifications/preferences", patch);
      setPreferences({ ...preferences, ...patch });
      setMessage("Notification preferences saved.");
    } catch {
      setError("Could not save changes. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  const changePush = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (push) await disablePush();
      else await enablePush();
      setPush(!push);
      setMessage(
        push
          ? "Phone alerts disabled on this device."
          : "Phone alerts enabled on this device.",
      );
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Could not update phone alerts.",
      );
    } finally {
      setBusy(false);
    }
  };
  if (mobile) return <MobileNotificationSettings preferences={preferences} busy={busy} push={push} available={available} pushAvailable={pushAvailable}
    error={error} message={message} save={save} changePush={changePush} retry={() => { setError(''); setLoadAttempt(value => value + 1); }} />;
  const row = (
    title: string,
    description: string,
    checked: boolean,
    change: () => void,
    disabled = false,
  ) => (
    <View
      key={title}
      style={{
        flexDirection: "row",
        gap: 12,
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderColor: p.border,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ color: p.text, fontWeight: "600", fontSize: 14 }}>
          {title}
        </Text>
        <Text
          style={{
            color: p.secondary,
            fontSize: 12,
            lineHeight: 18,
            marginTop: 3,
          }}
        >
          {description}
        </Text>
      </View>
      <Switch
        accessibilityLabel={title}
        disabled={busy || disabled}
        value={checked}
        onValueChange={change}
        trackColor={{ true: p.accent }}
      />
    </View>
  );
  return (
    <View
      style={{
        padding: 16,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: p.border,
        backgroundColor: p.card,
        gap: 10,
      }}
    >
      <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
        <Feather name="bell" size={23} color={p.accent} />
        <Text style={{ color: p.text, fontSize: 18, fontWeight: "700" }}>
          Automatic notifications
        </Text>
      </View>
      <Text style={{ color: p.secondary, fontSize: 12, lineHeight: 18 }}>
        Reminders arrive in your inbox on every device. Set task and study
        reminders from their item pages.
      </Text>
      {!available && (
        <Text style={{ color: p.secondary, fontSize: 12 }}>
          Automatic reminders are currently offline. Check the Vercel cron
          configuration. Your preferences are saved.
        </Text>
      )}
      {!preferences && !error && <ActivityIndicator color={p.accent} />}
      {preferences && (
        <>
          {row(
            "Enable automatic reminders",
            "Pause or resume new reminders across your account.",
            preferences.enabled,
            () => void save({ enabled: !preferences.enabled }),
          )}
          {(
            [
              [
                "tasks",
                "Tasks",
                "Scheduled task reminders and one alert when a task becomes overdue.",
              ],
              [
                "study",
                "Subjects and topics",
                "A weekly nudge after three days without study progress.",
              ],
              [
                "interview",
                "Interview prep",
                "Resume unrevised questions after a day, or review after a week.",
              ],
              [
                "agenda",
                "Daily agenda",
                "A morning summary of pending tasks due today.",
              ],
              [
                "streaks",
                "Streak reminders",
                "A reminder to continue an active study or game streak.",
              ],
              [
                "security",
                "Security alerts",
                "Logins, new devices and password changes.",
              ],
              [
                "recovery",
                "Recovery alerts",
                "Changes to your Vault recovery protection.",
              ],
              [
                "updates",
                "App updates",
                "New Vault versions for your registered devices.",
              ],
              [
                "games",
                "Games",
                "A daily reminder unless you have completed a game or puzzle today.",
              ],
            ] as const
          ).map(([key, title, detail]) =>
            row(
              title,
              detail,
              preferences[key],
              () => void save({ [key]: !preferences[key] }),
              !preferences.enabled,
            ),
          )}
          {Platform.OS !== "web" &&
            row(
              "Phone alerts on this device",
              pushAvailable
                ? "Get alerts even when Vault is closed. Your phone will ask permission."
                : "You can register this phone now. Delivery will resume when the notification service is available.",
              push,
              () => void changePush(),
              false,
            )}
          {(["agendaHour", "gameHour", "streakHour"] as const).map(
            (key, index) => (
              <View key={key} style={{ gap: 8 }}>
                <Text style={{ color: p.text }}>
                  {
                    [
                      "Agenda time",
                      "Game reminder time",
                      "Streak reminder time",
                    ][index]
                  }
                  : {String(preferences[key]).padStart(2, "0")}:00
                </Text>
                <View style={{ flexDirection: "row", gap: 16 }}>
                  {[-1, 1].map((step) => (
                    <Pressable
                      key={step}
                      accessibilityRole="button"
                      accessibilityLabel={`${step < 0 ? "Earlier" : "Later"} ${key}`}
                      disabled={busy}
                      onPress={() =>
                        void save({
                          [key]: (preferences[key] + step + 24) % 24,
                        })
                      }
                      style={{ padding: 12 }}
                    >
                      <Text style={{ color: p.accent }}>
                        {step < 0 ? "− 1 hour" : "+ 1 hour"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ),
          )}
          <Text style={{ color: p.text, fontWeight: "600", marginTop: 8 }}>
            Quiet hours for phone alerts
          </Text>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            {[
              { label: "10 PM – 8 AM", start: 22, end: 8 },
              { label: "11 PM – 7 AM", start: 23, end: 7 },
              { label: "Off", start: 0, end: 0 },
            ].map((option) => (
              <Pressable
                key={option.label}
                accessibilityRole="radio"
                accessibilityState={{
                  checked:
                    preferences.quietStart === option.start &&
                    preferences.quietEnd === option.end,
                }}
                disabled={busy}
                onPress={() =>
                  void save({ quietStart: option.start, quietEnd: option.end })
                }
                style={{
                  minHeight: 44,
                  paddingHorizontal: 12,
                  justifyContent: "center",
                  borderRadius: 12,
                  backgroundColor:
                    preferences.quietStart === option.start &&
                    preferences.quietEnd === option.end
                      ? p.mint
                      : p.inset,
                }}
              >
                <Text style={{ color: p.accent, fontSize: 12 }}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={{ color: p.secondary, fontSize: 12 }}>
            Time zone: {preferences.timeZone}. Inbox entries remain available
            during quiet hours.
          </Text>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() =>
              void save({
                timeZone:
                  Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
              })
            }
            style={{ minHeight: 44, justifyContent: "center" }}
          >
            <Text style={{ color: p.accent }}>Use this device’s time zone</Text>
          </Pressable>
        </>
      )}
      {!!error && (
        <Text accessibilityRole="alert" style={{ color: p.text, fontSize: 12 }}>
          {error}
        </Text>
      )}
      {!!message && (
        <Text
          accessibilityLiveRegion="polite"
          style={{ color: p.accent, fontSize: 12 }}
        >
          {message}
        </Text>
      )}
    </View>
  );
}
