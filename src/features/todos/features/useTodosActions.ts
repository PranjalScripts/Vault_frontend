import {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
} from "@/api/api";

import { FilterType, Todo, PAGE_SIZE } from "@/features/todos/features/types";
import { TodosState } from "@/features/todos/features/useTodosState";

export function useTodosActions(state: TodosState) {
  const {
    todos,
    setTodos,
    title,
    setTitle,
    search,
    setSearch,
    setLoading,
    setCreating,
    setRefreshing,
    setDeletingMultiple,
    page,
    setPage,
    totalPages,
    setTotalTodos,
    setTotalPages,
    setHasNextPage,
    setHasPreviousPage,
    filter,
    setFilter,
    setShowMultipleDelete,
    setDeleteModalVisible,
    deleteType,
    setDeleteType,
    deleteSingleId,
    setDeleteSingleId,
  } = state;

  /* =========================================================
   * FETCH PAGE
   * ========================================================= */

  const fetchPage = async (
    pageNumber: number,
    selectedFilter: FilterType = filter
  ) => {
    try {
      setLoading(true);

      const params: {
        page: number;
        limit: number;
        status?: "completed" | "pending";
      } = {
        page: pageNumber,
        limit: PAGE_SIZE,
      };

      if (selectedFilter === "completed") {
        params.status = "completed";
      } else if (selectedFilter === "pending") {
        params.status = "pending";
      }

      const response = await getTodos(params);

      const responseData = response.data;

      const newTodos: Todo[] = responseData.data || [];

      setTodos(newTodos);

      const pagination = responseData.pagination;

      if (pagination) {
        setPage(pagination.page ?? pageNumber);
        setTotalTodos(pagination.total ?? 0);
        setTotalPages(pagination.totalPages ?? 1);
        setHasNextPage(pagination.hasNextPage ?? false);
        setHasPreviousPage(
          pagination.hasPreviousPage ?? false
        );
      } else {
        setPage(pageNumber);
        setTotalTodos(newTodos.length);
        setTotalPages(1);
        setHasNextPage(false);
        setHasPreviousPage(pageNumber > 1);
      }
    } catch (error) {
      console.log("GET TODOS ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
   * PREVIOUS PAGE
   * ========================================================= */

  const handlePreviousPage = async () => {
    if (state.loading || !state.hasPreviousPage) {
      return;
    }

    await fetchPage(page - 1, filter);
  };

  /* =========================================================
   * NEXT PAGE
   * ========================================================= */

  const handleNextPage = async () => {
    if (state.loading || !state.hasNextPage) {
      return;
    }

    await fetchPage(page + 1, filter);
  };

  /* =========================================================
   * REFRESH
   * ========================================================= */

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchPage(1, filter);
    } finally {
      setRefreshing(false);
    }
  };

  /* =========================================================
   * CREATE TODO
   * ========================================================= */

  const handleCreateTodo = async () => {
    const text = title.trim();

    if (!text) {
      return;
    }

    try {
      setCreating(true);

      await createTodo({ title: text });

      setTitle("");

      await fetchPage(page, filter);
    } catch (error) {
      console.log("CREATE TODO ERROR:", error);
    } finally {
      setCreating(false);
    }
  };

  /* =========================================================
   * TOGGLE TODO
   *
   * WHOLE CARD IS CLICKABLE
   * ========================================================= */

  const handleToggleTodo = async (todo: Todo) => {
    try {
      const response = await updateTodo(todo._id, {
        isCompleted: !todo.isCompleted,
      });

      const updatedTodo: Todo = response.data.data;

      /*
       * Completed/Pending filters
       * need backend refresh because
       * the item may leave the filter.
       */

      if (filter === "completed" || filter === "pending") {
        await fetchPage(page, filter);
        return;
      }

      setTodos((current) =>
        current.map((item) =>
          item._id === updatedTodo._id ? updatedTodo : item
        )
      );
    } catch (error) {
      console.log("UPDATE TODO ERROR:", error);
    }
  };

  /* =========================================================
   * OPEN SINGLE DELETE MODAL
   * ========================================================= */

  const openSingleDeleteModal = (id: string) => {
    setDeleteSingleId(id);
    setDeleteType(null);
    setDeleteModalVisible(true);
  };

  /* =========================================================
   * OPEN BULK DELETE MODAL
   * ========================================================= */

  const openBulkDeleteModal = (
    type: "completed" | "pending"
  ) => {
    setDeleteType(type);
    setDeleteSingleId(null);
    setShowMultipleDelete(false);
    setDeleteModalVisible(true);
  };

  /* =========================================================
   * DELETE SINGLE TODO
   * ========================================================= */

  const performSingleDelete = async () => {
    if (!deleteSingleId) {
      return;
    }

    try {
      setDeletingMultiple(true);

      await deleteTodo(deleteSingleId);

      let nextPage = page;

      if (
        todos.length === 1 &&
        page > 1 &&
        page === totalPages
      ) {
        nextPage = page - 1;
      }

      setDeleteModalVisible(false);
      setDeleteSingleId(null);

      await fetchPage(nextPage, filter);
    } catch (error) {
      console.log("DELETE TODO ERROR:", error);
    } finally {
      setDeletingMultiple(false);
    }
  };

  /* =========================================================
   * DELETE ALL COMPLETED / PENDING
   *
   * Uses existing deleteTodo API.
   *
   * It repeatedly loads page 1 of the
   * selected status and deletes those IDs.
   * ========================================================= */

  const performBulkDelete = async () => {
    if (!deleteType) {
      return;
    }

    try {
      setDeletingMultiple(true);

      const status =
        deleteType === "completed" ? "completed" : "pending";

      /*
       * Keep requesting page 1.
       *
       * After deleting the current page,
       * the next records move into page 1.
       */

      while (true) {
        const response = await getTodos({
          page: 1,
          limit: PAGE_SIZE,
            status,
        });

        const data = response.data?.data || [];

        if (!Array.isArray(data) || data.length === 0) {
          break;
        }

        for (const todo of data) {
          await deleteTodo(todo._id);
        }
      }

      /*
       * Important:
       * After bulk deletion reset the
       * filter to Newly added.
       */

      setFilter("newest");
      setSearch("");
      setShowMultipleDelete(false);
      setDeleteModalVisible(false);
      setDeleteType(null);

      await fetchPage(1, "newest");
    } catch (error) {
      console.log("BULK DELETE ERROR:", error);
    } finally {
      setDeletingMultiple(false);
    }
  };

  /* =========================================================
   * CONFIRM DELETE
   * ========================================================= */

  const handleConfirmDelete = async () => {
    if (deleteSingleId) {
      await performSingleDelete();
      return;
    }

    if (deleteType) {
      await performBulkDelete();
    }
  };

  /* =========================================================
   * FRONTEND SEARCH + SORT
   * ========================================================= */

  const filteredTodos = [...todos]
    .filter((todo) => {
      const query = search.trim().toLowerCase();

      if (!query) {
        return true;
      }

      return (
        todo.title?.toLowerCase().includes(query) ||
        todo.description?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      const dateA = a.createdAt
        ? new Date(a.createdAt).getTime()
        : 0;

      const dateB = b.createdAt
        ? new Date(b.createdAt).getTime()
        : 0;

      if (filter === "oldest") {
        return dateA - dateB;
      }

      return dateB - dateA;
    });

  /* =========================================================
   * FILTER LABEL
   * ========================================================= */

  const getFilterLabel = () => {
    switch (filter) {
      case "oldest":
        return "Oldest";
      case "completed":
        return "Completed";
      case "pending":
        return "Pending";
      case "newest":
      default:
        return "Newly added";
    }
  };

  return {
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
  };
}
