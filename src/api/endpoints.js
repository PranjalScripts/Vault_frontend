import API, { forceRefresh } from "./client";

export const googleLogin = (idToken) => API.post("/auth/google", { idToken });

/** @param {{ page?: number, limit?: number, search?: string, sort?: string }} [options] */
export const getSubjects = (options = {}) =>
  API.get("/subjects/getAll-subjects", { params: options });

export const refreshSubjects = () => forceRefresh("/subjects/getAll-subjects");

export const getSubject = (id) => API.get(`/subjects/${id}`);

export const createSubject = (subjectName) =>
  API.post("/subjects/create-subject", { subjectName });

export const updateSubject = (id, data) =>
  API.put(`/subjects/${id}`, typeof data === "string" ? { subjectName: data } : data);

export const addTopic = (subjectId, topicData) =>
  API.post(`/subjects/${subjectId}/topics`, topicData);

export const deleteSubject = (subjectId) =>
  API.delete(`/subjects/${subjectId}`);

export const updateTopic = (subjectId, topicId, topicData) =>
  API.put(`/subjects/${subjectId}/topics/${topicId}`, topicData);

export const deleteTopic = (subjectId, topicId) =>
  API.delete(`/subjects/${subjectId}/topics/${topicId}`);

/** @param {{ page?: number, limit?: number, status?: "completed" | "pending", search?: string, sort?: string, category?: string, due?: string, itemId?: string }} [options] */
export const getTodos = ({
  page = 1,
  limit = 10,
  status,
  search,
  sort,
  category,
  due,
  itemId,
} = {}) =>
  API.get("/todos", {
    params: {
      page,
      limit,
      ...(itemId ? { itemId } : {}),
      ...(status && status !== "all" ? { status } : {}),
      ...(search?.trim() ? { search: search.trim() } : {}),
      ...(sort ? { sort } : {}),
      ...(category && category !== "all" ? { category } : {}),
      ...(due && due !== "all" ? { due } : {}),
    },
  });

export const getTodoStats = () => API.get("/todos/stats");

export const createTodo = (todoData) => API.post("/todos", todoData);

export const updateTodo = (todoId, todoData) =>
  API.put(`/todos/${todoId}`, todoData);

export const deleteTodo = (todoId) => API.delete(`/todos/${todoId}`);

export const getVault = () => API.get("/vault");

export const createVault = ({
  salt,
  masterVaultKey,
  passwordWrappedVaultKey,
  verifier,
}) =>
  API.post("/vault", {
    passwordSalt: salt,
    passwordWrappedVaultKey,
    masterVaultKey,
    verifier,
  });

export const getPasscodes = ({
  page = 1,
  limit = 20,
  search = "",
  sort = "newest",
  itemId = "",
} = {}) =>
  API.get("/passcodes", {
    params: {
      page,
      limit,
      ...(itemId ? { itemId } : {}),
      ...(search.trim() ? { search: search.trim() } : {}),
      sort,
    },
  });

export const createPasscode = (passcodeData) =>
  API.post("/passcodes", passcodeData);

export const updatePasscode = (id, data) => API.put(`/passcodes/${id}`, data);

export const deletePasscode = (passcodeId) =>
  API.delete(`/passcodes/${passcodeId}`);

// =========================================================
// VAULT RECOVERY
// =========================================================

export const sendVaultRecoveryOtp = () => API.post("/vault/recovery/otp", {});

export const verifyVaultRecoveryOtp = (otp) =>
  API.post("/vault/recovery/verify", { otp });

export const getVaultRecoveryPayload = (recoveryToken) =>
  API.post("/vault/recovery/key", { recoveryToken });

export const resetVaultPassword = ({
  recoveryToken,
  passwordSalt,
  passwordWrappedVaultKey,
  verifier,
}) =>
  API.post("/vault/recovery/reset", {
    recoveryToken,
    passwordSalt,
    passwordWrappedVaultKey,
    verifier,
  });

export const getTrash = () => forceRefresh("/trash");
export const restoreTrash = (kind, id, subjectId) =>
  API.post(`/trash/${kind}/${id}/restore`, { subjectId });

export const universalSearch = (params, signal) => API.get("/search", { params, signal });

export const createSubjectShare = (id, topicId) => API.post(`/subjects/${id}/share`, { topicId });

export const deleteTrashItem = (kind, id, subjectId) => API.delete(`/trash/${kind}/${id}`, { data: { subjectId } });
export const emptyTrash = () => API.delete("/trash");
export const importSharedSubject = (token) => API.post(`/subjects/shared/${token}/import`);
