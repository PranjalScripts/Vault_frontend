import { shadow } from "@/styles/shadow";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },

  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    justifyContent: "center",
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
    justifyContent: "center",
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

    ...shadow({ opacity: 0.12, radius: 12, x: 0, y: 5 }),
  },

  sortOption: {
    minHeight: 42,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    justifyContent: "center",
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
    justifyContent: "space-between",
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
    justifyContent: "center",
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
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    columnGap: 12,
    rowGap: 12,
  } as any,

  card: {
    borderRadius: 15,
    borderWidth: 1,
    overflow: "visible",
    position: "relative",
    minWidth: 0,
    maxWidth: 380,
    width: "100%",
  },

  cardHeader: {
    minHeight: 65,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    justifyContent: "center",
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
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    justifyContent: "center",
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
    justifyContent: "center",
    paddingVertical: 60,
  },

  loadingText: {
    fontSize: 12,
    marginTop: 10,
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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

  unlockButton: {
    marginTop: 18,
    minWidth: 150,
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },

  unlockButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },

  passwordInputWrapper: {
    position: "relative",
    width: "100%",
  },

  unlockInput: {
    width: "100%",
    height: 47,
    borderWidth: 1,
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingRight: 50,
    fontSize: 13,
  },

  passwordVisibilityButton: {
    position: "absolute",
    right: 5,
    top: 5,
    width: 38,
    height: 37,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },

  passwordVisibilityText: {
    fontSize: 17,
  },

  unlockError: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 7,
    fontWeight: "600",
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },

  unlockModal: {
    width: "100%",
    maxWidth: 440,
    borderRadius: 20,
    padding: 20,

    ...shadow({ opacity: 0.18, radius: 25, x: 0, y: 10 }),
    elevation: 15,
  },

  editModal: {
    width: "100%",
    maxWidth: 440,
    borderRadius: 20,
    padding: 20,

    ...shadow({ opacity: 0.18, radius: 25, x: 0, y: 10 }),
    elevation: 15,
  },

  deleteModal: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 20,
    padding: 20,

    ...shadow({ opacity: 0.18, radius: 25, x: 0, y: 10 }),
    elevation: 15,
  },

  modalTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },

  deleteModalTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },

  modalIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(100,100,100,0.08)",
  },

  unlockIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(100,100,100,0.08)",
  },

  modalIcon: {
    fontSize: 19,
  },

  unlockModalIcon: {
    fontSize: 19,
  },

  deleteIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },

  deleteModalIcon: {
    fontSize: 19,
  },

  modalCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
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
    marginTop: 18,
  },

  modalCancelButton: {
    flex: 1,
    height: 45,
    borderRadius: 11,
    borderWidth: 1,
    justifyContent: "center",
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
    justifyContent: "center",
    alignItems: "center",
  },

  modalUpdateText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },

  forgotPasswordButton: {
    alignItems: "center",
    paddingVertical: 12,
  },

  forgotPasswordText: {
    fontSize: 12,
    fontWeight: "700",
  },

  modalDeleteButton: {
    flex: 1,
    height: 45,
    borderRadius: 11,
    justifyContent: "center",
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
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
