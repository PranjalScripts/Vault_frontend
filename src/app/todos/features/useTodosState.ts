import { useState } from "react";
import { FilterType, DeleteType } from "../features/types";

export type MenuPosition = { top: number; left: number };

export function useTodosState() {
  /* =========================================================
   * TODOS & INPUT
   * ========================================================= */

  const [todos, setTodos] = useState<
    import("../features/types").Todo[]
  >([]);

  const [title, setTitle] = useState("");

  const [search, setSearch] = useState("");

  /* =========================================================
   * LOADING FLAGS
   * ========================================================= */

  const [loading, setLoading] = useState(true);

  const [creating, setCreating] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const [deletingMultiple, setDeletingMultiple] =
    useState(false);

  /* =========================================================
   * PAGINATION
   * ========================================================= */

  const [page, setPage] = useState(1);

  const [totalTodos, setTotalTodos] = useState(0);

  const [totalPages, setTotalPages] = useState(1);

  const [hasNextPage, setHasNextPage] = useState(false);

  const [hasPreviousPage, setHasPreviousPage] =
    useState(false);

  /* =========================================================
   * FILTER
   * ========================================================= */

  const [filter, setFilter] =
    useState<FilterType>("newest");

  const [showFilters, setShowFilters] = useState(false);

  /* =========================================================
   * MULTIPLE DELETE MENU
   * ========================================================= */

  const [showMultipleDelete, setShowMultipleDelete] =
    useState(false);

  /* =========================================================
   * DELETE MODAL
   * ========================================================= */

  const [deleteModalVisible, setDeleteModalVisible] =
    useState(false);

  const [deleteType, setDeleteType] =
    useState<DeleteType>(null);

  const [deleteSingleId, setDeleteSingleId] = useState<
    string | null
  >(null);

  /* =========================================================
   * MENU POSITIONS
   * ========================================================= */

  const [filterPosition, setFilterPosition] =
    useState<MenuPosition>({ top: 0, left: 0 });

  const [multipleDeletePosition, setMultipleDeletePosition] =
    useState<MenuPosition>({ top: 0, left: 0 });

  return {
    // todos & input
    todos,
    setTodos,
    title,
    setTitle,
    search,
    setSearch,

    // loading flags
    loading,
    setLoading,
    creating,
    setCreating,
    refreshing,
    setRefreshing,
    deletingMultiple,
    setDeletingMultiple,

    // pagination
    page,
    setPage,
    totalTodos,
    setTotalTodos,
    totalPages,
    setTotalPages,
    hasNextPage,
    setHasNextPage,
    hasPreviousPage,
    setHasPreviousPage,

    // filter
    filter,
    setFilter,
    showFilters,
    setShowFilters,

    // multiple delete menu
    showMultipleDelete,
    setShowMultipleDelete,

    // delete modal
    deleteModalVisible,
    setDeleteModalVisible,
    deleteType,
    setDeleteType,
    deleteSingleId,
    setDeleteSingleId,

    // menu positions
    filterPosition,
    setFilterPosition,
    multipleDeletePosition,
    setMultipleDeletePosition,
  };
}

export type TodosState = ReturnType<typeof useTodosState>;
