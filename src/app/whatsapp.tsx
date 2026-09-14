import FontAwesome from "@expo/vector-icons/FontAwesome";
import React, { useEffect, useRef, useState } from "react";
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";

import Feather from "@expo/vector-icons/Feather";

import { AppLayout } from "@/components/AppLayout";
import { getAuthUser } from "@/api/api";
import { useTheme } from "@/hooks/use-theme";

export default function WhatsAppScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();

  const isMobile = width < 700;
  const isTablet = width >= 700 && width < 1050;
  const isDesktop = width >= 1050;

  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("Hello, pleased to connect with you.");
  const [error, setError] = useState("");
  const [opening, setOpening] = useState(false);

  const messageEdited = useRef(false);

  /* =========================================================
   * LOAD USER
   * ========================================================= */

  useEffect(() => {
    let active = true;

    getAuthUser()
      .then((user) => {
        const name = typeof user?.name === "string" ? user.name.trim() : "";

        if (active && name && !messageEdited.current) {
          setMessage(`Hello, this is ${name}.`);
        }
      })
      .catch(() => {
        // Keep default message if user load fails
      });

    return () => {
      active = false;
    };
  }, []);

  /* =========================================================
   * OPEN WHATSAPP
   * ========================================================= */

  const openChat = async () => {
    if (opening) return;

    const formatted = phone.trim();

    const digits = formatted.replace(/[\s().-]/g, "").replace(/^\+/, "");

    const number =
      !formatted.startsWith("+") && /^\d{10}$/.test(digits)
        ? `91${digits}`
        : digits;

    if (
      !/^\+?[\d\s().-]+$/.test(formatted) ||
      !/^[1-9]\d{6,14}$/.test(number)
    ) {
      setError(
        "Enter a valid 10-digit Indian number or an international number with country code.",
      );
      return;
    }

    if (!message.trim()) {
      setError("Enter a message before opening WhatsApp.");
      return;
    }

    setError("");
    setOpening(true);

    try {
      await Linking.openURL(
        `https://wa.me/${number}?text=${encodeURIComponent(message.trim())}`,
      );
    } catch {
      setError(
        "Unable to open WhatsApp. Please check that WhatsApp is available on your device.",
      );
    } finally {
      setOpening(false);
    }
  };

  /* =========================================================
   * COMMON COLORS
   * ========================================================= */

const pageBg = theme.backgroundElement;
  const cardBg = theme.backgroundElement;

  const whatsappGreen = "#25D366";

  const whatsappGreenDark = "#1FA855";

  const softGreen =
    Platform.OS === "web"
      ? "rgba(37, 211, 102, 0.12)"
      : "rgba(37, 211, 102, 0.14)";

  /* =========================================================
   * UI
   * ========================================================= */

  return (
    <AppLayout
      subtitle={
        isMobile ? undefined : "Start a conversation without saving a contact."
      }
      showMobileSearch={false}
    >
      <View
        style={[
          styles.page,
          {
            backgroundColor: pageBg,
          },
          isMobile && styles.pageMobile,
        ]}
      >
        {/* =====================================================
         * MOBILE HEADER CONTENT
         * ===================================================== */}

        {isMobile && (
          <View style={styles.mobileIntro}>
            <View
              style={[
                styles.mobileIntroIcon,
                {
                  backgroundColor: softGreen,
                },
              ]}
            >
              <FontAwesome name="whatsapp" size={22} color={whatsappGreen} />
            </View>

            <View style={styles.mobileIntroText}>
              <Text
                style={[
                  styles.mobileTitle,
                  {
                    color: theme.text,
                  },
                ]}
              >
                Start a conversation
              </Text>

              <Text
                style={[
                  styles.mobileSubtitle,
                  {
                    color: theme.textSecondary,
                  },
                ]}
              >
                Message a number directly without saving it.
              </Text>
            </View>
          </View>
        )}

        {/* =====================================================
         * MAIN RESPONSIVE GRID
         * ===================================================== */}

        <View
          style={[
            styles.layout,
            isMobile && styles.layoutMobile,
            isTablet && styles.layoutTablet,
          ]}
        >
          {/* ===================================================
           * FORM PANEL
           * =================================================== */}

          <View
            style={[
              styles.formCard,
              {
                backgroundColor: cardBg,
                borderColor: theme.border,
              },
              isMobile && [
                styles.formCardMobile,
                {
                  backgroundColor: pageBg,
                },
              ],
              isTablet && styles.formCardTablet,
            ]}
          >
            {!isMobile && (
              <View style={styles.formHeader}>
                <View
                  style={[
                    styles.headerIcon,
                    {
                      backgroundColor: softGreen,
                    },
                  ]}
                >
                  <FontAwesome
                    name="whatsapp"
                    size={24}
                    color={whatsappGreen}
                  />
                </View>

                <View style={styles.headerText}>
                  <Text
                    style={[
                      styles.formTitle,
                      {
                        color: theme.text,
                      },
                    ]}
                  >
                    Start WhatsApp Chat
                  </Text>

                  <Text
                    style={[
                      styles.formSubtitle,
                      {
                        color: theme.textSecondary,
                      },
                    ]}
                  >
                    Open a WhatsApp conversation without adding the number to
                    your contacts.
                  </Text>
                </View>
              </View>
            )}

            {/* PHONE FIELD */}

            <View style={styles.field}>
              <Text
                style={[
                  styles.label,
                  {
                    color: theme.text,
                  },
                ]}
              >
                Phone number
              </Text>

              <View style={styles.phoneRow}>
                <View
                  style={[
                    styles.countryBox,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.backgroundElement,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.countryText,
                      {
                        color: theme.text,
                      },
                    ]}
                  >
                    +91
                  </Text>
                </View>

                <TextInput
                  value={phone}
                  accessibilityLabel="Phone number"
                  onChangeText={(value) => {
                    setPhone(value);
                    setError("");
                  }}
                  placeholder="9876543210"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="phone-pad"
                  autoComplete="off"
                  autoCorrect={false}
                  style={[
                    styles.input,
                    styles.phoneInput,
                    {
                      color: theme.text,
                      borderColor: theme.border,
                      backgroundColor: theme.backgroundElement,
                    },
                  ]}
                />
              </View>

              <View style={styles.helperRow}>
                <Feather name="info" size={14} color={theme.textSecondary} />

                <Text
                  style={[
                    styles.helperText,
                    {
                      color: theme.textSecondary,
                    },
                  ]}
                >
                  10-digit numbers use India (+91) automatically. International
                  numbers should include their country code.
                </Text>
              </View>
            </View>

            {/* MESSAGE FIELD */}

            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text
                  style={[
                    styles.label,
                    {
                      color: theme.text,
                    },
                  ]}
                >
                  Message
                </Text>

                <Text
                  style={[
                    styles.counter,
                    {
                      color: theme.textSecondary,
                    },
                  ]}
                >
                  {message.length} characters
                </Text>
              </View>

              <TextInput
                value={message}
                accessibilityLabel="WhatsApp message"
                onChangeText={(value) => {
                  messageEdited.current = true;
                  setMessage(value);
                  setError("");
                }}
                multiline
                textAlignVertical="top"
                placeholder="Write your message..."
                placeholderTextColor={theme.textSecondary}
                style={[
                  styles.input,
                  styles.messageInput,
                  {
                    color: theme.text,
                    borderColor: theme.border,
                    backgroundColor: theme.backgroundElement,
                  },
                ]}
              />
            </View>

            {/* ERROR */}

            {!!error && (
              <View
                style={[
                  styles.errorBox,
                  {
                    backgroundColor: theme.danger + "14",
                  },
                ]}
              >
                <Feather name="alert-circle" size={17} color={theme.danger} />

                <Text
                  accessibilityRole="alert"
                  style={[
                    styles.errorText,
                    {
                      color: theme.danger,
                    },
                  ]}
                >
                  {error}
                </Text>
              </View>
            )}

            {/* CTA */}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open chat in WhatsApp"
              disabled={opening}
              onPress={openChat}
              style={({ pressed }) => [
                styles.primaryButton,
                {
                  backgroundColor:
                    pressed || opening ? whatsappGreenDark : whatsappGreen,
                  opacity: opening ? 0.8 : 1,
                },
              ]}
            >
              <FontAwesome name="whatsapp" size={20} color="#FFFFFF" />

              <Text style={styles.primaryButtonText}>
                {opening ? "Opening WhatsApp..." : "Open in WhatsApp"}
              </Text>

              {!opening && (
                <Feather name="arrow-up-right" size={18} color="#FFFFFF" />
              )}
            </Pressable>

            {/* SMALL FOOTER */}

            <View style={styles.footerNote}>
              <Feather name="shield" size={14} color={theme.textSecondary} />

              <Text
                style={[
                  styles.footerNoteText,
                  {
                    color: theme.textSecondary,
                  },
                ]}
              >
                Vault does not send the message. WhatsApp opens with your text
                ready for review.
              </Text>
            </View>
          </View>

          {/* ===================================================
           * WEB / TABLET SIDE PANEL
           * =================================================== */}

          {!isMobile && (
            <View
              style={[
                styles.sideCard,
                {
                  backgroundColor: cardBg,
                  borderColor: theme.border,
                },
                isTablet && styles.sideCardTablet,
              ]}
            >
              <View
                style={[
                  styles.sideIcon,
                  {
                    backgroundColor: softGreen,
                  },
                ]}
              >
                <Feather name="send" size={24} color={whatsappGreen} />
              </View>

              <Text
                style={[
                  styles.sideTitle,
                  {
                    color: theme.text,
                  },
                ]}
              >
                Quick WhatsApp
              </Text>

              <Text
                style={[
                  styles.sideSubtitle,
                  {
                    color: theme.textSecondary,
                  },
                ]}
              >
                Reach someone quickly without cluttering your address book.
              </Text>

              <View style={styles.steps}>
                <StepRow
                  number="1"
                  title="Enter a number"
                  subtitle="Use an Indian number or include an international country code."
                  theme={theme}
                  green={whatsappGreen}
                  softGreen={softGreen}
                />

                <StepRow
                  number="2"
                  title="Write your message"
                  subtitle="Edit the suggested text before opening WhatsApp."
                  theme={theme}
                  green={whatsappGreen}
                  softGreen={softGreen}
                />

                <StepRow
                  number="3"
                  title="Open WhatsApp"
                  subtitle="Review the prepared message and tap Send."
                  theme={theme}
                  green={whatsappGreen}
                  softGreen={softGreen}
                />
              </View>

              <View
                style={[
                  styles.tipBox,
                  {
                    backgroundColor: softGreen,
                  },
                ]}
              >
                <Feather name="lock" size={17} color={whatsappGreen} />

                <Text
                  style={[
                    styles.tipText,
                    {
                      color: theme.text,
                    },
                  ]}
                >
                  No contact is created or saved by Vault.
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </AppLayout>
  );
}

/* =========================================================
 * STEP ROW
 * ========================================================= */

function StepRow({
  number,
  title,
  subtitle,
  theme,
  green,
  softGreen,
}: {
  number: string;
  title: string;
  subtitle: string;
  theme: any;
  green: string;
  softGreen: string;
}) {
  return (
    <View style={styles.stepRow}>
      <View
        style={[
          styles.stepNumber,
          {
            backgroundColor: softGreen,
          },
        ]}
      >
        <Text
          style={[
            styles.stepNumberText,
            {
              color: green,
            },
          ]}
        >
          {number}
        </Text>
      </View>

      <View style={styles.stepContent}>
        <Text
          style={[
            styles.stepTitle,
            {
              color: theme.text,
            },
          ]}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.stepSubtitle,
            {
              color: theme.textSecondary,
            },
          ]}
        >
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

/* =========================================================
 * STYLES
 * ========================================================= */

const styles = StyleSheet.create({
  /* PAGE */

  page: {
    width: "100%",
    alignSelf: "stretch",
    paddingBottom: 32,
  },

  pageMobile: {
    flex: 1,
    paddingBottom: 20,
  },

  /* MOBILE INTRO */

  mobileIntro: {
    flexDirection: "row",
    alignItems: "center",

    gap: 12,

    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 18,
  },

  mobileIntroIcon: {
    width: 44,
    height: 44,

    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",
  },

  mobileIntroText: {
    flex: 1,
  },

  mobileTitle: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
  },

  mobileSubtitle: {
    marginTop: 2,

    fontSize: 13,
    lineHeight: 18,
  },

  /* GRID */

  layout: {
    width: "100%",
    maxWidth: 1080,

    flexDirection: "row",
    alignItems: "flex-start",

    gap: 24,
  },

  layoutMobile: {
    flexDirection: "column",

    maxWidth: "100%",

    gap: 0,
  },

  layoutTablet: {
    gap: 18,
  },

  /* FORM CARD */

  formCard: {
    flex: 1,

    minWidth: 0,

    borderWidth: 1,
    borderRadius: 20,

    padding: 26,

    gap: 24,
  },

  formCardMobile: {
    width: "100%",

    borderWidth: 0,
    borderRadius: 0,

    paddingHorizontal: 16,
    paddingVertical: 0,

    gap: 20,
  },

  formCardTablet: {
    padding: 22,
  },

  /* HEADER */

  formHeader: {
    flexDirection: "row",
    alignItems: "flex-start",

    gap: 14,
  },

  headerIcon: {
    width: 48,
    height: 48,

    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",
  },

  headerText: {
    flex: 1,
  },

  formTitle: {
    fontSize: 21,
    fontWeight: "700",
    lineHeight: 27,
  },

  formSubtitle: {
    marginTop: 4,

    fontSize: 13,
    lineHeight: 19,
  },

  /* FIELD */

  field: {
    width: "100%",
    gap: 9,
  },

  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    gap: 12,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
  },

  counter: {
    fontSize: 11,
  },

  /* PHONE */

  phoneRow: {
    width: "100%",

    flexDirection: "row",
    alignItems: "stretch",

    gap: 10,
  },

  countryBox: {
    width: 76,
    minHeight: 52,

    borderWidth: 1,
    borderRadius: 13,

    alignItems: "center",
    justifyContent: "center",
  },

  countryText: {
    fontSize: 16,
    fontWeight: "700",
  },

  phoneInput: {
    flex: 1,
    minWidth: 0,
  },

  /* INPUT */

  input: {
    borderWidth: 1,
    borderRadius: 13,

    paddingHorizontal: 15,
    paddingVertical: 13,

    fontSize: 15,

    minHeight: 52,
  },

  messageInput: {
    minHeight: 140,
    maxHeight: 240,

    lineHeight: 22,
  },

  /* HELP */

  helperRow: {
    flexDirection: "row",
    alignItems: "flex-start",

    gap: 7,

    paddingTop: 1,
  },

  helperText: {
    flex: 1,

    fontSize: 12,
    lineHeight: 18,
  },

  /* ERROR */

  errorBox: {
    width: "100%",

    flexDirection: "row",
    alignItems: "flex-start",

    gap: 8,

    paddingHorizontal: 12,
    paddingVertical: 11,

    borderRadius: 12,
  },

  errorText: {
    flex: 1,

    fontSize: 12,
    lineHeight: 18,
  },

  /* BUTTON */

  primaryButton: {
    width: "100%",
    minHeight: 54,

    borderRadius: 14,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 9,

    paddingHorizontal: 18,
    paddingVertical: 14,
  },

  primaryButtonText: {
    color: "#FFFFFF",

    fontSize: 15,
    fontWeight: "700",
  },

  /* FOOTER */

  footerNote: {
    flexDirection: "row",
    alignItems: "flex-start",

    gap: 7,
  },

  footerNoteText: {
    flex: 1,

    fontSize: 11,
    lineHeight: 17,
  },

  /* SIDE CARD */

  sideCard: {
    width: 330,

    borderWidth: 1,
    borderRadius: 20,

    padding: 24,
  },

  sideCardTablet: {
    width: 280,
    padding: 20,
  },

  sideIcon: {
    width: 50,
    height: 50,

    borderRadius: 15,

    alignItems: "center",
    justifyContent: "center",
  },

  sideTitle: {
    marginTop: 18,

    fontSize: 21,
    fontWeight: "700",
  },

  sideSubtitle: {
    marginTop: 6,

    fontSize: 13,
    lineHeight: 20,
  },

  steps: {
    marginTop: 24,

    gap: 20,
  },

  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",

    gap: 12,
  },

  stepNumber: {
    width: 30,
    height: 30,

    borderRadius: 10,

    alignItems: "center",
    justifyContent: "center",
  },

  stepNumberText: {
    fontSize: 13,
    fontWeight: "700",
  },

  stepContent: {
    flex: 1,
  },

  stepTitle: {
    fontSize: 13,
    fontWeight: "600",
  },

  stepSubtitle: {
    marginTop: 3,

    fontSize: 11,
    lineHeight: 17,
  },

  tipBox: {
    marginTop: 24,

    flexDirection: "row",
    alignItems: "center",

    gap: 9,

    paddingHorizontal: 12,
    paddingVertical: 12,

    borderRadius: 12,
  },

  tipText: {
    flex: 1,

    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
});
