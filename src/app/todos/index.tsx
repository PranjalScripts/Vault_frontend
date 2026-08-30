import React, { useCallback } from "react";

import {
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import { useFocusEffect } from "expo-router";

import { AppLayout } from "@/components/AppLayout";

import { useTheme } from "@/hooks/use-theme";

import { Todo } from "@/app/todos/features/types";
import { useTodosState } from "@/app/todos/features/useTodosState";
import { useTodosActions } from "@/app/todos/features/useTodosActions";
import { useMenuPositions } from "@/app/todos/features/useMenuPositions";
import { TodoCard } from "@/app/todos/features/TodoCard";
import { FilterOverlay } from "@/app/todos/features/FilterOverlay";
import { MultipleDeleteOverlay } from "@/app/todos/features/MultipleDeleteOverlay";
import { DeleteModal } from "@/app/todos/features/DeleteModal";
import { SectionHeader } from "@/app/todos/features/SectionHeader";
import { EmptyState } from "@/app/todos/features/EmptyState";
import styles from "@/app/todos/features/todos.styles";

export default function TodosScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();

  /* =========================================================
   * RESPONSIVE
   * ========================================================= */

  const isMobile = width < 700;
  const isTablet = width >= 700 && width < 1100;
  const isDesktop = width >= 1100;

  const numColumns = isDesktop ? 4 : isTablet ? 2 : 1;

  /* =========================================================
   * STATE + ACTIONS + MENU POSITIONS
   * ========================================================= */

  const state = useTodosState();

  const {
    todos,
    title,
    setTitle,
    search,
    setSearch,
    loading,
    creating,
    refreshing,
    deletingMultiple,
    page,
    totalTodos,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    filter,
    setFilter,
    showFilters,
    setShowFilters,
    showMultipleDelete,
    setShowMultipleDelete,
    deleteModalVisible,
    setDeleteModalVisible,
    deleteType,
    setDeleteType,
    deleteSingleId,
    setDeleteSingleId,
    filterPosition,
    setFilterPosition,
    multipleDeletePosition,
    setMultipleDeletePosition,
  } = state;

  const {
    fetchPage,
    handlePreviousPage,
    handleNextPage,
    handleRefresh,
    handleCreateTodo,
    handleToggleTodo,
    openSingleDeleteModal,
    openBulkDeleteModal,
    handleConfirmDelete,
    filteredTodos,
    getFilterLabel,
  } = useTodosActions(state);

  const {
    screenRef,
    filterButtonRef,
    multipleDeleteRef,
    openFilterMenu,
    openMultipleDeleteMenu,
  } = useMenuPositions({
    isMobile,
    setFilterPosition,
    setShowFilters,
    setMultipleDeletePosition,
    setShowMultipleDelete,
  });

  /* =========================================================
   * INITIAL LOAD
   * ========================================================= */

  useFocusEffect(
    useCallback(() => {
      fetchPage(1, filter);
    }, [])
  );

  /* =========================================================
   * DERIVED
   * ========================================================= */

  const completedCount = todos.filter(
    (todo) => todo.isCompleted
  ).length;

  const filterIsActive = filter !== "newest";

  /* =========================================================
   * RENDER ITEM
   * ========================================================= */

  const renderTodo = ({
    item,
    index,
  }: {
    item: Todo;
    index: number;
  }) => (
    <TodoCard
      item={item}
      index={index}
      page={page}
      theme={theme}
      isMobile={isMobile}
      isDesktop={isDesktop}
      onToggle={handleToggleTodo}
      onDelete={openSingleDeleteModal}
    />
  );

  /* =========================================================
   * MAIN
   * ========================================================= */

  return (
    <AppLayout scrollable={false}>
      <View
        ref={screenRef}
        style={styles.screen}
        collapsable={false}
      >
        {/* =================================================
            FIXED HEADER
            ================================================= */}

        <View
          style={[
            styles.fixedHeader,
            isMobile && styles.mobileFixedHeader,
            isDesktop && styles.desktopFixedHeader,
          ]}
        >
          {/* =================================================
              TITLE
              ================================================= */}

          <View style={styles.titleRow}>
            <View style={styles.titleBlock}>
              <View style={styles.headingRow}>
                <Text
                  style={[
                    styles.heading,
                    { color: theme.text },
                  ]}
                >
                  To Do
                </Text>

                {isMobile && todos.length > 0 && (
                  <View
                    style={[
                      styles.mobileCounter,
                      {
                        backgroundColor: `${theme.accent}14`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.mobileCounterText,
                        { color: theme.accent },
                      ]}
                    >
                      {completedCount}/{totalTodos}
                    </Text>
                  </View>
                )}
              </View>

              <Text
                style={[
                  styles.subtitle,
                  { color: theme.textSecondary },
                ]}
              >
                Stay focused. Get things done.
              </Text>
            </View>

            {!isMobile && todos.length > 0 && (
              <View
                style={[
                  styles.counter,
                  {
                    borderColor: theme.border,
                    backgroundColor: theme.backgroundElement,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.counterNumber,
                    { color: theme.accent },
                  ]}
                >
                  {completedCount}
                </Text>

                <Text
                  style={[
                    styles.counterTotal,
                    { color: theme.textSecondary },
                  ]}
                >
                  {" "}/ {totalTodos}
                </Text>
              </View>
            )}
          </View>

          {/* =================================================
              COMPACT COMPOSER
              ================================================= */}

          <View
            style={[
              styles.composer,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}
          >
            <View
              style={[
                styles.plusBox,
                { backgroundColor: `${theme.accent}16` },
              ]}
            >
              <Text
                style={[styles.plus, { color: theme.accent }]}
              >
                +
              </Text>
            </View>

            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="What needs to be done?"
              placeholderTextColor={theme.textSecondary}
              value={title}
              onChangeText={setTitle}
              onSubmitEditing={handleCreateTodo}
              returnKeyType="done"
              autoCorrect={false}
            />

            <TouchableOpacity
              style={[
                styles.addButton,
                { backgroundColor: theme.accent },
                creating && styles.disabled,
              ]}
              onPress={handleCreateTodo}
              disabled={creating}
              activeOpacity={0.8}
            >
              {creating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  {!isMobile && (
                    <Text style={styles.addIcon}>+</Text>
                  )}
                  <Text style={styles.addText}>Add</Text>
                </>
              )}
            </TouchableOpacity>

            {/* =================================================
                DESKTOP / TABLET MULTIPLE DELETE
                ================================================= */}

            {!isMobile && (
              <View
                ref={multipleDeleteRef}
                collapsable={false}
              >
                <TouchableOpacity
                  style={[
                    styles.multipleDeleteButton,
                    {
                      backgroundColor: `${theme.accent}10`,
                      borderColor: theme.border,
                    },
                  ]}
                  activeOpacity={0.75}
                  onPress={openMultipleDeleteMenu}
                >
                  <Text
                    style={[
                      styles.multipleDeleteIcon,
                      { color: theme.accent },
                    ]}
                  >
                    ×
                  </Text>

                  <Text
                    style={[
                      styles.multipleDeleteText,
                      { color: theme.text },
                    ]}
                  >
                    Multiple delete
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* =================================================
              MOBILE MULTIPLE DELETE
              ================================================= */}

          {isMobile && (
            <View
              ref={multipleDeleteRef}
              collapsable={false}
              style={styles.mobileMultipleDeleteWrapper}
            >
              <TouchableOpacity
                style={[
                  styles.mobileMultipleDeleteButton,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.border,
                  },
                ]}
                activeOpacity={0.75}
                onPress={openMultipleDeleteMenu}
              >
                <Text
                  style={[
                    styles.mobileMultipleDeleteIcon,
                    { color: theme.accent },
                  ]}
                >
                  ×
                </Text>

                <Text
                  style={[
                    styles.mobileMultipleDeleteText,
                    { color: theme.text },
                  ]}
                >
                  Multiple delete
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* =================================================
              TOOLBAR
              ================================================= */}

          <View
            style={[
              styles.toolbar,
              isMobile && styles.mobileToolbar,
            ]}
          >
            {/* SEARCH */}

            <View
              style={[
                styles.searchBox,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                },
                isMobile && styles.mobileSearchBox,
              ]}
            >
              <Text
                style={[
                  styles.searchIcon,
                  { color: theme.textSecondary },
                ]}
              >
                ⌕
              </Text>

              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search"
                placeholderTextColor={theme.textSecondary}
                style={[
                  styles.searchInput,
                  { color: theme.text },
                ]}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* FILTER */}

            <View ref={filterButtonRef} collapsable={false}>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: filterIsActive
                      ? theme.accent
                      : theme.border,
                  },
                ]}
                activeOpacity={0.7}
                onPress={() => {
                  if (showFilters) {
                    setShowFilters(false);
                  } else {
                    openFilterMenu();
                  }
                }}
              >
                <Text
                  style={[
                    styles.filterIcon,
                    {
                      color: filterIsActive
                        ? theme.accent
                        : theme.text,
                    },
                  ]}
                >
                  ⇅
                </Text>

                {!isMobile && (
                  <Text
                    style={[
                      styles.filterText,
                      {
                        color: filterIsActive
                          ? theme.accent
                          : theme.text,
                      },
                    ]}
                  >
                    {getFilterLabel()}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* PAGE */}

            <View
              style={[
                styles.pageIndicator,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.pageNumber,
                  { color: theme.text },
                ]}
              >
                {page}
              </Text>

              <Text
                style={[
                  styles.pageOf,
                  { color: theme.textSecondary },
                ]}
              >
                {" "}of{" "}
              </Text>

              <Text
                style={[
                  styles.totalPages,
                  { color: theme.textSecondary },
                ]}
              >
                {totalPages}
              </Text>
            </View>

            {/* PREVIOUS */}

            <TouchableOpacity
              style={[
                styles.arrowButton,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                },
                (!hasPreviousPage || loading) &&
                  styles.arrowDisabled,
              ]}
              onPress={handlePreviousPage}
              disabled={!hasPreviousPage || loading}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.arrowText,
                  {
                    color:
                      !hasPreviousPage || loading
                        ? theme.textSecondary
                        : theme.text,
                  },
                ]}
              >
                ‹
              </Text>
            </TouchableOpacity>

            {/* NEXT */}

            <TouchableOpacity
              style={[
                styles.arrowButton,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                },
                (!hasNextPage || loading) &&
                  styles.arrowDisabled,
              ]}
              onPress={handleNextPage}
              disabled={!hasNextPage || loading}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.arrowText,
                  {
                    color:
                      !hasNextPage || loading
                        ? theme.textSecondary
                        : theme.text,
                  },
                ]}
              >
                ›
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* =================================================
            SCROLLABLE LIST
            ================================================= */}

        <FlatList
          data={filteredTodos}
          keyExtractor={(item) => item._id}
          renderItem={renderTodo}
          ListHeaderComponent={
            <SectionHeader
              search={search}
              filteredCount={filteredTodos.length}
              page={page}
              totalTodos={totalTodos}
              theme={theme}
            />
          }
          ListEmptyComponent={
            <EmptyState
              loading={loading}
              search={search}
              filter={filter}
              theme={theme}
            />
          }
          numColumns={numColumns}
          key={`grid-${numColumns}`}
          columnWrapperStyle={
            numColumns > 1 ? styles.columnWrapper : undefined
          }
          refreshing={refreshing}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={false}
          style={styles.flatList}
          contentContainerStyle={[
            styles.listContent,
            isMobile && styles.mobileListContent,
            isDesktop && styles.desktopListContent,
          ]}
        />

        {/* =================================================
            FILTER MENU
            ================================================= */}

        <FilterOverlay
          visible={showFilters}
          filter={filter}
          filterPosition={filterPosition}
          isMobile={isMobile}
          theme={theme}
          onClose={() => setShowFilters(false)}
          onSelect={(value) => {
            setFilter(value);
            setShowFilters(false);
            fetchPage(1, value);
          }}
        />

        {/* =================================================
            MULTIPLE DELETE MENU
            ================================================= */}

        <MultipleDeleteOverlay
          visible={showMultipleDelete}
          multipleDeletePosition={multipleDeletePosition}
          isMobile={isMobile}
          theme={theme}
          onClose={() => setShowMultipleDelete(false)}
          onDeleteCompleted={() =>
            openBulkDeleteModal("completed")
          }
          onDeletePending={() =>
            openBulkDeleteModal("pending")
          }
        />

        {/* =================================================
            DELETE CONFIRMATION MODAL
            ================================================= */}

        <DeleteModal
          visible={deleteModalVisible}
          deleteType={deleteType}
          deleteSingleId={deleteSingleId}
          deletingMultiple={deletingMultiple}
          theme={theme}
          onClose={() => {
            setDeleteModalVisible(false);
            setDeleteType(null);
            setDeleteSingleId(null);
          }}
          onConfirm={handleConfirmDelete}
        />
      </View>
    </AppLayout>
  );
}