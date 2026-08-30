import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import Toast from "react-native-toast-message";
import { useFocusEffect } from "expo-router";

import { AppLayout } from "@/components/AppLayout";
import {
  getPasscodes,
  createPasscode,
  updatePasscode,
  deletePasscode,
} from "@/api/api";
import { useTheme } from "@/hooks/use-theme";

type Passcode = {
  _id: string;
  platform: string;
  username: string;
  password?: string;
  securityAnswer?: string;
  updatedAt?: string;
  srNo?: number;
};

type SortOption =
  | "newest"
  | "oldest"
  | "az"
  | "za";

const DEFAULT_PAGE_SIZE = 20;

export default function PasscodesScreen() {
  const theme = useTheme();

  // =====================================================
  // STATE
  // =====================================================

  const [passcodes, setPasscodes] = useState<Passcode[]>(
    []
  );

  const [platform, setPlatform] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [showForm, setShowForm] =
    useState(false);

  const [revealedIds, setRevealedIds] =
    useState<Set<string>>(new Set());

  const [copiedField, setCopiedField] =
    useState<string | null>(null);

  const [editingPasscode, setEditingPasscode] =
    useState<Passcode | null>(null);

  const [editUsername, setEditUsername] =
    useState("");

  const [editPassword, setEditPassword] =
    useState("");

  const [deleteConfirmId, setDeleteConfirmId] =
    useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [sortOption, setSortOption] =
    useState<SortOption>("newest");

  const [showSortOptions, setShowSortOptions] =
    useState(false);

  // =====================================================
  // PAGINATION STATE
  // =====================================================

  const [page, setPage] = useState(1);

  const [pageSize] =
    useState(DEFAULT_PAGE_SIZE);

  const [totalPages, setTotalPages] =
    useState(1);

  const [totalRecords, setTotalRecords] =
    useState(0);

  const [hasNextPage, setHasNextPage] =
    useState(false);

  const [hasPreviousPage, setHasPreviousPage] =
    useState(false);

  const [initialLoadDone, setInitialLoadDone] =
    useState(false);

  // =====================================================
  // FETCH PAGE
  // =====================================================

  const fetchPage = useCallback(
    async (
      requestedPage: number,
      requestedPageSize: number,
      searchValue: string,
      requestedSort: SortOption
    ) => {
      try {
        setLoading(true);

        const response =
          await getPasscodes({
            page: requestedPage,
            limit: requestedPageSize,
            search: searchValue.trim(),
            sort: requestedSort,
          });

        const data: Passcode[] =
          response?.data?.data || [];

        const pagination =
          response?.data?.pagination;

        setPasscodes(data);

        const returnedPage =
          pagination?.page ??
          requestedPage;

        const returnedLimit =
          pagination?.limit ??
          requestedPageSize;

        const returnedTotal =
          pagination?.total ?? 0;

        const returnedTotalPages =
          pagination?.totalPages ??
          Math.max(
            1,
            Math.ceil(
              returnedTotal /
                returnedLimit
            )
          );

        setPage(returnedPage);

        setTotalRecords(
          returnedTotal
        );

        setTotalPages(
          returnedTotalPages
        );

        setHasNextPage(
          pagination?.hasNextPage ??
            returnedPage <
              returnedTotalPages
        );

        setHasPreviousPage(
          pagination?.hasPreviousPage ??
            returnedPage > 1
        );

        setInitialLoadDone(true);
      } catch (error) {
        console.log(
          "GET PASSCODES ERROR:",
          error
        );

        Toast.show({
          type: "error",
          text1: "Unable to load passcodes",
          text2: "Please try again.",
        });
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // =====================================================
  // INITIAL / FOCUS LOAD
  // =====================================================

  useFocusEffect(
    useCallback(() => {
      fetchPage(
        1,
        pageSize,
        search,
        sortOption
      );
    }, [
      fetchPage,
      pageSize,
      search,
      sortOption,
    ])
  );

  // =====================================================
  // SEARCH
  // =====================================================

  useEffect(() => {
    if (!initialLoadDone) {
      return;
    }

    const timer = setTimeout(() => {
      fetchPage(
        1,
        pageSize,
        search,
        sortOption
      );
    }, 350);

    return () =>
      clearTimeout(timer);
  }, [
    search,
    initialLoadDone,
    fetchPage,
    pageSize,
    sortOption,
  ]);

  // =====================================================
  // GO TO PREVIOUS PAGE
  // =====================================================

  const goToPreviousPage = async () => {
    if (
      loading ||
      !hasPreviousPage ||
      page <= 1
    ) {
      return;
    }

    await fetchPage(
      page - 1,
      pageSize,
      search,
      sortOption
    );
  };

  // =====================================================
  // GO TO NEXT PAGE
  // =====================================================

  const goToNextPage = async () => {
    if (
      loading ||
      !hasNextPage ||
      page >= totalPages
    ) {
      return;
    }

    await fetchPage(
      page + 1,
      pageSize,
      search,
      sortOption
    );
  };

  // =====================================================
  // SORT LABEL
  // =====================================================

  const sortLabel = useMemo(() => {
    switch (sortOption) {
      case "oldest":
        return "Oldest";

      case "az":
        return "Platform A–Z";

      case "za":
        return "Platform Z–A";

      case "newest":
      default:
        return "Newest";
    }
  }, [sortOption]);

  // =====================================================
  // CREATE
  // =====================================================

  const handleCreate = async () => {
    if (
      !platform.trim() ||
      !username.trim() ||
      !password
    ) {
      Toast.show({
        type: "info",
        text1: "Missing fields",
        text2:
          "Please enter platform, username and password.",
      });

      return;
    }

    try {
      setCreating(true);

      const savedPlatform =
        platform.trim();

      await createPasscode({
        platform: savedPlatform,
        username: username.trim(),
        password,
      });

      setPlatform("");
      setUsername("");
      setPassword("");

      setShowForm(false);

      await fetchPage(
        1,
        pageSize,
        search,
        sortOption
      );

      Toast.show({
        type: "success",
        text1: "Passcode saved",
        text2:
          `${savedPlatform} was added successfully.`,
      });
    } catch (error) {
      console.log(
        "CREATE PASSCODE ERROR:",
        error
      );

      Toast.show({
        type: "error",
        text1: "Save failed",
        text2:
          "Unable to save passcode.",
      });
    } finally {
      setCreating(false);
    }
  };

  // =====================================================
  // CANCEL CREATE
  // =====================================================

  const cancelCreate = () => {
    setPlatform("");
    setUsername("");
    setPassword("");

    setShowForm(false);
  };

  // =====================================================
  // EDIT
  // =====================================================

  const handleEdit = (
    item: Passcode
  ) => {
    setEditingPasscode(item);

    setEditUsername(
      item.username
    );

    setEditPassword(
      item.password || ""
    );
  };

  // =====================================================
  // UPDATE
  // =====================================================

  const handleUpdate = async () => {
    if (!editingPasscode) {
      return;
    }

    if (
      !editUsername.trim() ||
      !editPassword.trim()
    ) {
      Toast.show({
        type: "info",
        text1: "Missing fields",
        text2:
          "Username and password are required.",
      });

      return;
    }

    try {
      setUpdating(true);

      const response =
        await updatePasscode(
          editingPasscode._id,
          {
            username:
              editUsername.trim(),

            password:
              editPassword,
          }
        );

      const updated =
        response?.data?.data;

      if (updated) {
        setPasscodes((current) =>
          current.map((item) =>
            item._id ===
            editingPasscode._id
              ? updated
              : item
          )
        );
      }

      setEditingPasscode(null);

      setEditUsername("");
      setEditPassword("");

      Toast.show({
        type: "success",
        text1: "Passcode updated",
        text2:
          "Your credentials updated successfully.",
      });
    } catch (error) {
      console.log(
        "UPDATE PASSCODE ERROR:",
        error
      );

      Toast.show({
        type: "error",
        text1: "Update failed",
        text2:
          "Unable to update passcode.",
      });
    } finally {
      setUpdating(false);
    }
  };

  // =====================================================
  // DELETE
  // =====================================================

  const handleDelete = (
    id: string
  ) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) {
      return;
    }

    try {
      setDeleting(true);

      await deletePasscode(
        deleteConfirmId
      );

      const targetPage =
        page > 1 &&
        passcodes.length === 1
          ? page - 1
          : page;

      setDeleteConfirmId(null);

      await fetchPage(
        targetPage,
        pageSize,
        search,
        sortOption
      );

      Toast.show({
        type: "success",
        text1: "Passcode deleted",
        text2:
          "The passcode was removed successfully.",
      });
    } catch (error: any) {
      console.log(
        "DELETE PASSCODE ERROR:",
        error?.response?.data ||
          error
      );

      Toast.show({
        type: "error",
        text1: "Delete failed",
        text2:
          error?.response?.data
            ?.message ||
          "Unable to delete passcode.",
      });
    } finally {
      setDeleting(false);
    }
  };

  // =====================================================
  // PASSWORD REVEAL
  // =====================================================

  const toggleReveal = (
    id: string
  ) => {
    setRevealedIds(
      (previous) => {
        const next =
          new Set(previous);

        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }

        return next;
      }
    );
  };

  // =====================================================
  // COPY
  // =====================================================

  const copyToClipboard = async (
    value: string,
    fieldId: string,
    fieldName: string
  ) => {
    try {
      await Clipboard.setStringAsync(
        value
      );

      setCopiedField(fieldId);

      Toast.show({
        type: "success",
        text1: "Copied",
        text2:
          `${fieldName} copied to clipboard.`,
      });

      setTimeout(() => {
        setCopiedField(null);
      }, 1500);
    } catch (error) {
      console.log(
        "COPY ERROR:",
        error
      );

      Toast.show({
        type: "error",
        text1: "Copy failed",
        text2:
          "Unable to copy to clipboard.",
      });
    }
  };

  // =====================================================
  // PLATFORM ICON
  // =====================================================

  const getPlatformIcon = (
    platformName: string
  ) => {
    const name =
      platformName.toLowerCase();

    if (
      name.includes("instagram") ||
      name.includes("insta")
    ) {
      return "📷";
    }

    if (
      name.includes("facebook") ||
      name.includes("fb")
    ) {
      return "📘";
    }

    if (
      name.includes("twitter") ||
      name === "x"
    ) {
      return "🐦";
    }

    if (
      name.includes("linkedin") ||
      name.includes("linked")
    ) {
      return "💼";
    }

    if (
      name.includes("google") ||
      name.includes("gmail")
    ) {
      return "🔍";
    }

    if (name.includes("amazon")) {
      return "📦";
    }

    if (name.includes("netflix")) {
      return "🎬";
    }

    if (name.includes("spotify")) {
      return "🎵";
    }

    if (
      name.includes("github") ||
      name.includes("git")
    ) {
      return "💻";
    }

    if (
      name.includes("bank") ||
      name.includes("finance")
    ) {
      return "🏦";
    }

    return "🔐";
  };

  // =====================================================
  // RENDER CARD
  // =====================================================

  const renderPasscode = (
    item: Passcode,
    index: number
  ) => {
    const isRevealed =
      revealedIds.has(item._id);

    const usernameCopied =
      copiedField ===
      `${item._id}-username`;

    const passwordCopied =
      copiedField ===
      `${item._id}-password`;

    return (
      <View
        key={item._id}
        style={[
          styles.card,
          {
            backgroundColor:
              theme.backgroundElement,

            borderColor:
              theme.border,
          },
        ]}
      >
        <View
          style={styles.cardHeader}
        >
          <View
            style={styles.platformSection}
          >
            <View
              style={[
                styles.platformIconContainer,
                {
                  backgroundColor:
                    theme.background,
                },
              ]}
            >
              <Text
                style={
                  styles.platformIcon
                }
              >
                {getPlatformIcon(
                  item.platform
                )}
              </Text>
            </View>

            <View
              style={
                styles.platformInfo
              }
            >
              <Text
                style={[
                  styles.platform,
                  {
                    color:
                      theme.text,
                  },
                ]}
                numberOfLines={1}
              >
                {item.platform}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.deleteButton,
              {
                borderColor:
                  theme.border,
              },
            ]}
            onPress={() =>
              handleDelete(
                item._id
              )
            }
            activeOpacity={0.7}
          >
            <Text
              style={
                styles.deleteIcon
              }
            >
              🗑
            </Text>

            <Text
              style={[
                styles.deleteButtonText,
                {
                  color:
                    theme.danger,
                },
              ]}
            >
              Delete
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.credentialRow,
            {
              borderTopColor:
                theme.border,
            },
          ]}
        >
          <View
            style={
              styles.credentialInfo
            }
          >
            <Text
              style={[
                styles.label,
                {
                  color:
                    theme.textSecondary,
                },
              ]}
            >
              Username
            </Text>

            <Text
              style={[
                styles.value,
                {
                  color:
                    theme.text,
                },
              ]}
              numberOfLines={1}
            >
              {item.username}
            </Text>
          </View>

          <View
            style={
              styles.credentialActions
            }
          >
            <TouchableOpacity
              style={[
                styles.smallAction,
                {
                  borderColor:
                    theme.border,
                },
              ]}
              onPress={() =>
                handleEdit(item)
              }
              activeOpacity={0.7}
            >
              <Text
                style={
                  styles.smallActionIcon
                }
              >
                ✏️
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.smallAction,
                {
                  borderColor:
                    theme.border,
                },
              ]}
              onPress={() =>
                copyToClipboard(
                  item.username,
                  `${item._id}-username`,
                  "Username"
                )
              }
              activeOpacity={0.7}
            >
              <Text
                style={
                  styles.smallActionIcon
                }
              >
                {usernameCopied
                  ? "✓"
                  : "📋"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={[
            styles.credentialRow,
            {
              borderTopColor:
                theme.border,
            },
          ]}
        >
          <View
            style={
              styles.credentialInfo
            }
          >
            <Text
              style={[
                styles.label,
                {
                  color:
                    theme.textSecondary,
                },
              ]}
            >
              Password
            </Text>

            <Text
              style={[
                styles.value,
                {
                  color:
                    theme.text,
                },
              ]}
              numberOfLines={1}
            >
              {isRevealed
                ? item.password ||
                  ""
                : "••••••••"}
            </Text>
          </View>

          <View
            style={
              styles.credentialActions
            }
          >
            <TouchableOpacity
              style={[
                styles.smallAction,
                {
                  borderColor:
                    theme.border,
                },
              ]}
              onPress={() =>
                toggleReveal(
                  item._id
                )
              }
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.showActionText,
                  {
                    color:
                      theme.accent,
                  },
                ]}
              >
                {isRevealed
                  ? "Hide"
                  : "Show"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.smallAction,
                {
                  borderColor:
                    theme.border,
                },
              ]}
              onPress={() => {
                if (
                  !item.password
                ) {
                  Toast.show({
                    type: "info",
                    text1:
                      "No password",
                    text2:
                      "This passcode has no password stored.",
                  });

                  return;
                }

                copyToClipboard(
                  item.password,
                  `${item._id}-password`,
                  "Password"
                );
              }}
              activeOpacity={0.7}
            >
              <Text
                style={
                  styles.smallActionIcon
                }
              >
                {passwordCopied
                  ? "✓"
                  : "📋"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={[
            styles.cardFooter,
            {
              borderTopColor:
                theme.border,
            },
          ]}
        >
          <Text
            style={[
              styles.serialText,
              {
                color:
                  theme.textSecondary,
              },
            ]}
          >
            #{item.srNo ?? index + 1}
          </Text>

          {item.updatedAt && (
            <Text
              style={[
                styles.updatedText,
                {
                  color:
                    theme.textSecondary,
                },
              ]}
            >
              {formatTimeAgo(item.updatedAt)}
            </Text>
          )}
        </View>
      </View>
    );
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <AppLayout>
       <View style={{ padding: 10, flex: 1}}>
      <View style={styles.container}>
        <View
          style={styles.pageHeader}
        >
          <View
            style={styles.titleSection}
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
              Passcodes
            </Text>

            <Text
              style={[
                styles.pageSubtitle,
                {
                  color:
                    theme.textSecondary,
                },
              ]}
            >
              Securely manage your
              login credentials
            </Text>
          </View>

          <TouchableOpacity
            onPress={() =>
              setShowForm(true)
            }
            style={[
              styles.headerSaveButton,
              {
                backgroundColor:
                  theme.accent,
              },
            ]}
            activeOpacity={0.8}
          >
            <Text
              style={
                styles.headerSaveText
              }
            >
              + Save Passcode
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={styles.toolbar}
        >
          <View
            style={[
              styles.searchContainer,
              {
                backgroundColor:
                  theme.backgroundElement,

                borderColor:
                  theme.border,
              },
            ]}
          >
            <Text
              style={
                styles.searchIcon
              }
            >
              🔎
            </Text>

            <TextInput
              value={search}
              onChangeText={
                setSearch
              }
              placeholder=" search platform or username"
              placeholderTextColor={
                theme.textSecondary
              }
              style={[
                styles.searchInput,
                {
                  color:
                    theme.text,
                },
              ]}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {search.length > 0 && (
              <TouchableOpacity
                onPress={() =>
                  setSearch("")
                }
                style={
                  styles.clearSearch
                }
              >
                <Text
                  style={[
                    styles.clearSearchText,
                    {
                      color:
                        theme.textSecondary,
                    },
                  ]}
                >
                  ✕
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View
            style={
              styles.sortWrapper
            }
          >
            <TouchableOpacity
              onPress={() =>
                setShowSortOptions(
                  (value) => !value
                )
              }
              style={[
                styles.sortButton,
                {
                  backgroundColor:
                    theme.backgroundElement,

                  borderColor:
                    theme.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={
                  styles.sortIcon
                }
              >
                ⇅
              </Text>

              <Text
                style={[
                  styles.sortButtonText,
                  {
                    color:
                      theme.text,
                  },
                ]}
              >
                {sortLabel}
              </Text>

              <Text
                style={[
                  styles.sortArrow,
                  {
                    color:
                      theme.textSecondary,
                  },
                ]}
              >
                {showSortOptions
                  ? "⌃"
                  : "⌄"}
              </Text>
            </TouchableOpacity>

            {showSortOptions && (
              <View
                style={[
                  styles.sortDropdown,
                  {
                    backgroundColor:
                      theme.backgroundElement,

                    borderColor:
                      theme.border,
                  },
                ]}
              >
                {(
                  [
                    [
                      "newest",
                      "Newest",
                    ],
                    [
                      "oldest",
                      "Oldest",
                    ],
                    [
                      "az",
                      "Platform A–Z",
                    ],
                    [
                      "za",
                      "Platform Z–A",
                    ],
                  ] as [
                    SortOption,
                    string
                  ][]
                ).map(
                  ([value, label]) => {
                    const selected =
                      sortOption ===
                      value;

                    return (
                      <TouchableOpacity
                        key={value}
                        style={[
                          styles.sortOption,
                          selected && {
                            backgroundColor:
                              theme.background,
                          },
                        ]}
                        onPress={() => {
                          setSortOption(
                            value
                          );
                          setShowSortOptions(
                            false
                          );

                          fetchPage(
                            1,
                            pageSize,
                            search,
                            value
                          );
                        }}
                        activeOpacity={
                          0.7
                        }
                      >
                        <Text
                          style={[
                            styles.sortOptionText,
                            {
                              color:
                                selected
                                  ? theme.accent
                                  : theme.text,
                            },
                          ]}
                        >
                          {label}
                        </Text>

                        {selected && (
                          <Text
                            style={[
                              styles.checkIcon,
                              {
                                color:
                                  theme.accent,
                              },
                            ]}
                          >
                            ✓
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  }
                )}
              </View>
            )}
          </View>

          {/* =================================================
              INLINE PAGINATION
          ================================================= */}

          {!loading && totalRecords > 0 && (
            <View
              style={
                styles.paginationInline
              }
            >
              <Text
                style={[
                  styles.recordCountText,
                  {
                    color:
                      theme.textSecondary,
                  },
                ]}
                numberOfLines={1}
              >
                
              </Text>

              <TouchableOpacity
                style={[
                  styles.paginationIconButton,
                  {
                    backgroundColor:
                      theme.backgroundElement,

                    borderColor:
                      theme.border,
                  },

                  (!hasPreviousPage ||
                    loading) &&
                    styles.paginationDisabled,
                ]}
                onPress={
                  goToPreviousPage
                }
                disabled={
                  !hasPreviousPage ||
                  loading
                }
                activeOpacity={
                  0.7
                }
              >
                <Text
                  style={[
                    styles.paginationIcon,
                    {
                      color:
                        hasPreviousPage &&
                        !loading
                          ? theme.text
                          : theme.textSecondary,
                    },
                  ]}
                >
                  ‹
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paginationIconButton,
                  {
                    backgroundColor:
                      theme.backgroundElement,

                    borderColor:
                      theme.border,
                  },

                  (!hasNextPage ||
                    loading) &&
                    styles.paginationDisabled,
                ]}
                onPress={
                  goToNextPage
                }
                disabled={
                  !hasNextPage ||
                  loading
                }
                activeOpacity={
                  0.7
                }
              >
                <Text
                  style={[
                    styles.paginationIcon,
                    {
                      color:
                        hasNextPage &&
                        !loading
                          ? theme.text
                          : theme.textSecondary,
                    },
                  ]}
                >
                  ›
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {showForm && (
          <View
            style={[
              styles.formCard,
              {
                backgroundColor:
                  theme.backgroundElement,

                borderColor:
                  theme.border,
              },
            ]}
          >
            <View
              style={
                styles.formHeader
              }
            >
              <View>
                <Text
                  style={[
                    styles.formTitle,
                    {
                      color:
                        theme.text,
                    },
                  ]}
                >
                  Save Passcode
                </Text>

                <Text
                  style={[
                    styles.formSubtitle,
                    {
                      color:
                        theme.textSecondary,
                    },
                  ]}
                >
                  Add your login
                  credentials
                </Text>
              </View>

              <TouchableOpacity
                onPress={
                  cancelCreate
                }
                style={
                  styles.cancelButton
                }
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.cancelText,
                    {
                      color:
                        theme.textSecondary,
                    },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[
                styles.input,
                {
                  color:
                    theme.text,

                  borderColor:
                    theme.border,

                  backgroundColor:
                    theme.background,
                },
              ]}
              placeholder="Platform e.g. Instagram"
              placeholderTextColor={
                theme.textSecondary
              }
              value={platform}
              onChangeText={
                setPlatform
              }
              autoCapitalize="words"
            />

            <TextInput
              style={[
                styles.input,
                {
                  color:
                    theme.text,

                  borderColor:
                    theme.border,

                  backgroundColor:
                    theme.background,
                },
              ]}
              placeholder="Username / Email"
              placeholderTextColor={
                theme.textSecondary
              }
              value={username}
              onChangeText={
                setUsername
              }
              autoCapitalize="none"
            />

            <TextInput
              style={[
                styles.input,
                {
                  color:
                    theme.text,

                  borderColor:
                    theme.border,

                  backgroundColor:
                    theme.background,
                },
              ]}
              placeholder="Password"
              placeholderTextColor={
                theme.textSecondary
              }
              value={password}
              onChangeText={
                setPassword
              }
              secureTextEntry
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[
                styles.saveButton,
                {
                  backgroundColor:
                    theme.accent,
                },

                creating &&
                  styles.disabledButton,
              ]}
              onPress={
                handleCreate
              }
              disabled={creating}
              activeOpacity={0.8}
            >
              {creating ? (
                <ActivityIndicator
                  color="#fff"
                />
              ) : (
                <Text
                  style={
                    styles.saveButtonText
                  }
                >
                  Save Passcode
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <View
            style={
              styles.loadingContainer
            }
          >
            <ActivityIndicator
              size="large"
              color={
                theme.accent
              }
            />

            <Text
              style={[
                styles.loadingText,
                {
                  color:
                    theme.textSecondary,
                },
              ]}
            >
              Loading passcodes...
            </Text>
          </View>
        ) : passcodes.length === 0 ? (
          <View
            style={
              styles.emptyState
            }
          >
            <Text
              style={
                styles.emptyIcon
              }
            >
              🔐
            </Text>

            <Text
              style={[
                styles.emptyTitle,
                {
                  color:
                    theme.text,
                },
              ]}
            >
              {search
                ? "No matching passcodes"
                : "No passcodes yet"}
            </Text>

            <Text
              style={[
                styles.emptyText,
                {
                  color:
                    theme.textSecondary,
                },
              ]}
            >
              {search
                ? "Try another platform or username."
                : 'Tap "Save Passcode" to add your first credential.'}
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.listScroll}
            contentContainerStyle={
              styles.list
            }
            showsVerticalScrollIndicator={
              false
            }
          >
            <View
              style={
                styles.cardsGrid
              }
            >
              {passcodes.map(
                (item, index) =>
                  renderPasscode(
                    item,
                    index
                  )
              )}
            </View>
          </ScrollView>
        )}

        {/* =================================================
            EDIT MODAL
        ================================================= */}

        <Modal
          visible={!!editingPasscode}
          transparent
          animationType="fade"
          onRequestClose={() =>
            setEditingPasscode(null)
          }
        >
          <View style={styles.modalOverlay}>
            {editingPasscode && (
              <View
                style={[
                  styles.editModal,
                  {
                    backgroundColor:
                      theme.backgroundElement,
                  },
                ]}
              >
                <View
                  style={
                    styles.modalTop
                  }
                >
                  <View
                    style={
                      styles.modalIconCircle
                    }
                  >
                    <Text
                      style={
                        styles.modalIcon
                      }
                    >
                      ✏️
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() =>
                      setEditingPasscode(
                        null
                      )
                    }
                    style={
                      styles.modalCloseButton
                    }
                    activeOpacity={
                      0.7
                    }
                  >
                    <Text
                      style={[
                        styles.modalCloseText,
                        {
                          color:
                            theme.textSecondary,
                        },
                      ]}
                    >
                      ✕
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text
                  style={[
                    styles.modalTitle,
                    {
                      color:
                        theme.text,
                    },
                  ]}
                >
                  Edit passcode
                </Text>

                <Text
                  style={[
                    styles.modalSubtitle,
                    {
                      color:
                        theme.textSecondary,
                    },
                  ]}
                >
                  Update your login
                  details for{" "}
                  <Text
                    style={{
                      fontWeight:
                        "700",
                      color:
                        theme.text,
                    }}
                  >
                    {
                      editingPasscode.platform
                    }
                  </Text>
                </Text>

                <Text
                  style={[
                    styles.fieldLabel,
                    {
                      color:
                        theme.textSecondary,
                    },
                  ]}
                >
                  USERNAME
                </Text>

                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      color:
                        theme.text,

                      backgroundColor:
                        theme.background,

                      borderColor:
                        theme.border,
                    },
                  ]}
                  placeholder="Username / Email"
                  placeholderTextColor={
                    theme.textSecondary
                  }
                  value={
                    editUsername
                  }
                  onChangeText={
                    setEditUsername
                  }
                  autoCapitalize="none"
                />

                <Text
                  style={[
                    styles.fieldLabel,
                    {
                      color:
                        theme.textSecondary,
                    },
                  ]}
                >
                  PASSWORD
                </Text>

                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      color:
                        theme.text,

                      backgroundColor:
                        theme.background,

                      borderColor:
                        theme.border,
                    },
                  ]}
                  placeholder="Password"
                  placeholderTextColor={
                    theme.textSecondary
                  }
                  value={
                    editPassword
                  }
                  onChangeText={
                    setEditPassword
                  }
                  secureTextEntry
                  autoCapitalize="none"
                />

                <View
                  style={
                    styles.modalActions
                  }
                >
                  <TouchableOpacity
                    style={[
                      styles.modalCancelButton,
                      {
                        borderColor:
                          theme.border,
                      },
                    ]}
                    onPress={() =>
                      setEditingPasscode(
                        null
                      )
                    }
                    activeOpacity={
                      0.7
                    }
                  >
                    <Text
                      style={[
                        styles.modalCancelText,
                        {
                          color:
                            theme.text,
                        },
                      ]}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modalUpdateButton,
                      {
                        backgroundColor:
                          theme.accent,
                      },

                      updating &&
                        styles.disabledButton,
                    ]}
                    onPress={
                      handleUpdate
                    }
                    disabled={
                      updating
                    }
                    activeOpacity={
                      0.8
                    }
                  >
                    {updating ? (
                      <ActivityIndicator
                        color="#fff"
                      />
                    ) : (
                      <Text
                        style={
                          styles.modalUpdateText
                        }
                      >
                        Save changes
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </Modal>

        {/* =================================================
            DELETE MODAL
        ================================================= */}

        <Modal
          visible={!!deleteConfirmId}
          transparent
          animationType="fade"
          onRequestClose={() =>
            setDeleteConfirmId(null)
          }
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.deleteModal,
                {
                  backgroundColor:
                    theme.backgroundElement,
                },
              ]}
            >
              <View
                style={
                  styles.deleteModalTop
                }
              >
                <View
                  style={[
                    styles.deleteIconCircle,
                    {
                      backgroundColor:
                        theme.danger +
                        "18",
                    },
                  ]}
                >
                  <Text
                    style={
                      styles.deleteModalIcon
                    }
                  >
                    🗑
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() =>
                    setDeleteConfirmId(
                      null
                    )
                  }
                  style={
                    styles.modalCloseButton
                  }
                  activeOpacity={
                    0.7
                  }
                >
                  <Text
                    style={[
                      styles.modalCloseText,
                      {
                        color:
                          theme.textSecondary,
                      },
                    ]}
                  >
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>

              <Text
                style={[
                  styles.modalTitle,
                  {
                    color:
                      theme.text,
                  },
                ]}
              >
                Delete passcode?
              </Text>

              <Text
                style={[
                  styles.modalSubtitle,
                  {
                    color:
                      theme.textSecondary,
                  },
                ]}
              >
                This passcode will be
                permanently removed.
                This action cannot be
                undone.
              </Text>

              <View
                style={[
                  styles.warningBox,
                  {
                    backgroundColor:
                      theme.danger +
                      "0D",

                    borderColor:
                      theme.danger +
                      "25",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.warningText,
                    {
                      color:
                        theme.text,
                    },
                  ]}
                >
                  🔒 Your saved
                  credentials will be
                  deleted from your
                  account.
                </Text>
              </View>

              <View
                style={
                  styles.modalActions
                }
              >
                <TouchableOpacity
                  style={[
                    styles.modalCancelButton,
                    {
                      borderColor:
                        theme.border,
                    },
                  ]}
                  onPress={() =>
                    setDeleteConfirmId(
                      null
                    )
                  }
                  activeOpacity={
                    0.7
                  }
                >
                  <Text
                    style={[
                      styles.modalCancelText,
                      {
                        color:
                          theme.text,
                      },
                    ]}
                  >
                    Keep it
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalDeleteButton,
                    {
                      backgroundColor:
                        theme.danger,
                    },

                    deleting &&
                      styles.disabledButton,
                  ]}
                  onPress={
                    confirmDelete
                  }
                  disabled={
                    deleting
                  }
                  activeOpacity={
                    0.8
                  }
                >
                  {deleting ? (
                    <ActivityIndicator
                      color="#fff"
                    />
                  ) : (
                    <Text
                      style={
                        styles.modalDeleteText
                      }
                    >
                      Delete permanently
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
      </View>
    </AppLayout>
  );
}

// =====================================================
// TIME AGO FORMAT
// =====================================================

const formatTimeAgo = (
  dateString: string
) => {
  try {
    const date =
      new Date(dateString);

    const now = new Date();

    const diffInSeconds =
      Math.floor(
        (now.getTime() -
          date.getTime()) /
          1000
      );

    if (diffInSeconds < 60) {
      return "Just now";
    }

    const diffInMinutes =
      Math.floor(
        diffInSeconds / 60
      );

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }

    const diffInHours =
      Math.floor(
        diffInMinutes / 60
      );

    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }

    const diffInDays =
      Math.floor(
        diffInHours / 24
      );

    if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    }

    const diffInWeeks =
      Math.floor(
        diffInDays / 7
      );

    if (diffInWeeks < 4) {
      return `${diffInWeeks}w ago`;
    }

    const diffInMonths =
      Math.floor(
        diffInDays / 30
      );

    if (diffInMonths < 12) {
      return `${diffInMonths}mo ago`;
    }

    const diffInYears =
      Math.floor(
        diffInDays / 365
      );

    return `${diffInYears}y ago`;
  } catch {
    return "";
  }
};

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },

  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
    marginBottom: 18,
    gap: 15,
  },

  titleSection: {
    flex: 1,
    minWidth: 0,
  },

  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },

  pageSubtitle: {
    fontSize: 12,
    marginTop: 3,
  },

  headerSaveButton: {
    height: 42,
    paddingHorizontal: 16,
    borderRadius: 11,
    justifyContent:
      "center",
    alignItems: "center",
  },

  headerSaveText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },

  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    zIndex: 5000,
    elevation: 5000,
  },

  searchContainer: {
    flex: 1,
    minWidth: 0,
    height: 45,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },

  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    height: 44,
    fontSize: 13,
    outlineStyle: "none",
  } as any,

  clearSearch: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent:
      "center",
    alignItems: "center",
  },

  clearSearchText: {
    fontSize: 13,
  },

  sortWrapper: {
    position: "relative",
    zIndex: 6000,
    elevation: 6000,
  },

  sortButton: {
    minWidth: 160,
    height: 45,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  sortIcon: {
    fontSize: 18,
    marginRight: 7,
  },

  sortButtonText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
  },

  sortArrow: {
    fontSize: 14,
  },

  sortDropdown: {
    position: "absolute",
    top: 50,
    right: 0,
    width: 190,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 5,
    zIndex: 99999,
    elevation: 99999,

    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },
  },

  sortOption: {
    minHeight: 42,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
    borderRadius: 8,
    marginHorizontal: 4,
  },

  sortOptionText: {
    fontSize: 12,
    fontWeight: "600",
  },

  checkIcon: {
    fontSize: 15,
    fontWeight: "800",
  },

  // ===================================================
  // INLINE PAGINATION
  // ===================================================

  paginationInline: {
    height: 45,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  recordCountText: {
    fontSize: 10,
    fontWeight: "600",
    maxWidth: 120,
  },

  paginationIconButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent:
      "center",
    alignItems: "center",
  },

  paginationIcon: {
    fontSize: 20,
    lineHeight: 20,
    fontWeight: "600",
  },

  paginationDisabled: {
    opacity: 0.45,
  },

  formCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    overflow: "visible",
  },

  formHeader: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },

  formTitle: {
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 3,
  },

  formSubtitle: {
    fontSize: 12,
  },

  cancelButton: {
    paddingVertical: 5,
    paddingHorizontal: 4,
  },

  cancelText: {
    fontSize: 13,
    fontWeight: "600",
  },

  input: {
    height: 45,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 13,
    marginBottom: 10,
    fontSize: 14,
  },

  saveButton: {
    height: 45,
    borderRadius: 10,
    justifyContent:
      "center",
    alignItems: "center",
  },

  saveButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  disabledButton: {
    opacity: 0.55,
  },

  listScroll: {
    flex: 1,
    width: "100%",
  },

  list: {
    paddingBottom: 35,
    width: "100%",
  },

  cardsGrid: {
    width: "100%",
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(300px, 1fr))",
    columnGap: 12,
    rowGap: 12,
  } as any,

  card: {
    borderRadius: 15,
    borderWidth: 1,
    overflow: "visible",
    position: "relative",
    minWidth: 0,
  },

  cardHeader: {
    minHeight: 65,
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
    paddingHorizontal: 13,
    gap: 10,
  },

  platformSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },

  platformIconContainer: {
    width: 39,
    height: 39,
    borderRadius: 11,
    justifyContent:
      "center",
    alignItems: "center",
    marginRight: 10,
  },

  platformIcon: {
    fontSize: 19,
  },

  platformInfo: {
    flex: 1,
    minWidth: 0,
  },

  platform: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 2,
  },

  deleteButton: {
    height: 32,
    paddingHorizontal: 9,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  deleteIcon: {
    fontSize: 12,
  },

  deleteButtonText: {
    fontSize: 11,
    fontWeight: "700",
  },

  credentialRow: {
    minHeight: 58,
    borderTopWidth:
      StyleSheet.hairlineWidth,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: 10,
  },

  credentialInfo: {
    flex: 1,
    minWidth: 0,
  },

  label: {
    fontSize: 9,
    fontWeight: "800",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  value: {
    fontSize: 13,
    fontWeight: "600",
  },

  credentialActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  smallAction: {
    minWidth: 34,
    height: 32,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent:
      "center",
    alignItems: "center",
  },

  smallActionIcon: {
    fontSize: 13,
  },

  showActionText: {
    fontSize: 11,
    fontWeight: "700",
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent:
      "center",
    paddingVertical: 60,
  },

  loadingText: {
    fontSize: 12,
    marginTop: 10,
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent:
      "center",
    paddingVertical: 70,
    paddingHorizontal: 30,
  },

  emptyIcon: {
    fontSize: 42,
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 6,
  },

  emptyText: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    maxWidth: 400,
  },

  modalOverlay: {
    flex: 1,
    justifyContent:
      "center",
    alignItems: "center",
    padding: 20,
    backgroundColor:
      "rgba(0, 0, 0, 0.35)",
  },

  editModal: {
    width: "100%",
    maxWidth: 440,
    borderRadius: 20,
    padding: 20,

    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 25,
    shadowOffset: {
      width: 0,
      height: 10,
    },

    elevation: 15,
  },

  deleteModal: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 20,
    padding: 20,

    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 25,
    shadowOffset: {
      width: 0,
      height: 10,
    },

    elevation: 15,
  },

  modalTop: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginBottom: 15,
  },

  deleteModalTop: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginBottom: 15,
  },

  modalIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 13,
    justifyContent:
      "center",
    alignItems: "center",
    backgroundColor:
      "rgba(100,100,100,0.08)",
  },

  modalIcon: {
    fontSize: 19,
  },

  deleteIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 13,
    justifyContent:
      "center",
    alignItems: "center",
  },

  deleteModalIcon: {
    fontSize: 19,
  },

  modalCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent:
      "center",
    alignItems: "center",
  },

  modalCloseText: {
    fontSize: 17,
    fontWeight: "600",
  },

  modalTitle: {
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: -0.4,
  },

  modalSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
    marginBottom: 19,
  },

  fieldLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.7,
    marginBottom: 6,
  },

  modalInput: {
    height: 46,
    borderWidth: 1,
    borderRadius: 11,
    paddingHorizontal: 13,
    fontSize: 13,
    marginBottom: 13,
  },

  modalActions: {
    flexDirection: "row",
    gap: 9,
    marginTop: 5,
  },

  modalCancelButton: {
    flex: 1,
    height: 45,
    borderRadius: 11,
    borderWidth: 1,
    justifyContent:
      "center",
    alignItems: "center",
  },

  modalCancelText: {
    fontSize: 12,
    fontWeight: "700",
  },

  modalUpdateButton: {
    flex: 1,
    height: 45,
    borderRadius: 11,
    justifyContent:
      "center",
    alignItems: "center",
  },

  modalUpdateText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },

  modalDeleteButton: {
    flex: 1,
    height: 45,
    borderRadius: 11,
    justifyContent:
      "center",
    alignItems: "center",
  },

  modalDeleteText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  warningBox: {
    borderWidth: 1,
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 16,
  },

  warningText: {
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "600",
  },

  cardFooter: {
    minHeight: 32,
    borderTopWidth:
      StyleSheet.hairlineWidth,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: 8,
  },

  serialText: {
    fontSize: 10,
    fontWeight: "700",
  },

  updatedText: {
    fontSize: 10,
  },
});