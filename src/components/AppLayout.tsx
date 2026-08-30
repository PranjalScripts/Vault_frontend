import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  useWindowDimensions,
  ScrollView,
} from "react-native";
import { useRouter, usePathname } from "expo-router";
import { useTheme } from "@/hooks/use-theme";
import { logout } from "@/api/api";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export function AppLayout({
  children,
  title,
  subtitle,
  scrollable = true,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  scrollable?: boolean;
}) {
  const { width } = useWindowDimensions();
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const [mobileMenuVisible, setMobileMenuVisible] =
    React.useState(false);

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
      icon: "🏠",
    },
    {
      name: "Subjects",
      path: "/subjects",
      icon: "📗",
    },
    {
      name: "To Do",
      path: "/todos",
      icon: "✅",
    },
    {
      name: "Passcodes",
      path: "/passcodes",
      icon: "🔒",
    },
    {
      name: "Bookmarks",
      path: "/bookmarks",
      icon: "🔖",
    },
    {
      name: "Settings",
      path: "/settings",
      icon: "⚙️",
    },
  ];

  const bottomNavItems = [
    {
      name: "Home",
      path: "/subjects",
      icon: "🏠",
    },
    {
      name: "To Do",
      path: "/todos",
      icon: "✅",
    },
    {
      name: "Subjects",
      path: "/subjects",
      icon: "📗",
    },
    {
      name: "Passcodes",
      path: "/passcodes",
      icon: "🔒",
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

    try {
      router.replace(path as any);

      console.log("✅ NAVIGATION SENT:", path);
    } catch (error) {
      console.error(
        "❌ NAVIGATION ERROR:",
        error
      );
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
      console.error(
        "❌ Logout error:",
        error
      );

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
        {/* =================================================
            SIDEBAR
            ================================================= */}

        <View
          style={[
            styles.sidebar,
            {
              borderRightColor:
                theme.border,
              backgroundColor:
                theme.background,
            },
          ]}
        >
          {/* Logo */}

          <View
            style={styles.sidebarHeader}
          >
            <Text
              style={[
                styles.brandText,
                {
                  color: theme.text,
                },
              ]}
            >
              📗 Vault            </Text>
          </View>

          {/* Navigation */}

          <ScrollView
            style={styles.sidebarNav}
            showsVerticalScrollIndicator={
              false
            }
          >
            {navItems.map((item) => {
              const isActive =
                pathname === item.path ||
                pathname.startsWith(
                  item.path + "/"
                );

              return (
                <TouchableOpacity
                  key={item.name}
                  style={[
                    styles.navItem,
                    isActive && {
                      backgroundColor:
                        theme.accentMuted,
                    },
                  ]}
                  onPress={() =>
                    handleNav(
                      item.path
                    )
                  }
                  activeOpacity={0.7}
                >
                  <Text
                    style={
                      styles.navIcon
                    }
                  >
                    {item.icon}
                  </Text>

                  <Text
                    style={[
                      styles.navText,
                      {
                        color: isActive
                          ? theme.accent
                          : theme.textSecondary,

                        fontWeight:
                          isActive
                            ? "600"
                            : "400",
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

          <TouchableOpacity
            style={styles.logoutItem}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Text
              style={styles.navIcon}
            >
              ↪
            </Text>

            <Text
              style={[
                styles.navText,
                {
                  color:
                    theme.textSecondary,
                },
              ]}
            >
              Log out
            </Text>
          </TouchableOpacity>

          {/* Stay Organized */}

          <View
            style={[
              styles.stayOrganizedCard,
              {
                backgroundColor:
                  theme.backgroundElement,
              },
            ]}
          >
            <View
              style={
                styles.organizedIconWrap
              }
            >
              <Text
                style={
                  styles.organizedIcon
                }
              >
                🗂️
              </Text>
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
                  color:
                    theme.textSecondary,
                },
              ]}
            >
              Store your notes, links, PDFs
              and tasks in one place.
            </Text>
          </View>
        </View>

        {/* =================================================
            DESKTOP MAIN CONTENT
            ================================================= */}

        <View
          style={[
            styles.mainContent,
            {
              backgroundColor:
                theme.background,
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
                borderBottomColor:
                  theme.border,
              },
            ]}
          >
            <View
              style={styles.topbarRight}
            >
              <TouchableOpacity
                style={styles.iconBtn}
                activeOpacity={0.7}
              >
                <Text
                  style={styles.iconText}
                >
                  🔍
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.iconBtn}
                activeOpacity={0.7}
              >
                <Text
                  style={styles.iconText}
                >
                  🔔
                </Text>
              </TouchableOpacity>

              <View
                style={styles.profileBadge}
              >
                <View
                  style={styles.avatar}
                >
                  <Text
                    style={styles.avatarText}
                  >
                    P
                  </Text>
                </View>

                <Text
                  style={[
                    styles.profileName,
                    {
                      color: theme.text,
                    },
                  ]}
                >
                  Pranjal
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
              showsVerticalScrollIndicator={
                false
              }
            >
              {/* Page Header */}

              {title && (
                <View
                  style={
                    styles.pageHeader
                  }
                >
                  <Text
                    style={[
                      styles.pageTitle,
                      {
                        color:
                          theme.text,
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
                          color:
                            theme.textSecondary,
                        },
                      ]}
                    >
                      {subtitle}
                    </Text>
                  )}
                </View>
              )}

              {/* Normal Scrollable Children */}

              <View
                style={
                  styles.childrenContainer
                }
              >
                {children}
              </View>
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

            <View
              style={
                styles.desktopContentArea
              }
            >
              {/* Page Header */}

              {title && (
                <View
                  style={
                    styles.pageHeader
                  }
                >
                  <Text
                    style={[
                      styles.pageTitle,
                      {
                        color:
                          theme.text,
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
                          color:
                            theme.textSecondary,
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
                style={[
                  styles.childrenContainer,
                  styles.childrenContainerFlex,
                ]}
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
          backgroundColor:
            theme.background,
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
            backgroundColor:
              theme.background,

            borderBottomColor:
              theme.border,
          },
        ]}
      >
        <View
          style={styles.mobileHeader}
        >
          {/* Menu */}

          <TouchableOpacity
            style={styles.headerButton}
            onPress={() =>
              setMobileMenuVisible(
                true
              )
            }
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Open menu"
          >
            <Text
              style={[
                styles.headerIcon,
                {
                  color: theme.text,
                },
              ]}
            >
              ☰
            </Text>
          </TouchableOpacity>

          {/* Header Title */}

          <Text
            style={[
              styles.mobileHeaderTitle,
              {
                color: theme.text,
              },
            ]}
          >
            Vault          </Text>

          {/* Notification */}

          <TouchableOpacity
            style={styles.headerButton}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.headerIcon,
                {
                  color: theme.text,
                },
              ]}
            >
              🔔
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* =================================================
          MOBILE DRAWER
          ================================================= */}

      <Modal
        visible={mobileMenuVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() =>
          setMobileMenuVisible(
            false
          )
        }
      >
        <View
          style={styles.menuRoot}
        >
          {/* Drawer */}

          <View
            style={[
              styles.drawer,
              {
                width: Math.min(
                  width * 0.84,
                  340
                ),

                backgroundColor:
                  theme.backgroundElement,
              },
            ]}
          >
            <SafeAreaView
              edges={[
                "top",
                "bottom",
              ]}
              style={
                styles.drawerSafeArea
              }
            >
              {/* Profile */}

              <View
                style={[
                  styles.profileSection,
                  {
                    borderBottomColor:
                      theme.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.drawerAvatar,
                    {
                      backgroundColor:
                        theme.accent,
                    },
                  ]}
                >
                  <Text
                    style={
                      styles.drawerAvatarText
                    }
                  >
                    P
                  </Text>
                </View>

                <View
                  style={
                    styles.profileDetails
                  }
                >
                  <Text
                    style={[
                      styles.welcomeText,
                      {
                        color:
                          theme.text,
                      },
                    ]}
                  >
                    Welcome back 👋
                  </Text>

                  <Text
                    style={[
                      styles.drawerUserName,
                      {
                        color:
                          theme.text,
                      },
                    ]}
                  >
                    Pranjal
                  </Text>

                  <Text
                    style={[
                      styles.signedInText,
                      {
                        color:
                          theme.textSecondary,
                      },
                    ]}
                  >
                    You're signed in to
                    Vault
                  </Text>
                </View>

                <TouchableOpacity
                  style={
                    styles.drawerCloseButton
                  }
                  onPress={() =>
                    setMobileMenuVisible(
                      false
                    )
                  }
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Close menu"
                >
                  <Text
                    style={[
                      styles.drawerCloseText,
                      {
                        color:
                          theme.text,
                      },
                    ]}
                  >
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Navigation */}

              <ScrollView
                style={
                  styles.drawerScroll
                }
                contentContainerStyle={
                  styles.drawerScrollContent
                }
                showsVerticalScrollIndicator={
                  false
                }
              >
                {navItems.map((item) => {
                  const isActive =
                    pathname ===
                      item.path ||
                    pathname.startsWith(
                      item.path + "/"
                    );

                  return (
                    <TouchableOpacity
                      key={item.name}
                      style={[
                        styles.drawerNavItem,
                        isActive && {
                          backgroundColor:
                            theme.accentMuted,
                        },
                      ]}
                      onPress={() =>
                        handleNav(
                          item.path
                        )
                      }
                      activeOpacity={0.7}
                    >
                      <Text
                        style={
                          styles.drawerNavIcon
                        }
                      >
                        {item.icon}
                      </Text>

                      <Text
                        style={[
                          styles.drawerNavText,
                          {
                            color:
                              isActive
                                ? theme.accent
                                : theme.text,

                            fontWeight:
                              isActive
                                ? "600"
                                : "400",
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

              <View
                style={[
                  styles.drawerBottom,
                  {
                    borderTopColor:
                      theme.border,
                  },
                ]}
              >
                <TouchableOpacity
                  style={
                    styles.drawerLogout
                  }
                  onPress={
                    handleLogout
                  }
                  activeOpacity={0.7}
                >
                  <Text
                    style={
                      styles.drawerLogoutIcon
                    }
                  >
                    ↪
                  </Text>

                  <Text
                    style={
                      styles.drawerLogoutText
                    }
                  >
                    Log out
                  </Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </View>

          {/* Backdrop */}

          <TouchableOpacity
            style={styles.menuBackdrop}
            activeOpacity={1}
            onPress={() =>
              setMobileMenuVisible(
                false
              )
            }
            accessibilityLabel="Close menu"
          />
        </View>
      </Modal>

      {/* =================================================
          MOBILE MAIN CONTENT
          ================================================= */}

      <View
        style={styles.mobileMainContent}
      >
        {scrollable ? (
          <ScrollView
            style={styles.mobileScroll}
           
            showsVerticalScrollIndicator={
              false
            }
          >
            {/* Page Header */}

            {title && (
              <View
                style={
                  styles.pageHeader
                }
              >
                <Text
                  style={[
                    styles.pageTitle,
                    {
                      color:
                        theme.text,
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
                        color:
                          theme.textSecondary,
                      },
                    ]}
                  >
                    {subtitle}
                  </Text>
                )}
              </View>
            )}

            {/* Normal Scrollable Children */}

            <View
              style={
                styles.childrenContainer
              }
            >
              {children}
            </View>
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
              <View
                style={
                  styles.pageHeader
                }
              >
                <Text
                  style={[
                    styles.pageTitle,
                    {
                      color:
                        theme.text,
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
                        color:
                          theme.textSecondary,
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
              style={[
                styles.childrenContainer,
                styles.childrenContainerFlex,
              ]}
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
            backgroundColor:
              theme.background,

            borderTopColor:
              theme.border,
          },
        ]}
      >
        {bottomNavItems.map((item) => {
          const isActive =
            pathname === item.path ||
            pathname.startsWith(
              item.path + "/"
            );

          return (
            <TouchableOpacity
              key={item.name}
              style={
                styles.bottomNavItem
              }
              onPress={() =>
                handleNav(
                  item.path
                )
              }
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.bottomNavIcon,
                  {
                    color: isActive
                      ? theme.accent
                      : theme.textSecondary,
                  },
                ]}
              >
                {item.icon}
              </Text>

              <Text
                style={[
                  styles.bottomNavText,
                  {
                    color: isActive
                      ? theme.accent
                      : theme.textSecondary,
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
    width: 240,
    borderRightWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: 16,
    flexShrink: 0,
  },

  sidebarHeader: {
    marginBottom: 32,
    paddingHorizontal: 8,
  },

  brandText: {
    fontSize: 20,
    fontWeight: "700",
  },

  sidebarNav: {
    flex: 1,
  },

  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },

  logoutItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 8,
  },

  navIcon: {
    fontSize: 18,
    marginRight: 12,
  },

  navText: {
    fontSize: 15,
  },

  stayOrganizedCard: {
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 20,
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
    shadowColor: "#000",
    shadowOffset: {
      width: 4,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },

  drawerSafeArea: {
    flex: 1,
  },

  menuBackdrop: {
    flex: 1,
    backgroundColor:
      "rgba(0, 0, 0, 0.45)",
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
    fontSize: 19,
    marginRight: 10,
    textAlign: "center",
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
  },

  drawerLogoutIcon: {
    width: 30,
    fontSize: 21,
    marginRight: 10,
    textAlign: "center",
    color: "#E05252",
  },

  drawerLogoutText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#E05252",
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

  bottomNavIcon: {
    fontSize: 20,
    marginBottom: 4,
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

  iconText: {
    fontSize: 20,
  },
});