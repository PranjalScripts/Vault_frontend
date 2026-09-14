import { shadow } from "@/styles/shadow";
import React from "react";
import { NavigationIcon } from "./NavigationIcon";
import Feather from "@expo/vector-icons/Feather";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  useWindowDimensions,
  ScrollView,
  TextInput,
  Animated,
  Easing,
  Image,
} from "react-native";
import { useRouter, usePathname, useFocusEffect } from "expo-router";
import { useTheme } from "@/hooks/use-theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { logout, universalSearch, getAuthUser } from "@/api/api";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export function AppLayout({
  children,
  title,
  subtitle,
  mobileTitle,
  mobileHeaderActions,
  showMobileSearch = true,
  scrollable = true,
  contentBackgroundColor,
  mobileBackAction,
  desktopBreadcrumb,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  mobileTitle?: string;
  mobileHeaderActions?: React.ReactNode;
  showMobileSearch?: boolean;
  scrollable?: boolean;
  contentBackgroundColor?: string;
  mobileBackAction?: () => void;
  desktopBreadcrumb?: React.ReactNode;
}) {
  const { width } = useWindowDimensions();
  const theme = useTheme();
  const dark = useColorScheme() === "dark";
  const router = useRouter();
  const pathname = usePathname();
  useFocusEffect(
    React.useCallback(() => {
      if (
        typeof window === "undefined" ||
        typeof window.addEventListener !== "function" ||
        typeof window.removeEventListener !== "function"
      )
        return;
      const shortcut = (event: KeyboardEvent) => {
        if (
          (event.metaKey || event.ctrlKey) &&
          event.key.toLowerCase() === "k"
        ) {
          event.preventDefault();
          if (pathname !== "/search") router.push("/search" as never);
        }
      };
      window.addEventListener("keydown", shortcut);
      return () => window.removeEventListener("keydown", shortcut);
    }, [pathname, router]),
  );
  const insets = useSafeAreaInsets();

  const [mobileMenuVisible, setMobileMenuVisible] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [searchLoading, setSearchLoading] = React.useState(false);
  const [user, setUser] = React.useState<any>(null);

  // Animation for drawer slide-in from left
  const slideAnim = React.useRef(new Animated.Value(-Math.min(width * 0.84, 340))).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Fetch user data on mount
    const fetchUserData = async () => {
      try {
        const userData = await getAuthUser();
        setUser(userData);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUserData();
  }, []);

  React.useEffect(() => {
    if (mobileMenuVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -Math.min(width * 0.84, 340),
          duration: 250,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [mobileMenuVisible, slideAnim, fadeAnim, width]);

  React.useEffect(() => {
    const term = searchQuery.trim();
    if (term.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const response = await universalSearch(
          { q: term, kind: "all", page: 1, includePasscodes: true },
          controller.signal,
        );
        setSearchResults(response.data?.data || []);
      } catch {
        if (!controller.signal.aborted) setSearchResults([]);
      } finally {
        if (!controller.signal.aborted) setSearchLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  const handleSearchPress = () => setSearchOpen((open) => !open);

  const openSearchResult = (result: any) => {
    setSearchOpen(false);
    if (result.kind === "subject")
      router.push({ pathname: "/subjects/[id]", params: { id: result.id } });
    else if (result.kind === "topic")
      router.push({
        pathname: "/subjects/[id]/topic",
        params: { id: result.subjectId, topicId: result.id },
      });
    else if (result.kind === "todo")
      router.push({ pathname: "/todos", params: { itemId: result.id } });
    else if (result.kind === "passcode")
      router.push({ pathname: "/passcodes", params: { itemId: result.id } });
  };

  const searchModal = (
    <Modal
      visible={searchOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setSearchOpen(false)}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "flex-start",
          alignItems: "center",
          paddingTop: 96,
          paddingHorizontal: 20,
          backgroundColor: "rgba(0, 0, 0, 0.35)",
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 620,
            maxHeight: "75%",
            padding: 20,
            borderRadius: 14,
            backgroundColor: theme.backgroundElement,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Feather name="search" size={21} color={theme.textSecondary} />
            <TextInput
              autoFocus
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search everything..."
              placeholderTextColor={theme.textSecondary}
              accessibilityLabel="Global search"
              returnKeyType="search"
              style={{
                flex: 1,
                height: 44,
                paddingHorizontal: 12,
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 8,
                color: theme.text,
              }}
            />
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Close search"
              onPress={() => setSearchOpen(false)}
            >
              <Feather name="x" size={22} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
          {searchQuery.trim().length >= 2 && (
            <View style={{ marginTop: 16 }}>
              {searchLoading ? (
                <Text style={{ padding: 10, color: theme.textSecondary }}>
                  Searching...
                </Text>
              ) : searchResults.length ? (
                searchResults.slice(0, 8).map((result) => (
                  <TouchableOpacity
                    key={`${result.kind}:${result.id}`}
                    onPress={() => openSearchResult(result)}
                    style={{
                      padding: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: theme.border,
                    }}
                  >
                    <Text
                      numberOfLines={1}
                      style={{ color: theme.text, fontWeight: "600" }}
                    >
                      {result.title}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{ color: theme.textSecondary, fontSize: 12 }}
                    >
                      {result.kind}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={{ padding: 10, color: theme.textSecondary }}>
                  No matches found
                </Text>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  /*
   * =========================================================
   * RESPONSIVE BREAKPOINT
   * =========================================================
   */

  const isDesktop = width >= 768;

  /*
   * =========================================================
   * NAVIGATION ITEMS
   * =========================================================
   */

  const navItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
    },
    {
      name: "Subjects",
      path: "/subjects",
    },
    {
      name: "To Do",
      path: "/todos",
    },
    {
      name: "Passcodes",
      path: "/passcodes",
    },

    { name: "WhatsApp", path: "/whatsapp" },
    { name: "Recently Deleted", path: "/trash" },
    { name: "Settings", path: "/settings" },
  ];

  const bottomNavItems = [
    {
      name: "Home",
      path: "/dashboard",
    },
    {
      name: "To Do",
      path: "/todos",
    },
    {
      name: "Subjects",
      path: "/subjects",
    },
    {
      name: "Passcodes",
      path: "/passcodes",
    },
  ];

  /*
   * =========================================================
   * NAVIGATION
   * =========================================================
   */

  const handleNav = (path: string) => {
    console.log("👉 NAVIGATION CLICKED:", path);

    setMobileMenuVisible(false);

    if (path === "#") {
      return;
    }

    if (pathname === path || pathname.startsWith(`${path}/`)) {
      return;
    }

    try {
      router.replace(path as any);

      console.log("✅ NAVIGATION SENT:", path);
    } catch (error) {
      console.error("❌ NAVIGATION ERROR:", error);
    }
  };

  /*
   * =========================================================
   * LOGOUT
   * =========================================================
   */

  const handleLogout = async () => {
    try {
      console.log("🚪 Logging out...");

      setMobileMenuVisible(false);

      await logout();

      console.log("✅ Logout successful");

      router.replace("/");
    } catch (error) {
      console.error("❌ Logout error:", error);

      router.replace("/");
    }
  };

  /*
   * =========================================================
   * DESKTOP LAYOUT
   * =========================================================
   */

  if (isDesktop) {
    return (
      <SafeAreaView
        edges={["top", "bottom"]}
        style={[
          styles.desktopContainer,
          {
            backgroundColor: theme.background,
          },
        ]}
      >
        {searchModal}
        {/* =================================================
            SIDEBAR
            ================================================= */}

        <View
          style={[
            styles.sidebar,
            {
              borderRightColor: theme.border,
              backgroundColor: theme.background,
            },
          ]}
        >
          {/* Logo */}

          <View style={styles.sidebarHeader}>
            <View
              style={[styles.brandMark, { backgroundColor: theme.accentMuted }]}
            >
              <Image
                source={require("@/assets/images/adaptive-icon.png")}
                style={styles.brandLogo}
                resizeMode="contain"
              />
            </View>
            <View>
              <Text style={[styles.brandText, { color: theme.text }]}>
                Vault
              </Text>
              <Text
                style={[styles.brandCaption, { color: theme.textSecondary }]}
              >
                Personal workspace
              </Text>
            </View>
          </View>

          {/* Navigation */}

          <ScrollView
            style={styles.sidebarNav}
            contentContainerStyle={styles.sidebarNavContent}
            showsVerticalScrollIndicator={false}
          >
            <Text
              style={[styles.navSectionLabel, { color: theme.textSecondary }]}
            >
              WORKSPACE
            </Text>
            {navItems.map((item) => {
              const isActive =
                pathname === item.path || pathname.startsWith(item.path + "/");

              return (
                <TouchableOpacity
                  key={item.name}
                  style={[
                    styles.navItem,
                    isActive && {
                      backgroundColor: theme.accentMuted,
                      borderColor: `${theme.accent}22`,
                    },
                  ]}
                  onPress={() => handleNav(item.path)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.navIconWrap,
                      isActive && { backgroundColor: theme.backgroundElement },
                    ]}
                  >
                    <NavigationIcon path={item.path}
                      size={22}
                      color={isActive ? theme.accent : theme.textSecondary}
                    />
                  </View>

                  <Text
                    style={[
                      styles.navText,
                      {
                        color: isActive ? theme.accent : theme.textSecondary,

                        fontWeight: isActive ? "600" : "400",
                      },
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Stay Organized */}

          <View
            style={[
              styles.stayOrganizedCard,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.organizedIconWrap}>
              <Text style={styles.organizedIcon}>🗂️</Text>
            </View>

            <Text
              style={[
                styles.organizedTitle,
                {
                  color: theme.text,
                },
              ]}
            >
              Stay organized
            </Text>

            <Text
              style={[
                styles.organizedDesc,
                {
                  color: theme.textSecondary,
                },
              ]}
            >
              Store your notes, links, PDFs and tasks in one place.
            </Text>
          </View>

          {/* Logout */}

          <TouchableOpacity
            style={[
              styles.logoutItem,
              {
                backgroundColor: `${theme.danger}0C`,
                borderColor: `${theme.danger}22`,
              },
            ]}
            onPress={handleLogout}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Log out of Vault"
          >
            <View
              style={[
                styles.logoutIconWrap,
                { backgroundColor: `${theme.danger}14` },
              ]}
            >
              <Text style={[styles.logoutIcon, { color: theme.danger }]}>
                ↪
              </Text>
            </View>
            <View style={styles.logoutCopy}>
              <Text style={[styles.logoutText, { color: theme.danger }]}>
                Log out
              </Text>
              <Text style={[styles.logoutHint, { color: theme.textSecondary }]}>
                End this session
              </Text>
            </View>
            <Text style={[styles.logoutChevron, { color: theme.danger }]}>
              ›
            </Text>
          </TouchableOpacity>
        </View>

        {/* =================================================
            DESKTOP MAIN CONTENT
            ================================================= */}

        <View
          style={[
            styles.mainContent,
            {
              backgroundColor: contentBackgroundColor || theme.background,
            },
          ]}
        >
          {/* =================================================
              TOP BAR
              ================================================= */}

          <View
            style={[
              styles.topbar,
              {
                borderBottomColor: theme.border,
              },
            ]}
          >
            {desktopBreadcrumb && (
              <View style={{ flex: 1, minWidth: 0 }}>{desktopBreadcrumb}</View>
            )}
            <View style={styles.topbarRight}>
              <TouchableOpacity
                style={styles.iconBtn}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Search everything"
                onPress={handleSearchPress}
              >
                <Text style={styles.iconText}>🔍</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
                <Text style={styles.iconText}>🔔</Text>
              </TouchableOpacity>

              <View style={styles.profileBadge}>
                {user?.picture ? (
                  <Image
                    source={{ uri: user.picture }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </Text>
                  </View>
                )}

                <Text
                  style={[
                    styles.profileName,
                    {
                      color: theme.text,
                    },
                  ]}
                >
                  {user?.name || "User"}
                </Text>
              </View>
            </View>
          </View>

          {/* =================================================
              DESKTOP PAGE CONTENT
              ================================================= */}

          {scrollable ? (
            <ScrollView
              style={styles.desktopScroll}
              contentContainerStyle={[
                styles.desktopScrollContent,
                {
                  paddingBottom: 40,
                },
              ]}
              showsVerticalScrollIndicator={false}
            >
              {/* Page Header */}

              {title && (
                <View style={styles.pageHeader}>
                  <Text
                    style={[
                      styles.pageTitle,
                      {
                        color: theme.text,
                      },
                    ]}
                  >
                    {title}
                  </Text>

                  {subtitle && (
                    <Text
                      style={[
                        styles.pageSubtitle,
                        {
                          color: theme.textSecondary,
                        },
                      ]}
                    >
                      {subtitle}
                    </Text>
                  )}
                </View>
              )}

              {/* Normal Scrollable Children */}

              <View style={styles.childrenContainer}>{children}</View>
            </ScrollView>
          ) : (
            /*
             * IMPORTANT:
             *
             * This page does NOT use the outer ScrollView.
             *
             * The children receive flex: 1.
             *
             * This is required for pages like Todos
             * which contain a FlatList.
             */

            <View style={styles.desktopContentArea}>
              {/* Page Header */}

              {title && (
                <View style={styles.pageHeader}>
                  <Text
                    style={[
                      styles.pageTitle,
                      {
                        color: theme.text,
                      },
                    ]}
                  >
                    {title}
                  </Text>

                  {subtitle && (
                    <Text
                      style={[
                        styles.pageSubtitle,
                        {
                          color: theme.textSecondary,
                        },
                      ]}
                    >
                      {subtitle}
                    </Text>
                  )}
                </View>
              )}

              {/* FLEX CHILDREN */}

              <View
                style={[styles.childrenContainer, styles.childrenContainerFlex]}
              >
                {children}
              </View>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  /*
   * =========================================================
   * MOBILE LAYOUT
   * =========================================================
   */

  return (
    <View
      style={[
        styles.mobileContainer,
        {
          backgroundColor: theme.background,
        },
      ]}
    >
      {/* =================================================
          MOBILE HEADER
          ================================================= */}

      <SafeAreaView
        edges={["top"]}
        style={[
          styles.mobileHeaderSafeArea,
          {
            backgroundColor: contentBackgroundColor || theme.background,

            borderBottomColor: theme.border,
          },
        ]}
      >
        {searchModal}
        <View style={styles.mobileHeader}>
          {/* Menu */}

          <TouchableOpacity
            style={styles.headerButton}
            onPress={mobileBackAction || (() => setMobileMenuVisible(true))}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={
              mobileBackAction ? "Back to subjects" : "Open menu"
            }
          >
            <Text
              style={[
                styles.headerIcon,
                {
                  color: theme.text,
                },
              ]}
            >
              {mobileBackAction ? "‹" : "☰"}
            </Text>
          </TouchableOpacity>

          {/* Header Title */}

          <Text
            numberOfLines={1}
            style={[
              styles.mobileHeaderTitle,
              { pointerEvents: "none" },
              {
                color: theme.text,
              },
            ]}
          >
            {mobileTitle || "Vault"}
          </Text>

          {/* Page actions / notification */}

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {showMobileSearch && (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Search everything"
                style={styles.headerButton}
                onPress={handleSearchPress}
              >
                <Feather name="search" size={21} color={theme.text} />
              </TouchableOpacity>
            )}
            {mobileHeaderActions || (
              <TouchableOpacity style={styles.headerButton} activeOpacity={0.7}>
                <Text style={[styles.headerIcon, { color: theme.text }]}>
                  🔔
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>

      {/* =================================================
          MOBILE DRAWER
          ================================================= */}

      <Modal
        visible={mobileMenuVisible}
        transparent={true}
        animationType="none"
        onRequestClose={() => setMobileMenuVisible(false)}
      >
        <View style={styles.menuRoot}>
          {/* Drawer */}

          <Animated.View
            style={[
              styles.drawer,
              {
                width: Math.min(width * 0.84, 340),
                backgroundColor: theme.backgroundElement,
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            <SafeAreaView
              edges={["top", "bottom"]}
              style={styles.drawerSafeArea}
            >
              {/* Profile */}

              <View
                style={[
                  styles.profileSection,
                  {
                    borderBottomColor: theme.border,
                  },
                ]}
              >
                {user?.picture ? (
                  <Image
                    source={{ uri: user.picture }}
                    style={[
                      styles.drawerAvatar,
                      {
                        backgroundColor: "transparent",
                      },
                    ]}
                  />
                ) : (
                  <View
                    style={[
                      styles.drawerAvatar,
                      {
                        backgroundColor: theme.accent,
                      },
                    ]}
                  >
                    <Text style={styles.drawerAvatarText}>{user?.name?.charAt(0)?.toUpperCase() || "U"}</Text>
                  </View>
                )}

                <View style={styles.profileDetails}>
            
                  <Text
                    style={[
                      styles.drawerUserName,
                      {
                        color: theme.text,
                      },
                    ]}
                  >
                    {user?.name || "User"}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.drawerCloseButton}
                  onPress={() => setMobileMenuVisible(false)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Close menu"
                >
                  <Text
                    style={[
                      styles.drawerCloseText,
                      {
                        color: theme.text,
                      },
                    ]}
                  >
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Navigation */}

              <ScrollView
                style={styles.drawerScroll}
                contentContainerStyle={styles.drawerScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {navItems.map((item) => {
                  const isActive =
                    pathname === item.path ||
                    pathname.startsWith(item.path + "/");

                  return (
                    <TouchableOpacity
                      key={item.name}
                      style={[
                        styles.drawerNavItem,
                        isActive && {
                          backgroundColor: theme.accentMuted,
                        },
                      ]}
                      onPress={() => handleNav(item.path)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.drawerNavIcon}>
                        <NavigationIcon path={item.path}
                          size={22}
                          color={isActive ? theme.accent : theme.textSecondary}
                        />
                      </View>

                      <Text
                        style={[
                          styles.drawerNavText,
                          {
                            color: isActive ? theme.accent : theme.text,

                            fontWeight: isActive ? "600" : "400",
                          },
                        ]}
                      >
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Logout */}

              {pathname !== "/settings" && (
                <View
                  style={[
                    styles.drawerBottom,
                    {
                      borderTopColor: theme.border,
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.drawerLogout,
                      {
                        backgroundColor: `${theme.danger}0C`,
                        borderColor: `${theme.danger}22`,
                      },
                    ]}
                    onPress={handleLogout}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.drawerLogoutIconWrap,
                        { backgroundColor: `${theme.danger}14` },
                      ]}
                    >
                      <Text
                        style={[
                          styles.drawerLogoutIcon,
                          { color: theme.danger },
                        ]}
                      >
                        ↪
                      </Text>
                    </View>
                    <View style={styles.logoutCopy}>
                      <Text
                        style={[
                          styles.drawerLogoutText,
                          { color: theme.danger },
                        ]}
                      >
                        Log out
                      </Text>
                      <Text
                        style={[
                          styles.logoutHint,
                          { color: theme.textSecondary },
                        ]}
                      >
                        End this session
                      </Text>
                    </View>
                    <Text
                      style={[styles.logoutChevron, { color: theme.danger }]}
                    >
                      ›
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </SafeAreaView>
          </Animated.View>

          {/* Backdrop */}

          <Animated.View style={[styles.menuBackdrop, { opacity: fadeAnim }]}>
            <TouchableOpacity
              style={styles.menuBackdropTouchable}
              activeOpacity={1}
              onPress={() => setMobileMenuVisible(false)}
              accessibilityLabel="Close menu"
            />
          </Animated.View>
        </View>
      </Modal>

      {/* =================================================
          MOBILE MAIN CONTENT
          ================================================= */}

      <View
        style={[
          styles.mobileMainContent,
          { backgroundColor: contentBackgroundColor || theme.background },
        ]}
      >
        {scrollable ? (
          <ScrollView
            style={styles.mobileScroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Page Header */}

            {title && (
              <View style={styles.pageHeader}>
                <Text
                  style={[
                    styles.pageTitle,
                    {
                      color: theme.text,
                    },
                  ]}
                >
                  {title}
                </Text>

                {subtitle && (
                  <Text
                    style={[
                      styles.pageSubtitle,
                      {
                        color: theme.textSecondary,
                      },
                    ]}
                  >
                    {subtitle}
                  </Text>
                )}
              </View>
            )}

            {/* Normal Scrollable Children */}

            <View style={styles.childrenContainer}>{children}</View>
          </ScrollView>
        ) : (
          /*
           * IMPORTANT:
           *
           * No ScrollView here.
           *
           * The child FlatList receives
           * the complete available height.
           */

          <View
            style={[
              styles.mobileContentArea,
              {
                paddingBottom: insets.bottom,
              },
            ]}
          >
            {/* Page Header */}

            {title && (
              <View style={styles.pageHeader}>
                <Text
                  style={[
                    styles.pageTitle,
                    {
                      color: theme.text,
                    },
                  ]}
                >
                  {title}
                </Text>

                {subtitle && (
                  <Text
                    style={[
                      styles.pageSubtitle,
                      {
                        color: theme.textSecondary,
                      },
                    ]}
                  >
                    {subtitle}
                  </Text>
                )}
              </View>
            )}

            {/* FLEX CHILDREN */}

            <View
              style={[styles.childrenContainer, styles.childrenContainerFlex]}
            >
              {children}
            </View>
          </View>
        )}
      </View>

      {/* =================================================
          MOBILE BOTTOM NAVIGATION
          ================================================= */}

      <SafeAreaView
        edges={["bottom"]}
        style={[
          styles.bottomNav,
          {
            backgroundColor: dark ? theme.background : theme.backgroundElement,

            borderTopColor: theme.border,
          },
        ]}
      >
        {bottomNavItems.map((item) => {
          const isActive =
            pathname === item.path || pathname.startsWith(item.path + "/");

          return (
            <TouchableOpacity
              key={item.name}
              style={styles.bottomNavItem}
              onPress={() => handleNav(item.path)}
              activeOpacity={0.7}
            >
              <NavigationIcon path={item.path}
                size={22}
                color={isActive ? theme.accent : theme.textSecondary}
                style={{ marginBottom: 4 }}
              />

              <Text
                style={[
                  styles.bottomNavText,
                  {
                    color: isActive ? theme.accent : theme.textSecondary,
                  },
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </SafeAreaView>
    </View>
  );
}

/*
 * =========================================================
 * STYLES
 * =========================================================
 */

const styles = StyleSheet.create({
  /*
   * ========================================================
   * DESKTOP
   * ========================================================
   */

  desktopContainer: {
    flex: 1,
    flexDirection: "row",
  },

  sidebar: {
    width: 248,
    borderRightWidth: 1,
    paddingTop: 22,
    paddingBottom: 16,
    paddingHorizontal: 14,
    flexShrink: 0,
  },

  sidebarHeader: {
    marginBottom: 28,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  brandMark: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  brandMarkText: {
    fontSize: 19,
    fontWeight: "900",
  },

  brandText: {
    fontSize: 21,
    lineHeight: 24,
    fontWeight: "800",
    letterSpacing: -0.4,
  },

  brandCaption: {
    fontSize: 10,
    marginTop: 2,
    letterSpacing: 0.2,
  },

  sidebarNav: {
    flex: 1,
  },

  sidebarNavContent: { paddingBottom: 12 },

  navSectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginLeft: 11,
    marginBottom: 10,
  },

  navItem: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 50,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "transparent",
  },

  logoutItem: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 58,
    paddingVertical: 8,
    paddingHorizontal: 9,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
  },

  navIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  navIcon: {
    fontSize: 16,
  },

  navText: {
    fontSize: 15,
  },

  stayOrganizedCard: {
    padding: 14,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 12,
    borderWidth: 1,
  },

  organizedIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E6F4EA",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  organizedIcon: {
    fontSize: 24,
  },

  organizedTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },

  organizedDesc: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },

  logoutIconWrap: {
    width: 35,
    height: 35,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  logoutIcon: { fontSize: 18, fontWeight: "700" },
  logoutCopy: { flex: 1, minWidth: 0 },
  logoutText: { fontSize: 13, fontWeight: "700" },
  logoutHint: { fontSize: 10, marginTop: 2 },
  logoutChevron: { fontSize: 22, marginLeft: 6 },

  /*
   * ========================================================
   * MAIN CONTENT
   * ========================================================
   */

  mainContent: {
    flex: 1,
    minWidth: 0,
    width: 0,
  },

  topbar: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    flexShrink: 0,
  },

  topbarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },

  profileBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#145A32",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },

  avatarText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  profileName: {
    fontSize: 14,
    fontWeight: "500",
  },

  /*
   * ========================================================
   * DESKTOP SCROLLABLE CONTENT
   * ========================================================
   */

  desktopScroll: {
    flex: 1,
    width: "100%",
  },

  desktopScrollContent: {
    width: "100%",
    paddingHorizontal: 32,
    paddingTop: 30,
    paddingBottom: 40,
  },

  /*
   * ========================================================
   * DESKTOP NON-SCROLLABLE PARENT
   *
   * IMPORTANT FOR FLATLIST
   * ========================================================
   */

  desktopContentArea: {
    flex: 1,
    width: "100%",
    minHeight: 0,
    paddingHorizontal: 32,
    paddingTop: 30,
    paddingBottom: 40,
  },

  /*
   * ========================================================
   * MOBILE
   * ========================================================
   */

  mobileContainer: {
    flex: 1,
  },

  mobileHeaderSafeArea: {
    borderBottomWidth: 1,
    flexShrink: 0,
  },

  mobileHeader: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },

  headerButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  headerIcon: {
    fontSize: 22,
  },

  mobileHeaderTitle: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 8,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
  },

  mobileMainContent: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
  },

  mobileScroll: {
    flex: 1,
    width: "100%",
  },

  /*
   * ========================================================
   * MOBILE NON-SCROLLABLE CONTENT
   *
   * IMPORTANT FOR FLATLIST
   * ========================================================
   */

  mobileContentArea: {
    flex: 1,
    width: "100%",
    minHeight: 0,
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  /*
   * ========================================================
   * CHILDREN
   * ========================================================
   */

  childrenContainer: {
    width: "100%",
    alignSelf: "stretch",
    flexShrink: 0,
  },

  /*
   * THIS IS THE IMPORTANT NEW STYLE.
   *
   * FlatList needs a bounded height.
   */

  childrenContainerFlex: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    alignSelf: "stretch",
  },

  /*
   * ========================================================
   * PAGE HEADER
   * ========================================================
   */

  pageHeader: {
    marginBottom: 24,
    width: "100%",
    flexShrink: 0,
  },

  pageTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },

  pageSubtitle: {
    fontSize: 15,
  },

  /*
   * ========================================================
   * MOBILE DRAWER
   * ========================================================
   */

  menuRoot: {
    flex: 1,
    flexDirection: "row",
  },

  drawer: {
    height: "100%",
    alignSelf: "stretch",
    elevation: 20,
    ...shadow({ opacity: 0.25, radius: 12, x: 4, y: 0 }),
  },

  drawerSafeArea: {
    flex: 1,
  },

  menuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },

  menuBackdropTouchable: {
    flex: 1,
  },

  /*
   * ========================================================
   * DRAWER PROFILE
   * ========================================================
   */

  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },

  drawerAvatar: {
    width: 52,
    height: 52,
    minWidth: 52,
    minHeight: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  drawerAvatarText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },

  profileDetails: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
  },

  welcomeText: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 3,
  },

  drawerUserName: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 2,
  },

  signedInText: {
    fontSize: 12,
  },

  drawerCloseButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },

  drawerCloseText: {
    fontSize: 21,
  },

  /*
   * ========================================================
   * DRAWER NAVIGATION
   * ========================================================
   */

  drawerScroll: {
    flex: 1,
  },

  drawerScrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },

  drawerNavItem: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 5,
  },

  drawerNavIcon: {
    width: 30,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  drawerNavText: {
    fontSize: 15,
  },

  /*
   * ========================================================
   * DRAWER LOGOUT
   * ========================================================
   */

  drawerBottom: {
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
  },

  drawerLogout: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },

  drawerLogoutIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  drawerLogoutIcon: {
    fontSize: 18,
    fontWeight: "700",
  },

  drawerLogoutText: {
    fontSize: 13,
    fontWeight: "700",
  },

  /*
   * ========================================================
   * MOBILE CONTENT
   * ========================================================
   */

  mobileContent: {
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },

  /*
   * ========================================================
   * BOTTOM NAVIGATION
   * ========================================================
   */

  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    minHeight: 60,
    borderTopWidth: 1,
    paddingTop: 6,
    flexShrink: 0,
  },

  bottomNavItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    minHeight: 48,
  },

  bottomNavText: {
    fontSize: 11,
    fontWeight: "500",
  },

  /*
   * ========================================================
   * GENERAL ICONS
   * ========================================================
   */

  iconBtn: {
    padding: 8,
  },
  brandLogo: {
    width: 42,
    height: 42,
    borderRadius: 10,
  },
  iconText: {
    fontSize: 20,
  },
});
