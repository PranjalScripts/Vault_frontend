import Feather from "@expo/vector-icons/Feather";
import { Stack, useRouter } from "expo-router";
import {
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

export default function NotFoundScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const isMobile = width < 600;

  // =========================================================
  // VAULT THEME COLORS
  // =========================================================

  const accent = theme.accent;
  const background = theme.background;
  const text = theme.text;
  const secondary = theme.textSecondary;

  const cardBackground = theme.backgroundElement;

  return (
    <SafeAreaView
      style={[
        styles.screen,
        {
          backgroundColor: background,
        },
      ]}
    >
      <Stack.Screen
        options={{
          headerShown: false,
          title: "Page not found",
        }}
      />

      {/* =====================================================
          SOLAR SYSTEM BACKGROUND
      ===================================================== */}

      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {/* Ambient Glow */}

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

        {/* ===================================================
            ORBITS
        =================================================== */}

        <View
          style={[
            styles.orbit,
            styles.orbit1,
            {
              borderColor: `${accent}28`,
            },
          ]}
        />

        <View
          style={[
            styles.orbit,
            styles.orbit2,
            {
              borderColor: `${accent}20`,
            },
          ]}
        />

        <View
          style={[
            styles.orbit,
            styles.orbit3,
            {
              borderColor: `${accent}18`,
            },
          ]}
        />

        <View
          style={[
            styles.orbit,
            styles.orbit4,
            {
              borderColor: `${accent}10`,
            },
          ]}
        />

        {/* ===================================================
            SMALL PLANETS
        =================================================== */}

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

        {/* ===================================================
            LARGE DECORATIVE PLANET
        =================================================== */}

        <View
          style={[
            styles.planetLarge,
            {
              borderColor: `${accent}45`,
              backgroundColor: `${accent}09`,
            },
          ]}
        >
          <View
            style={[
              styles.planetLargeInner,
              {
                backgroundColor: `${accent}10`,
              },
            ]}
          />

          <View
            style={[
              styles.planetLargeHighlight,
              {
                backgroundColor: `${accent}18`,
              },
            ]}
          />
        </View>

        {/* ===================================================
            STARS
        =================================================== */}

        <View
          style={[
            styles.star,
            {
              top: "14%",
              left: "13%",
              backgroundColor: accent,
            },
          ]}
        />

        <View
          style={[
            styles.starSmall,
            {
              top: "25%",
              right: "17%",
              backgroundColor: accent,
            },
          ]}
        />

        <View
          style={[
            styles.starSmall,
            {
              top: "43%",
              left: "8%",
              backgroundColor: accent,
            },
          ]}
        />

        <View
          style={[
            styles.star,
            {
              bottom: "24%",
              right: "13%",
              backgroundColor: accent,
            },
          ]}
        />

        <View
          style={[
            styles.starSmall,
            {
              bottom: "17%",
              left: "19%",
              backgroundColor: accent,
            },
          ]}
        />

        <View
          style={[
            styles.starSmall,
            {
              top: "11%",
              right: "30%",
              backgroundColor: accent,
            },
          ]}
        />

        <View
          style={[
            styles.starSmall,
            {
              bottom: "8%",
              left: "38%",
              backgroundColor: accent,
            },
          ]}
        />
      </View>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          isMobile && styles.scrollContentMobile,
        ]}
      >
        <View style={[styles.content, isMobile && styles.contentMobile]}>
          {/* =================================================
              BRAND
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
              404 PLANET
          ================================================= */}

          <View style={styles.errorPlanetWrapper}>
            {/* Glow */}

            <View
              style={[
                styles.errorPlanetGlow,
                {
                  backgroundColor: `${accent}0D`,
                },
              ]}
            />

            {/* Main Planet */}

            <View
              style={[
                styles.errorPlanet,
                {
                  backgroundColor: `${accent}0C`,
                  borderColor: `${accent}40`,
                  shadowColor: accent,
                },
              ]}
            >
              <View
                style={[
                  styles.errorPlanetInnerGlow,
                  {
                    backgroundColor: `${accent}08`,
                  },
                ]}
              />

              <Text
                style={[
                  styles.errorCode,
                  {
                    color: accent,
                  },
                ]}
              >
                404
              </Text>
            </View>

            {/* Ring */}

            <View
              style={[
                styles.errorRing,
                {
                  borderColor: `${accent}90`,
                },
              ]}
            />

            {/* Orbiting Dot */}

            <View
              style={[
                styles.orbitingPlanet,
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
            {/* =================================================
                LABEL
            ================================================= */}

            <View style={styles.labelRow}>
              <View
                style={[
                  styles.labelLine,
                  {
                    backgroundColor: `${accent}70`,
                  },
                ]}
              />

              <Text
                style={[
                  styles.label,
                  {
                    color: accent,
                  },
                ]}
              >
                PAGE NOT FOUND
              </Text>

              <View
                style={[
                  styles.labelLine,
                  {
                    backgroundColor: `${accent}70`,
                  },
                ]}
              />
            </View>

            {/* =================================================
                TITLE
            ================================================= */}

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
              Looks like you&#39;ve{"\n"}left our orbit
            </Text>

            {/* =================================================
                DESCRIPTION
            ================================================= */}

            <Text
              style={[
                styles.description,
                isMobile && styles.descriptionMobile,
                {
                  color: secondary,
                },
              ]}
            >
              The page you&#39;re looking for doesn&#39;t exist, may have been moved, or
              the link is incorrect.
            </Text>

            {/* =================================================
                ACTION BUTTONS
            ================================================= */}

            <View style={styles.actionsContainer}>
              {/* ===============================================
                  GO BACK HOME
              =============================================== */}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back home"
                onPress={() => router.replace("/")}
                style={({ pressed }) => [
                  styles.primaryButton,
                  {
                    backgroundColor: accent,
                    opacity: pressed ? 0.88 : 1,
                    transform: [
                      {
                        scale: pressed ? 0.985 : 1,
                      },
                    ],
                  },
                ]}
              >
                {/* Left Icon */}

                <View style={styles.buttonLeft}>
                  <Feather name="home" size={19} color="#FFFFFF" />
                </View>

                {/* Center Text */}

                <Text style={styles.primaryButtonText}>Go back home</Text>

                {/* Right Arrow */}

                <View style={styles.buttonRight}>
                  <Feather name="arrow-right" size={19} color="#FFFFFF" />
                </View>
              </Pressable>

              {/* ===============================================
                  EXPLORE VAULT
              =============================================== */}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Explore Vault"
                onPress={() => router.push("/subjects")}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  {
                    borderColor: `${accent}35`,
                    backgroundColor: `${accent}08`,
                    opacity: pressed ? 0.72 : 1,
                  },
                ]}
              >
                {/* Search Icon */}

                <View style={styles.buttonLeft}>
                  <Feather name="search" size={19} color={secondary} />
                </View>

                {/* Center Text */}

                <Text
                  style={[
                    styles.secondaryButtonText,
                    {
                      color: secondary,
                    },
                  ]}
                >
                  Explore Vault
                </Text>

                {/* Empty Right Spacer
                    keeps text perfectly centered */}

                <View style={styles.buttonRight} />
              </Pressable>
            </View>

            {/* =================================================
                SECURITY FOOTER
            ================================================= */}

            <View style={styles.securityRow}>
              <View
                style={[
                  styles.securityLine,
                  {
                    backgroundColor: `${secondary}35`,
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
                  STAY IN CONTROL
                </Text>
              </View>

              <View
                style={[
                  styles.securityLine,
                  {
                    backgroundColor: `${secondary}35`,
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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

  scrollContent: {
    flexGrow: 1,

    justifyContent: "center",
    alignItems: "center",

    paddingHorizontal: 24,
    paddingVertical: 36,
  },

  scrollContentMobile: {
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
  // BACKGROUND
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
  // ORBITS
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
  // PLANETS
  // =========================================================

  planet: {
    position: "absolute",

    borderRadius: 999,

    shadowOpacity: 0.6,
    shadowRadius: 12,

    elevation: 4,
  },

  planet1: {
    width: 11,
    height: 11,

    top: "19%",
    left: "18%",
  },

  planet2: {
    width: 7,
    height: 7,

    top: "33%",
    right: "13%",
  },

  planet3: {
    width: 9,
    height: 9,

    bottom: "19%",
    left: "22%",
  },

  // =========================================================
  // LARGE PLANET
  // =========================================================

  planetLarge: {
    position: "absolute",

    width: 100,
    height: 100,

    top: "8%",
    right: -48,

    borderRadius: 50,
    borderWidth: 1,

    alignItems: "center",
    justifyContent: "center",

    overflow: "hidden",
  },

  planetLargeInner: {
    width: 70,
    height: 70,

    borderRadius: 35,
  },

  planetLargeHighlight: {
    position: "absolute",

    width: 40,
    height: 40,

    borderRadius: 20,

    top: 10,
    left: 15,

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

    marginBottom: 22,
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
  // 404 PLANET
  // =========================================================

  errorPlanetWrapper: {
    width: 190,
    height: 155,

    alignItems: "center",
    justifyContent: "center",

    marginBottom: -24,

    zIndex: 3,
  },

  errorPlanetGlow: {
    position: "absolute",

    width: 170,
    height: 170,

    borderRadius: 85,
  },

  errorPlanet: {
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

  errorPlanetInnerGlow: {
    position: "absolute",

    width: 90,
    height: 90,

    top: -25,
    left: -15,

    borderRadius: 45,
  },

  errorCode: {
    fontSize: 42,

    fontWeight: "300",

    letterSpacing: -2,
  },

  errorRing: {
    position: "absolute",

    width: 180,
    height: 67,

    borderRadius: 100,
    borderWidth: 1,

    transform: [{ rotate: "-13deg" }],
  },

  orbitingPlanet: {
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
  // MAIN CARD
  // =========================================================

  card: {
    width: "100%",

    borderWidth: 1,
    borderRadius: 28,

    paddingHorizontal: 42,
    paddingTop: 50,
    paddingBottom: 25,

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
  // LABEL
  // =========================================================

  labelRow: {
    width: "100%",

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 12,

    marginBottom: 17,
  },

  labelLine: {
    width: 28,
    height: 1,
  },

  label: {
    fontSize: 10,

    fontWeight: "800",

    letterSpacing: 3,
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
  // ACTIONS
  // =========================================================

  actionsContainer: {
    width: "100%",
    maxWidth: 390,

    alignSelf: "center",

    marginTop: 27,

    gap: 12,
  },

  // =========================================================
  // PRIMARY BUTTON
  // =========================================================

  primaryButton: {
    position: "relative",

    width: "100%",
    height: 58,

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

  primaryButtonText: {
    color: "#FFFFFF",

    fontSize: 15,
    lineHeight: 20,

    fontWeight: "800",

    textAlign: "center",

    includeFontPadding: false,
  },

  // =========================================================
  // SECONDARY BUTTON
  // =========================================================

  secondaryButton: {
    position: "relative",

    width: "100%",
    height: 56,

    borderWidth: 1,
    borderRadius: 16,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 56,

    overflow: "hidden",
  },

  secondaryButtonText: {
    fontSize: 14,
    lineHeight: 20,

    fontWeight: "700",

    textAlign: "center",

    includeFontPadding: false,
  },

  // =========================================================
  // BUTTON ICON POSITIONING
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
  // SECURITY FOOTER
  // =========================================================

  securityRow: {
    width: "100%",

    marginTop: 25,

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
