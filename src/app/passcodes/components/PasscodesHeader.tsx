import React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

import type { SortOption } from "../types";
import { styles } from "../styles";

export function PasscodesHeader(props: any) {
  const {
    theme,
    isVaultLoading,
    isVaultCreated,
    isVaultUnlocked,
    vaultKey,
    openVaultModal,
    setShowForm,
    search,
    setSearch,
    sortLabel,
    showSortOptions,
    setShowSortOptions,
    sortOption,
    setSortOption,
    fetchPage,
    pageSize,
    loading,
    totalRecords,
    hasPreviousPage,
    hasNextPage,
    goToPreviousPage,
    goToNextPage,
  } = props;

  return (
    <>
          {/* PAGE HEADER */}

          <View
            style={
              styles.pageHeader
            }
          >
            <View
              style={
                styles.titleSection
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
              onPress={() => {
                if (
                  isVaultLoading
                ) {
                  return;
                }

                if (!isVaultCreated) {
                  openVaultModal();
                  return;
                }

                if (
                  !isVaultUnlocked ||
                  !vaultKey
                ) {
                  openVaultModal();
                  return;
                }

                setShowForm(true);
              }}
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

          {/* TOOLBAR */}

          <View
            style={
              styles.toolbar
            }
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

            {/* SORT */}

            <View
              style={
                styles.sortWrapper
              }
            >
              <TouchableOpacity
                onPress={() =>
                  setShowSortOptions(
                    (value: boolean) =>
                      !value
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
                    ([
                      value,
                      label,
                    ]) => {
                      const selected =
                        sortOption ===
                        value;

                      return (
                        <TouchableOpacity
                          key={
                            value
                          }
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

                            if (
                              isVaultCreated &&
                              isVaultUnlocked &&
                              vaultKey
                            ) {
                              fetchPage(
                                1,
                                pageSize,
                                search,
                                value
                              );
                            }
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

            {/* PAGINATION */}

            {!loading &&
              totalRecords > 0 && (
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
                    numberOfLines={
                      1
                    }
                  />

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
    </>
  );
}
