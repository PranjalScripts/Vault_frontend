import { useTheme } from "@/hooks/use-theme";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { categories, entryCategory } from "../presentation";
import type { Passcode, SortOption } from "../types";

export function PasscodesHeader(props: any) {
  const p = useTheme();
  const s = createStyles(p);
  const {
    isVaultLoading,
    isVaultCreated,
    isVaultUnlocked,
    vaultKey,
    openVaultModal,
    setShowForm,
    search,
    setSearch,
    showSortOptions,
    setShowSortOptions,
    sortOption,
    setSortOption,
    loading,
    totalRecords,
    hasPreviousPage,
    hasNextPage,
    goToPreviousPage,
    goToNextPage,
    passcodes,
    category,
    setCategory,
  } = props;
  const desktop = useWindowDimensions().width >= 768;
  return (
    <View style={s.container}>
      {desktop && (
        <View style={s.heading}>
          <View>
            <Text style={s.title}>Passcodes</Text>
            <Text style={s.subtitle}>
              Your passwords are end-to-end encrypted and secure
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add passcode"
            disabled={isVaultLoading}
            onPress={() =>
              !isVaultCreated || !isVaultUnlocked || !vaultKey
                ? openVaultModal()
                : setShowForm(true)
            }
            style={s.add}
          >
            <Feather name="plus" size={27} color={p.accent} />
          </Pressable>
        </View>
      )}
      <View style={s.toolbar}>
        <View style={s.search}>
          <Feather name="search" size={20} color={p.textSecondary} />
          <TextInput
            accessibilityLabel="Search passcodes"
            value={search}
            onChangeText={setSearch}
            placeholder="Search platform, username..."
            placeholderTextColor={p.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            style={s.input}
          />
          {search.length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              onPress={() => setSearch("")}
            >
              <Feather name="x" size={19} color={p.textSecondary} />
            </Pressable>
          )}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sort passcodes"
          accessibilityState={{ expanded: showSortOptions }}
          onPress={() => setShowSortOptions(!showSortOptions)}
          style={s.filter}
        >
          <Feather name="sliders" size={20} color={p.textSecondary} />
        </Pressable>
      </View>
      {showSortOptions && (
        <View style={s.sort}>
          {(
            [
              ["newest", "Newest"],
              ["oldest", "Oldest"],
              ["az", "Platform A–Z"],
              ["za", "Platform Z–A"],
            ] as [SortOption, string][]
          ).map(([value, label]) => (
            <Pressable
              key={value}
              accessibilityRole="radio"
              accessibilityState={{ checked: sortOption === value }}
              onPress={() => {
                setSortOption(value);
                setShowSortOptions(false);
              }}
              style={s.sortOption}
            >
              <Text style={{ color: sortOption === value ? p.accent : p.text }}>
                {label}
              </Text>
              {sortOption === value && (
                <Feather name="check" size={17} color={p.accent} />
              )}
            </Pressable>
          ))}
        </View>
      )}
      {isVaultUnlocked && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chips}
        >
          {categories.map((name) => {
            const count = (passcodes as Passcode[]).filter(
              (item) => name === "All" || entryCategory(item) === name,
            ).length;
            const selected = category === name;
            return (
              <Pressable
                key={name}
                accessibilityRole="radio"
                accessibilityLabel={`${name}, ${count} entries on this page`}
                accessibilityState={{ checked: selected }}
                onPress={() => setCategory(name)}
                style={[s.chip, selected && s.selected]}
              >
                <Feather
                  name={
                    name === "All"
                      ? "layers"
                      : name === "Social"
                        ? "users"
                        : name === "Work"
                          ? "briefcase"
                          : name === "Finance"
                            ? "credit-card"
                            : name === "Entertainment"
                              ? "play-circle"
                              : "tag"
                  }
                  size={17}
                  color={selected ? p.background : p.textSecondary}
                />
                <Text
                  style={{
                    color: selected ? p.background : p.text,
                    fontSize: 12,
                  }}
                >
                  {name}
                </Text>
                <Text
                  style={{
                    color: selected ? p.background : p.textSecondary,
                    fontSize: 11,
                  }}
                >
                  {count}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
      {!loading && (hasPreviousPage || hasNextPage) && (
        <View style={s.pagination}>
          <Text style={s.subtitle}>
            {totalRecords} entries · categories filter this page
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous page"
            disabled={!hasPreviousPage}
            onPress={goToPreviousPage}
            style={{ opacity: hasPreviousPage ? 1 : 0.3, padding: 8 }}
          >
            <Feather name="chevron-left" size={20} color={p.text} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next page"
            disabled={!hasNextPage}
            onPress={goToNextPage}
            style={{ opacity: hasNextPage ? 1 : 0.3, padding: 8 }}
          >
            <Feather name="chevron-right" size={20} color={p.text} />
          </Pressable>
        </View>
      )}
    </View>
  );
}
const createStyles = (p: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: { gap: 16, marginBottom: 16 },
    heading: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    title: { color: p.text, fontSize: 26, fontWeight: "600" },
    subtitle: { color: p.textSecondary, fontSize: 12, marginTop: 4 },
    add: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      padding: 12,
      backgroundColor: p.accentMuted,
      borderRadius: 14,
    },
    toolbar: { flexDirection: "row", gap: 10 },
    search: {
      flex: 1,
      minWidth: 0,
      flexDirection: "row",
      alignItems: "center",
      gap: 13,
      minHeight: 46,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: p.border,
      borderRadius: 15,
      backgroundColor: p.backgroundElement,
    },
    input: {
      flex: 1,
      minWidth: 0,
      color: p.text,
      fontSize: 13,
      paddingVertical: 12,
    },
    filter: {
      width: 48,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: p.backgroundElement,
      borderWidth: 1,
      borderColor: p.border,
      borderRadius: 15,
    },
    chips: { gap: 8 },
    chip: {
      flexDirection: "row",
      gap: 7,
      alignItems: "center",
      paddingHorizontal: 10,
      minHeight: 39,
      borderWidth: 1,
      borderColor: p.border,
      borderRadius: 12,
      backgroundColor: p.backgroundElement,
    },
    selected: { backgroundColor: p.accent, borderColor: p.accent },
    sort: {
      backgroundColor: p.backgroundElement,
      padding: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: p.border,
    },
    sortOption: {
      flexDirection: "row",
      justifyContent: "space-between",
      padding: 12,
    },
    pagination: {
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
      gap: 8,
    },
  });
