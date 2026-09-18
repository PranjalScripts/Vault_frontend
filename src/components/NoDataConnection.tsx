import { Feather } from "@expo/vector-icons";
import NetInfo, { useNetInfo } from "@react-native-community/netinfo";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/hooks/use-theme";

export default function NoDataConnection() {
  const theme = useTheme();
  const { width } = useWindowDimensions();

  const { isConnected, isInternetReachable } = useNetInfo();

  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState("");

  const isMobile = width < 600;

  // Unknown initial connectivity must not interrupt startup.
  const offline = isConnected === false || isInternetReachable === false;

  // =========================================================
  // THEME
  // =========================================================

  const accent = theme.accent;
  const background = theme.background;
  const text = theme.text;
  const secondary = theme.textSecondary;

  const cardBackground = theme.backgroundElement;

  // =========================================================
  // REFRESH WHEN APP RETURNS TO FOREGROUND
  // =========================================================

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void NetInfo.refresh().catch(() => {});
      }
    });

    return () => subscription.remove();
  }, []);

  // =========================================================
  // CLEAR MESSAGE AFTER CONNECTION RETURNS
  // =========================================================

  useEffect(() => {
    if (!offline) {
      setMessage("");
    }
  }, [offline]);

  // =========================================================
  // RETRY
  // =========================================================

  const retry = async () => {
    if (checking) return;

    setChecking(true);
    setMessage("");

    try {
      const state = await NetInfo.refresh();

      if (state.isConnected === false || state.isInternetReachable === false) {
        setMessage("Still offline. Check your connection and try again.");
      } else if (state.isInternetReachable === null) {
        setMessage("Waiting for an internet connection…");
      }
    } catch {
      setMessage("Could not check your connection. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <Modal
      visible={offline}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={() => {}}
    >
      <SafeAreaView
        style={[
          styles.screen,
          {
            backgroundColor: background,
          },
        ]}
      >
        {/* ===================================================
            BACKGROUND SOLAR SYSTEM
        =================================================== */}

        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {/* GLOWS */}

          <View
            style={[
              styles.glow,
              styles.glowTop,
              {
                backgroundColor: `${accent}0D`,
              },
            ]}
          />

          <View
            style={[
              styles.glow,
              styles.glowBottom,
              {
                backgroundColor: `${accent}09`,
              },
            ]}
          />

          {/* ORBITS */}

          <View
            style={[
              styles.orbit,
              styles.orbit1,
              {
                borderColor: `${accent}26`,
              },
            ]}
          />

          <View
            style={[
              styles.orbit,
              styles.orbit2,
              {
                borderColor: `${accent}1C`,
              },
            ]}
          />

          <View
            style={[
              styles.orbit,
              styles.orbit3,
              {
                borderColor: `${accent}14`,
              },
            ]}
          />

          <View
            style={[
              styles.orbit,
              styles.orbit4,
              {
                borderColor: `${accent}0D`,
              },
            ]}
          />

          {/* PLANETS */}

          <View
            style={[
              styles.planet,
              styles.planet1,
              {
                backgroundColor: accent,
                shadowColor: accent,
              },
            ]}
          />

          <View
            style={[
              styles.planet,
              styles.planet2,
              {
                backgroundColor: accent,
                shadowColor: accent,
              },
            ]}
          />

          <View
            style={[
              styles.planet,
              styles.planet3,
              {
                backgroundColor: accent,
                shadowColor: accent,
              },
            ]}
          />

          {/* LARGE PLANET */}

          <View
            style={[
              styles.largePlanet,
              {
                backgroundColor: `${accent}08`,
                borderColor: `${accent}35`,
              },
            ]}
          >
            <View
              style={[
                styles.largePlanetInner,
                {
                  backgroundColor: `${accent}10`,
                },
              ]}
            />

            <View
              style={[
                styles.largePlanetHighlight,
                {
                  backgroundColor: `${accent}18`,
                },
              ]}
            />
          </View>

          {/* STARS */}

          <View
            style={[
              styles.star,
              {
                top: "13%",
                left: "14%",
                backgroundColor: accent,
              },
            ]}
          />

          <View
            style={[
              styles.starSmall,
              {
                top: "22%",
                right: "17%",
                backgroundColor: accent,
              },
            ]}
          />

          <View
            style={[
              styles.starSmall,
              {
                top: "48%",
                left: "8%",
                backgroundColor: accent,
              },
            ]}
          />

          <View
            style={[
              styles.star,
              {
                bottom: "22%",
                right: "12%",
                backgroundColor: accent,
              },
            ]}
          />

          <View
            style={[
              styles.starSmall,
              {
                bottom: "13%",
                left: "20%",
                backgroundColor: accent,
              },
            ]}
          />

          <View
            style={[
              styles.starSmall,
              {
                top: "9%",
                right: "33%",
                backgroundColor: accent,
              },
            ]}
          />
        </View>

        {/* ===================================================
            PAGE CONTENT
        =================================================== */}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.container,
            isMobile && styles.containerMobile,
          ]}
        >
          <View style={[styles.content, isMobile && styles.contentMobile]}>
            {/* =================================================
                VAULT BRAND
            ================================================= */}

            <View style={styles.brandContainer}>
              <View style={styles.brandRow}>
                <View
                  style={[
                    styles.brandIcon,
                    {
                      backgroundColor: `${accent}14`,
                      borderColor: `${accent}28`,
                    },
                  ]}
                >
                  <Feather name="shield" size={18} color={accent} />
                </View>

                <Text
                  style={[
                    styles.brand,
                    {
                      color: text,
                    },
                  ]}
                >
                  vault
                </Text>
              </View>

              <Text
                style={[
                  styles.brandTagline,
                  {
                    color: secondary,
                  },
                ]}
              >
                SECURE WHAT MATTERS
              </Text>
            </View>

            {/* =================================================
                CONNECTION PLANET
            ================================================= */}

            <View style={styles.connectionPlanetWrapper}>
              {/* GLOW */}

              <View
                style={[
                  styles.connectionGlow,
                  {
                    backgroundColor: `${accent}0D`,
                  },
                ]}
              />

              {/* PLANET */}

              <View
                style={[
                  styles.connectionPlanet,
                  {
                    backgroundColor: `${accent}0C`,
                    borderColor: `${accent}40`,
                    shadowColor: accent,
                  },
                ]}
              >
                <View
                  style={[
                    styles.connectionPlanetInner,
                    {
                      backgroundColor: `${accent}08`,
                    },
                  ]}
                />

                <Feather name="wifi-off" size={42} color={accent} />
              </View>

              {/* ORBIT */}

              <View
                style={[
                  styles.connectionRing,
                  {
                    borderColor: `${accent}85`,
                  },
                ]}
              />

              {/* ORBIT DOT */}

              <View
                style={[
                  styles.connectionOrbitDot,
                  {
                    backgroundColor: accent,
                    shadowColor: accent,
                  },
                ]}
              />
            </View>

            {/* =================================================
                MAIN CARD
            ================================================= */}

            <View
              style={[
                styles.card,
                isMobile && styles.cardMobile,
                {
                  backgroundColor: cardBackground,
                  borderColor: `${accent}30`,
                },
              ]}
            >
              {/* STATUS */}

              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusLine,
                    {
                      backgroundColor: `${accent}65`,
                    },
                  ]}
                />

                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: accent,
                    },
                  ]}
                />

                <Text
                  style={[
                    styles.statusLabel,
                    {
                      color: accent,
                    },
                  ]}
                >
                  CONNECTION LOST
                </Text>

                <View
                  style={[
                    styles.statusLine,
                    {
                      backgroundColor: `${accent}65`,
                    },
                  ]}
                />
              </View>

              {/* TITLE */}

              <Text
                accessibilityRole="header"
                style={[
                  styles.title,
                  isMobile && styles.titleMobile,
                  {
                    color: text,
                  },
                ]}
              >
                You&#39;re currently{"\n"}offline
              </Text>

              {/* DESCRIPTION */}

              <Text
                style={[
                  styles.description,
                  isMobile && styles.descriptionMobile,
                  {
                    color: secondary,
                  },
                ]}
              >
                Turn on mobile data or connect to Wi-Fi. Vault will reconnect
                automatically as soon as your internet connection is restored.
              </Text>

              {/* =================================================
                  CONNECTION INFO
              ================================================= */}

              <View
                style={[
                  styles.infoBox,
                  {
                    backgroundColor: `${accent}07`,
                    borderColor: `${accent}18`,
                  },
                ]}
              >
                <View
                  style={[
                    styles.infoIcon,
                    {
                      backgroundColor: `${accent}12`,
                    },
                  ]}
                >
                  <Feather name="shield" size={17} color={accent} />
                </View>

                <View style={styles.infoTextContainer}>
                  <Text
                    style={[
                      styles.infoTitle,
                      {
                        color: text,
                      },
                    ]}
                  >
                    Your Vault is safe
                  </Text>

                  <Text
                    style={[
                      styles.infoDescription,
                      {
                        color: secondary,
                      },
                    ]}
                  >
                    Your data remains secure while you&#39;re offline.
                  </Text>
                </View>
              </View>

              {/* =================================================
                  RETRY BUTTON
              ================================================= */}

              <Pressable
                accessibilityRole="button"
                accessibilityState={{
                  disabled: checking,
                  busy: checking,
                }}
                disabled={checking}
                onPress={retry}
                style={({ pressed }) => [
                  styles.retryButton,
                  {
                    backgroundColor: accent,
                    opacity: pressed || checking ? 0.78 : 1,

                    transform: [
                      {
                        scale: pressed && !checking ? 0.985 : 1,
                      },
                    ],
                  },
                ]}
              >
                {/* LEFT */}

                <View style={styles.buttonLeft}>
                  {checking ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Feather name="refresh-cw" size={19} color="#FFFFFF" />
                  )}
                </View>

                {/* CENTER */}

                <Text style={styles.retryButtonText}>
                  {checking ? "Checking connection…" : "Try again"}
                </Text>

                {/* RIGHT */}

                <View style={styles.buttonRight}>
                  {!checking && (
                    <Feather name="arrow-right" size={19} color="#FFFFFF" />
                  )}
                </View>
              </Pressable>

              {/* =================================================
                  MESSAGE
              ================================================= */}

              {!!message && (
                <View
                  accessibilityLiveRegion="polite"
                  style={[
                    styles.messageBox,
                    {
                      backgroundColor: `${accent}08`,
                      borderColor: `${accent}18`,
                    },
                  ]}
                >
                  <Feather name="info" size={15} color={accent} />

                  <Text
                    style={[
                      styles.message,
                      {
                        color: secondary,
                      },
                    ]}
                  >
                    {message}
                  </Text>
                </View>
              )}

              {/* =================================================
                  FOOTER
              ================================================= */}

              <View style={styles.securityRow}>
                <View
                  style={[
                    styles.securityLine,
                    {
                      backgroundColor: `${secondary}30`,
                    },
                  ]}
                />

                <View style={styles.securityContent}>
                  <Feather name="lock" size={11} color={secondary} />

                  <Text
                    style={[
                      styles.securityText,
                      {
                        color: secondary,
                      },
                    ]}
                  >
                    STAY SECURE
                  </Text>

                  <View
                    style={[
                      styles.securityDot,
                      {
                        backgroundColor: accent,
                      },
                    ]}
                  />

                  <Text
                    style={[
                      styles.securityText,
                      {
                        color: secondary,
                      },
                    ]}
                  >
                    STAY CONNECTED
                  </Text>
                </View>

                <View
                  style={[
                    styles.securityLine,
                    {
                      backgroundColor: `${secondary}30`,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ===========================================================
// STYLES
// ===========================================================

const styles = StyleSheet.create({
  // =========================================================
  // SCREEN
  // =========================================================

  screen: {
    flex: 1,
    overflow: "hidden",
  },

  container: {
    flexGrow: 1,

    justifyContent: "center",
    alignItems: "center",

    paddingHorizontal: 24,
    paddingVertical: 36,
  },

  containerMobile: {
    paddingHorizontal: 15,
    paddingVertical: 22,
  },

  content: {
    width: "100%",
    maxWidth: 590,

    alignItems: "center",
  },

  contentMobile: {
    maxWidth: 460,
  },

  // =========================================================
  // BACKGROUND GLOW
  // =========================================================

  glow: {
    position: "absolute",

    borderRadius: 9999,
  },

  glowTop: {
    width: 500,
    height: 500,

    top: -270,
    left: -210,
  },

  glowBottom: {
    width: 600,
    height: 600,

    right: -320,
    bottom: -300,
  },

  // =========================================================
  // BACKGROUND ORBITS
  // =========================================================

  orbit: {
    position: "absolute",

    borderWidth: 1,
    borderRadius: 9999,
  },

  orbit1: {
    width: 420,
    height: 420,

    top: "8%",
    left: "50%",

    marginLeft: -210,

    transform: [{ scaleX: 1.45 }],
  },

  orbit2: {
    width: 650,
    height: 650,

    top: "3%",
    left: "50%",

    marginLeft: -325,

    transform: [{ scaleX: 1.3 }],
  },

  orbit3: {
    width: 900,
    height: 900,

    top: "-5%",
    left: "50%",

    marginLeft: -450,

    transform: [{ scaleX: 1.25 }],
  },

  orbit4: {
    width: 1150,
    height: 1150,

    top: "-13%",
    left: "50%",

    marginLeft: -575,

    transform: [{ scaleX: 1.2 }],
  },

  // =========================================================
  // BACKGROUND PLANETS
  // =========================================================

  planet: {
    position: "absolute",

    borderRadius: 999,

    shadowOpacity: 0.65,
    shadowRadius: 12,

    elevation: 4,
  },

  planet1: {
    width: 11,
    height: 11,

    top: "18%",
    left: "17%",
  },

  planet2: {
    width: 7,
    height: 7,

    top: "34%",
    right: "13%",
  },

  planet3: {
    width: 9,
    height: 9,

    bottom: "18%",
    left: "22%",
  },

  // =========================================================
  // LARGE BACKGROUND PLANET
  // =========================================================

  largePlanet: {
    position: "absolute",

    width: 110,
    height: 110,

    top: "7%",
    right: -52,

    borderWidth: 1,
    borderRadius: 55,

    alignItems: "center",
    justifyContent: "center",

    overflow: "hidden",
  },

  largePlanetInner: {
    width: 76,
    height: 76,

    borderRadius: 38,
  },

  largePlanetHighlight: {
    position: "absolute",

    width: 44,
    height: 44,

    borderRadius: 22,

    top: 11,
    left: 16,

    opacity: 0.6,
  },

  // =========================================================
  // STARS
  // =========================================================

  star: {
    position: "absolute",

    width: 4,
    height: 4,

    borderRadius: 2,

    opacity: 0.75,
  },

  starSmall: {
    position: "absolute",

    width: 2,
    height: 2,

    borderRadius: 1,

    opacity: 0.55,
  },

  // =========================================================
  // BRAND
  // =========================================================

  brandContainer: {
    alignItems: "center",

    marginBottom: 20,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",

    gap: 9,
  },

  brandIcon: {
    width: 34,
    height: 34,

    borderRadius: 11,
    borderWidth: 1,

    alignItems: "center",
    justifyContent: "center",
  },

  brand: {
    fontSize: 28,

    fontWeight: "800",

    letterSpacing: -1.3,
  },

  brandTagline: {
    marginTop: 8,

    fontSize: 9,

    fontWeight: "600",

    letterSpacing: 4,
  },

  // =========================================================
  // CONNECTION PLANET
  // =========================================================

  connectionPlanetWrapper: {
    width: 190,
    height: 155,

    alignItems: "center",
    justifyContent: "center",

    marginBottom: -24,

    zIndex: 3,
  },

  connectionGlow: {
    position: "absolute",

    width: 170,
    height: 170,

    borderRadius: 85,
  },

  connectionPlanet: {
    width: 125,
    height: 125,

    borderRadius: 63,
    borderWidth: 1,

    alignItems: "center",
    justifyContent: "center",

    overflow: "hidden",

    shadowOpacity: 0.28,
    shadowRadius: 30,

    elevation: 4,
  },

  connectionPlanetInner: {
    position: "absolute",

    width: 90,
    height: 90,

    borderRadius: 45,

    top: -25,
    left: -15,
  },

  connectionRing: {
    position: "absolute",

    width: 180,
    height: 67,

    borderWidth: 1,
    borderRadius: 100,

    transform: [{ rotate: "-13deg" }],
  },

  connectionOrbitDot: {
    position: "absolute",

    width: 13,
    height: 13,

    borderRadius: 7,

    right: 13,
    top: 60,

    shadowOpacity: 0.75,
    shadowRadius: 9,

    elevation: 6,
  },

  // =========================================================
  // CARD
  // =========================================================

  card: {
    width: "100%",

    borderWidth: 1,
    borderRadius: 28,

    paddingHorizontal: 42,
    paddingTop: 50,
    paddingBottom: 24,

    alignItems: "center",

    ...Platform.select({
      web: {
        boxShadow: "0 24px 70px rgba(0,0,0,0.16)",
      },

      default: {
        shadowColor: "#000",

        shadowOffset: {
          width: 0,
          height: 16,
        },

        shadowOpacity: 0.12,
        shadowRadius: 28,

        elevation: 7,
      },
    }),
  },

  cardMobile: {
    borderRadius: 24,

    paddingHorizontal: 20,
    paddingTop: 46,
    paddingBottom: 22,
  },

  // =========================================================
  // STATUS
  // =========================================================

  statusRow: {
    width: "100%",

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 9,

    marginBottom: 17,
  },

  statusLine: {
    width: 25,
    height: 1,
  },

  statusDot: {
    width: 5,
    height: 5,

    borderRadius: 3,
  },

  statusLabel: {
    fontSize: 10,

    fontWeight: "800",

    letterSpacing: 2.7,
  },

  // =========================================================
  // TITLE
  // =========================================================

  title: {
    fontSize: 34,
    lineHeight: 41,

    fontWeight: "800",

    letterSpacing: -1.2,

    textAlign: "center",
  },

  titleMobile: {
    fontSize: 29,
    lineHeight: 35,
  },

  // =========================================================
  // DESCRIPTION
  // =========================================================

  description: {
    maxWidth: 420,

    marginTop: 13,

    fontSize: 15,
    lineHeight: 23,

    textAlign: "center",
  },

  descriptionMobile: {
    fontSize: 14,
    lineHeight: 21,
  },

  // =========================================================
  // INFO BOX
  // =========================================================

  infoBox: {
    width: "100%",
    maxWidth: 390,

    marginTop: 23,

    borderWidth: 1,
    borderRadius: 15,

    paddingHorizontal: 15,
    paddingVertical: 13,

    flexDirection: "row",
    alignItems: "center",

    gap: 12,
  },

  infoIcon: {
    width: 38,
    height: 38,

    borderRadius: 12,

    alignItems: "center",
    justifyContent: "center",

    flexShrink: 0,
  },

  infoTextContainer: {
    flex: 1,
  },

  infoTitle: {
    fontSize: 13,

    fontWeight: "700",
  },

  infoDescription: {
    marginTop: 2,

    fontSize: 11.5,
    lineHeight: 17,
  },

  // =========================================================
  // RETRY BUTTON
  // =========================================================

  retryButton: {
    position: "relative",

    width: "100%",
    maxWidth: 390,

    height: 58,

    marginTop: 13,

    borderRadius: 16,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 56,

    overflow: "hidden",

    shadowColor: "#000",

    shadowOffset: {
      width: 0,
      height: 6,
    },

    shadowOpacity: 0.15,
    shadowRadius: 12,

    elevation: 4,
  },

  retryButtonText: {
    color: "#FFFFFF",

    fontSize: 15,
    lineHeight: 20,

    fontWeight: "800",

    textAlign: "center",

    includeFontPadding: false,
  },

  // =========================================================
  // BUTTON ICONS
  // =========================================================

  buttonLeft: {
    position: "absolute",

    left: 19,
    top: 0,
    bottom: 0,

    width: 24,

    alignItems: "center",
    justifyContent: "center",
  },

  buttonRight: {
    position: "absolute",

    right: 19,
    top: 0,
    bottom: 0,

    width: 24,

    alignItems: "center",
    justifyContent: "center",
  },

  // =========================================================
  // MESSAGE
  // =========================================================

  messageBox: {
    width: "100%",
    maxWidth: 390,

    marginTop: 12,

    paddingHorizontal: 13,
    paddingVertical: 11,

    borderWidth: 1,
    borderRadius: 12,

    flexDirection: "row",
    alignItems: "center",

    gap: 9,
  },

  message: {
    flex: 1,

    fontSize: 12,
    lineHeight: 18,
  },

  // =========================================================
  // SECURITY FOOTER
  // =========================================================

  securityRow: {
    width: "100%",

    marginTop: 24,

    flexDirection: "row",
    alignItems: "center",

    gap: 12,
  },

  securityLine: {
    flex: 1,

    height: 1,
  },

  securityContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 7,
  },

  securityText: {
    fontSize: 8,

    fontWeight: "700",

    letterSpacing: 1.6,
  },

  securityDot: {
    width: 3,
    height: 3,

    borderRadius: 2,

    marginHorizontal: 2,
  },
});
