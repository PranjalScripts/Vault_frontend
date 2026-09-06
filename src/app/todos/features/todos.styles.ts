import { Platform, StyleSheet } from "react-native";

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    minHeight: 0,
    width: "100%",
  },

  /* =======================================================
   * HEADER
   * ======================================================= */

  fixedHeader: {
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 4,
  },

  mobileFixedHeader: {
    paddingHorizontal: 4,
    paddingTop: 0,
  },

  desktopFixedHeader: {
    maxWidth: 1280,
    width: "100%",
    alignSelf: "center",
  },

  /* =======================================================
   * LIST
   * ======================================================= */

  flatList: {
    flex: 1,
    minHeight: 0,
    width: "100%",
  },

  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 16,
  },

  mobileListContent: {
    paddingHorizontal: 4,
    paddingBottom: 8,
  },

  desktopListContent: {
    paddingBottom: 24,
    maxWidth: 1280,
    width: "100%",
    alignSelf: "center",
  },

  columnWrapper: {
    width: "100%",
    gap: 12,
  },

  /* =======================================================
   * TITLE
   * ======================================================= */

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  titleBlock: {
    flex: 1,
    minWidth: 0,
  },

  headingRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  heading: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "700",
    letterSpacing: -0.9,
  },

  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },

  mobileCounter: {
    marginLeft: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },

  mobileCounterText: {
    fontSize: 11,
    fontWeight: "700",
  },

  counter: {
    flexDirection: "row",
    alignItems: "baseline",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    marginLeft: 14,
  },

  counterNumber: {
    fontSize: 14,
    fontWeight: "700",
  },

  counterTotal: {
    fontSize: 11,
  },

  /* =======================================================
   * COMPOSER
   * ======================================================= */

  composer: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    paddingLeft: 5,
    marginBottom: 8,

    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.03,
        shadowRadius: 8,
        shadowOffset: {
          width: 0,
          height: 2,
        },
      },

      android: {
        elevation: 1,
      },

      web: {
        boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
      },
    }),
  },

  plusBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },

  plus: {
    fontSize: 21,
    lineHeight: 23,
    fontWeight: "400",
  },

  input: {
    flex: 1,
    minWidth: 0,
    height: 36,
    paddingHorizontal: 4,
    fontSize: 13,
    outlineStyle: "none",
  } as any,

  addButton: {
    height: 36,
    minWidth: 58,
    paddingHorizontal: 12,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },

  addIcon: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
  },

  addText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  multipleDeleteButton: {
    height: 36,
    paddingHorizontal: 10,
    borderRadius: 9,
    borderWidth: 1,
    marginLeft: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },

  multipleDeleteIcon: {
    fontSize: 18,
    lineHeight: 19,
    fontWeight: "600",
  },

  multipleDeleteText: {
    fontSize: 11.5,
    fontWeight: "600",
  },

  mobileMultipleDeleteWrapper: {
    marginBottom: 8,
  },

  mobileMultipleDeleteButton: {
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },

  mobileMultipleDeleteIcon: {
    fontSize: 18,
    lineHeight: 19,
    fontWeight: "600",
  },

  mobileMultipleDeleteText: {
    fontSize: 12,
    fontWeight: "600",
  },

  disabled: {
    opacity: 0.5,
  },

  /* =======================================================
   * TOOLBAR
   * ======================================================= */

  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 8,
    marginBottom: 8,
  },

  mobileToolbar: {
    gap: 6,
  },

  searchBox: {
    height: 40,
    flex: 1,
    minWidth: 110,
    maxWidth: 440,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
  },

  mobileSearchBox: {
    minWidth: 0,
  },

  searchIcon: {
    fontSize: 17,
    lineHeight: 20,
    marginRight: 6,
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    height: 36,
    paddingHorizontal: 0,
    fontSize: 13,
    outlineStyle: "none",
  } as any,

  filterButton: {
    height: 40,
    minWidth: 40,
    paddingHorizontal: 11,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  filterIcon: {
    fontSize: 16,
    lineHeight: 19,
    fontWeight: "600",
  },

  filterText: {
    fontSize: 12,
    fontWeight: "600",
  },

  /* =======================================================
   * FILTER / DELETE OVERLAY
   * ======================================================= */

  filterOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },

  filterMenu: {
    position: "absolute",
    borderRadius: 12,
    borderWidth: 1,
    padding: 5,
    zIndex: 99999,

    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.14,
        shadowRadius: 14,
        shadowOffset: {
          width: 0,
          height: 6,
        },
      },

      android: {
        elevation: 22,
      },

      web: {
        boxShadow: "0 8px 22px rgba(0,0,0,0.12)",
      },
    }),
  },

  filterOption: {
    minHeight: 42,
    borderRadius: 9,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
  },

  filterOptionIcon: {
    width: 24,
    fontSize: 14,
    fontWeight: "700",
  },

  filterOptionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
  },

  filterCheck: {
    fontSize: 14,
    fontWeight: "700",
  },

  deleteMenuOption: {
    minHeight: 44,
    borderRadius: 9,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
  },

  deleteMenuIcon: {
    width: 26,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },

  deleteMenuText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: "600",
    marginLeft: 3,
  },

  /* =======================================================
   * PAGINATION
   * ======================================================= */

  pageIndicator: {
    height: 40,
    minWidth: 68,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  pageNumber: {
    fontSize: 12,
    fontWeight: "700",
  },

  pageOf: {
    fontSize: 11,
  },

  totalPages: {
    fontSize: 11,
  },

  arrowButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  arrowText: {
    fontSize: 22,
    lineHeight: 25,
    fontWeight: "400",
    marginTop: -2,
  },

  arrowDisabled: {
    opacity: 0.38,
  },

  /* =======================================================
   * SECTION
   * ======================================================= */

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    marginTop: 4,
  },

  sectionLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  sectionIndicator: {
    width: 4,
    height: 15,
    borderRadius: 3,
    marginRight: 8,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
  },

  sectionCount: {
    fontSize: 12,
  },

  /* =======================================================
   * CARD
   * ======================================================= */

  card: {
    flex: 1,
    minWidth: 0,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,

    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.03,
        shadowRadius: 8,
        shadowOffset: {
          width: 0,
          height: 2,
        },
      },

      android: {
        elevation: 1,
      },

      web: {
        boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
      },
    }),
  },

  mobileCard: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },

  desktopCard: {
    flexBasis: 0,
  },

  /* =======================================================
   * CARD TOP
   * ======================================================= */

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 11,
  },

  cardTopLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  serialNumber: {
    minWidth: 27,
    height: 25,
    paddingHorizontal: 6,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },

  serialNumberText: {
    fontSize: 10,
    fontWeight: "700",
  },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },

  tick: {
    color: "#fff",
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "800",
  },

  status: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 5,
  },

  statusText: {
    fontSize: 10.5,
    fontWeight: "700",
  },

  /* =======================================================
   * TITLE
   * ======================================================= */

  cardTitle: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "600",
    letterSpacing: -0.15,
  },

  completedTitle: {
    textDecorationLine: "line-through",
    opacity: 0.42,
  },

  description: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 5,
    opacity: 0.8,
  },

  completedDescription: {
    opacity: 0.38,
  },

  /* =======================================================
   * BOTTOM
   * ======================================================= */

  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },

  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  dateIcon: {
    fontSize: 13,
    marginRight: 4,
    opacity: 0.7,
  },

  date: {
    fontSize: 11,
  },

  deleteButton: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },

  deleteText: {
    fontSize: 11,
    fontWeight: "600",
  },

  /* =======================================================
   * EMPTY
   * ======================================================= */

  loadingContainer: {
    height: 140,
    alignItems: "center",
    justifyContent: "center",
  },

  empty: {
    minHeight: 180,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  emptyIconText: {
    fontSize: 20,
    fontWeight: "700",
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },

  emptyText: {
    fontSize: 12.5,
    textAlign: "center",
  },

  /* =======================================================
   * DELETE MODAL
   * ======================================================= */

  modalContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  modalBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  deleteModal: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 18,
    borderWidth: 1,
    padding: 22,

    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 20,
        shadowOffset: {
          width: 0,
          height: 8,
        },
      },

      android: {
        elevation: 12,
      },

      web: {
        boxShadow: "0 12px 35px rgba(0,0,0,0.18)",
      },
    }),
  },

  deleteModalIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
  },

  deleteModalIconText: {
    fontSize: 23,
    fontWeight: "700",
  },

  deleteModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 7,
  },

  deleteModalMessage: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 20,
  },

  deleteModalActions: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
  },

  cancelButton: {
    minWidth: 90,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },

  cancelButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },

  confirmDeleteButton: {
    minWidth: 90,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },

  confirmDeleteText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
});

export default styles;
