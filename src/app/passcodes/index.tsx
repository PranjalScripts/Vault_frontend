import { useTheme } from "@/hooks/use-theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Pressable, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import Feather from "@expo/vector-icons/Feather";
import Toast from "react-native-toast-message";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

import { Button } from "@/components/subjects/SubjectUI";
import { AppLayout } from "@/components/AppLayout";

import {
  getPasscodes,
  createPasscode,
  updatePasscode,
  deletePasscode,
} from "@/api/api";

import { entryCategory, type Category } from "@/features/passcodes/presentation";
import { PasscodeDetails } from "@/features/passcodes/components/PasscodeDetails";

import { useVault } from "@/contexts/vaultContext";

import { encryptWithVaultKey, decryptWithVaultKey } from "@/crypto/vaultCrypto";
import type { Passcode, RawPasscode, SortOption } from "@/features/passcodes/types";
import { isEncryptedField } from "@/features/passcodes/utils/passcodeCrypto";
import { PasscodeCard } from "@/features/passcodes/components/PasscodeCard";
import { PasscodeForm } from "@/features/passcodes/components/PasscodeForm";
import { PasscodesHeader } from "@/features/passcodes/components/PasscodesHeader";
import { PasscodeModals } from "@/features/passcodes/components/PasscodeModals";
import { styles } from "@/features/passcodes/styles";
import { VaultModal } from "@/features/passcodes/components/VaultModal";
import { VaultStateView } from "@/features/passcodes/components/VaultStateView";
import ForgotVaultPasswordModal from "@/components/ForgotVaultPasswordModal";
import { usePasscodeForm } from "@/features/passcodes/hooks/usePasscodeForm";
import { usePasscodes } from "@/features/passcodes/hooks/usePasscodes";
import { useVaultModal } from "@/features/passcodes/hooks/useVaultModal";

const DEFAULT_PAGE_SIZE = 20;

// =====================================================
// COMPONENT
// =====================================================

export default function PasscodesScreen() {
  const theme = useTheme();
  const dark = useColorScheme() === "dark";
  const [category, setCategory] = useState<Category>("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { itemId } = useLocalSearchParams<{ itemId?: string }>();
  const router = useRouter();

  const {
    vaultKey,
    isVaultCreated,
    isVaultUnlocked,
    isLoading: isVaultLoading,
    unlockVault,
    setupVault,
    refreshVault,
    completeVaultRecovery,
  } = useVault();

  useEffect(() => {
    if (!isVaultUnlocked) setSelectedId(null);
  }, [isVaultUnlocked]);

  // =====================================================
  // STATE
  // =====================================================

  const [passcodes, setPasscodes] = useState<Passcode[]>([]);

  const {
    platform,
    setPlatform,
    username,
    setUsername,
    password,
    setPassword,
    showForm,
    setShowForm,
    cancelCreate,
  } = usePasscodeForm();

  const [loading, setLoading] = useState(true);

  const [creating, setCreating] = useState(false);

  const [updating, setUpdating] = useState(false);

  const [deleting, setDeleting] = useState(false);

  const { revealedIds, copiedField, toggleReveal, copyToClipboard } =
    usePasscodes();

  const [editingPasscode, setEditingPasscode] = useState<Passcode | null>(null);

  const [editUsername, setEditUsername] = useState("");

  const [editPassword, setEditPassword] = useState("");

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [sortOption, setSortOption] = useState<SortOption>("newest");

  const [showSortOptions, setShowSortOptions] = useState(false);

  // =====================================================
  // VAULT SETUP / UNLOCK STATE
  // =====================================================

  const {
    showVaultModal,
    setShowVaultModal,
    vaultPassword,
    setVaultPassword,
    confirmVaultPassword,
    setConfirmVaultPassword,
    vaultError,
    setVaultError,
    showVaultPassword,
    setShowVaultPassword,
    showConfirmVaultPassword,
    setShowConfirmVaultPassword,
    resetVaultModal,
  } = useVaultModal();

  const [unlocking, setUnlocking] = useState(false);

  const [creatingVault, setCreatingVault] = useState(false);

  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  // =====================================================
  // PAGINATION STATE
  // =====================================================

  const [page, setPage] = useState(1);

  const [pageSize] = useState(DEFAULT_PAGE_SIZE);

  const [totalPages, setTotalPages] = useState(1);

  const [totalRecords, setTotalRecords] = useState(0);

  const [hasNextPage, setHasNextPage] = useState(false);

  const [hasPreviousPage, setHasPreviousPage] = useState(false);

  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const isFirstSearchEffect = useRef(true);
  const previousSortForSearch = useRef(sortOption);

  // =====================================================
  // DECRYPT PASSCODE
  // =====================================================

  const decryptPasscode = useCallback(
    async (item: RawPasscode): Promise<Passcode> => {
      let decryptedUsername = "";
      let decryptedPassword = "";
      let decryptedSecurityAnswer: string | undefined;

      // -------------------------------------------------
      // USERNAME
      // -------------------------------------------------

      if (isEncryptedField(item.username)) {
        if (!vaultKey) {
          throw new Error("Vault is locked");
        }

        decryptedUsername = await decryptWithVaultKey(item.username, vaultKey);
      } else {
        decryptedUsername =
          typeof item.username === "string" ? item.username : "";
      }

      // -------------------------------------------------
      // PASSWORD
      // -------------------------------------------------

      if (isEncryptedField(item.password)) {
        if (!vaultKey) {
          throw new Error("Vault is locked");
        }

        decryptedPassword = await decryptWithVaultKey(item.password, vaultKey);
      } else {
        decryptedPassword =
          typeof item.password === "string" ? item.password : "";
      }

      // -------------------------------------------------
      // SECURITY ANSWER
      // -------------------------------------------------

      if (isEncryptedField(item.securityAnswer)) {
        if (!vaultKey) {
          throw new Error("Vault is locked");
        }

        decryptedSecurityAnswer = await decryptWithVaultKey(
          item.securityAnswer,
          vaultKey,
        );
      } else if (typeof item.securityAnswer === "string") {
        decryptedSecurityAnswer = item.securityAnswer;
      }

      return {
        _id: item._id,
        platform: item.platform,
        username: decryptedUsername,
        password: decryptedPassword,
        securityAnswer: decryptedSecurityAnswer,
        createdAt: item.createdAt,
        category: item.category,
        website: item.website,
        updatedAt: item.updatedAt,
        srNo: item.srNo,
      };
    },
    [vaultKey],
  );

  // =====================================================
  // FETCH PAGE
  // =====================================================

  const fetchPage = useCallback(
    async (
      requestedPage: number,
      requestedPageSize: number,
      searchValue: string,
      requestedSort: SortOption,
    ) => {
      try {
        setLoading(true);

        const response = await getPasscodes({
          page: requestedPage,
          limit: requestedPageSize,
          search: itemId ? "" : searchValue.trim(),
          itemId,
          sort: requestedSort,
        });

        const rawData: RawPasscode[] = response?.data?.data || [];

        const pagination = response?.data?.pagination;

        // -------------------------------------------------
        // DECRYPT DATA
        // -------------------------------------------------

        let decryptedData: Passcode[] = [];

        if (rawData.length > 0) {
          if (!vaultKey) {
            throw new Error("Vault is locked. Please unlock your vault.");
          }

          decryptedData = await Promise.all(
            rawData.map((item) => decryptPasscode(item)),
          );
        }

        // -------------------------------------------------
        // LOCAL SEARCH
        // -------------------------------------------------

        const normalizedSearch = searchValue.trim().toLowerCase();

        if (normalizedSearch && !itemId) {
          decryptedData = decryptedData.filter(
            (item) =>
              item.platform.toLowerCase().includes(normalizedSearch) ||
              item.username.toLowerCase().includes(normalizedSearch),
          );
        }

        setPasscodes(decryptedData);

        const returnedPage = pagination?.page ?? requestedPage;

        const returnedLimit = pagination?.limit ?? requestedPageSize;

        const returnedTotal = pagination?.total ?? 0;

        const returnedTotalPages =
          pagination?.totalPages ??
          Math.max(1, Math.ceil(returnedTotal / returnedLimit));

        setPage(returnedPage);

        setTotalRecords(returnedTotal);

        setTotalPages(returnedTotalPages);

        setHasNextPage(
          pagination?.hasNextPage ?? returnedPage < returnedTotalPages,
        );

        setHasPreviousPage(pagination?.hasPreviousPage ?? returnedPage > 1);

        setInitialLoadDone(true);
      } catch (error: any) {
        console.log("GET PASSCODES ERROR:", error);

        if (!isVaultCreated || (!isVaultUnlocked && !vaultKey)) {
          return;
        }

        Toast.show({
          type: "error",
          text1: "Unable to load passcodes",
          text2: error?.message || "Please try again.",
        });
      } finally {
        setLoading(false);
      }
    },
    [decryptPasscode, isVaultCreated, isVaultUnlocked, vaultKey, itemId],
  );

  // =====================================================
  // INITIAL / FOCUS LOAD
  // =====================================================

  useFocusEffect(
    useCallback(() => {
      if (isVaultLoading) {
        setLoading(true);
        return;
      }

      if (!isVaultCreated) {
        setPasscodes([]);
        setLoading(false);
        setShowForm(false);
        return;
      }

      if (!isVaultUnlocked || !vaultKey) {
        setPasscodes([]);
        setLoading(false);
        return;
      }

      fetchPage(1, pageSize, search, sortOption);
    }, [
      fetchPage,
      pageSize,
      search,
      sortOption,
      isVaultCreated,
      isVaultUnlocked,
      vaultKey,
      isVaultLoading,
      setShowForm,
    ]),
  );

  // =====================================================
  // SEARCH
  // =====================================================

  useEffect(() => {
    if (!initialLoadDone) {
      return;
    }

    if (previousSortForSearch.current !== sortOption) {
      previousSortForSearch.current = sortOption;

      if (!isFirstSearchEffect.current) {
        return;
      }
    }

    if (isFirstSearchEffect.current) {
      isFirstSearchEffect.current = false;
      return;
    }

    if (!isVaultCreated || !isVaultUnlocked || !vaultKey) {
      return;
    }

    const timer = setTimeout(() => {
      fetchPage(1, pageSize, search, sortOption);
    }, 350);

    return () => clearTimeout(timer);
  }, [
    search,
    initialLoadDone,
    fetchPage,
    pageSize,
    sortOption,
    isVaultCreated,
    isVaultUnlocked,
    vaultKey,
  ]);

  // =====================================================
  // OPEN VAULT MODAL
  // =====================================================

  const openVaultModal = () => {
    if (isVaultLoading) {
      return;
    }

    resetVaultModal();

    setShowVaultModal(true);
  };

  // =====================================================
  // CREATE VAULT
  // =====================================================

  const handleCreateVault = async () => {
    const trimmedPassword = vaultPassword.trim();

    const trimmedConfirmPassword = confirmVaultPassword.trim();

    if (!trimmedPassword) {
      setVaultError("Please create a vault password.");

      return;
    }

    if (trimmedPassword.length < 6) {
      setVaultError("Vault password must be at least 6 characters.");

      return;
    }

    if (!trimmedConfirmPassword) {
      setVaultError("Please confirm your vault password.");

      return;
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      setVaultError("Vault passwords do not match.");

      return;
    }

    try {
      setCreatingVault(true);
      setVaultError("");

      await setupVault(trimmedPassword);

      setVaultPassword("");
      setConfirmVaultPassword("");

      setShowVaultPassword(false);
      setShowConfirmVaultPassword(false);

      setShowVaultModal(false);

      setVaultError("");

      Toast.show({
        type: "success",
        text1: "Vault created",
        text2: "Your vault is ready. You can now save passcodes.",
      });
    } catch (error: any) {
      console.log("CREATE VAULT ERROR:", error);

      setVaultError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to create vault.",
      );
    } finally {
      setCreatingVault(false);
    }
  };

  // =====================================================
  // UNLOCK VAULT
  // =====================================================

  const handleUnlock = async () => {
    if (unlocking) return;
    const enteredPassword = vaultPassword;

    if (!enteredPassword) {
      setVaultError("Please enter your vault password.");

      return;
    }

    try {
      setUnlocking(true);
      setVaultError("");

      const success = await unlockVault(enteredPassword);

      if (!success) {
        setVaultError("Incorrect vault password. Please try again.");

        return;
      }

      setVaultPassword("");
      setConfirmVaultPassword("");

      setShowVaultPassword(false);
      setShowConfirmVaultPassword(false);

      setShowVaultModal(false);

      setVaultError("");

      Toast.show({
        type: "success",
        text1: "Vault unlocked",
        text2: "Your saved credentials are now available.",
      });
    } catch (error: any) {
      setVaultError(error?.message || "Unable to unlock vault.");
    } finally {
      setUnlocking(false);
    }
  };

  // =====================================================
  // CLOSE VAULT MODAL
  // =====================================================

  const closeVaultModal = () => {
    if (unlocking || creatingVault) {
      return;
    }

    setShowVaultModal(false);

    resetVaultModal();
  };

  const openForgotPasswordModal = () => {
    if (unlocking || creatingVault) {
      return;
    }

    console.log("OLD MASTER KEY LENGTH:", vaultKey?.length);

    setShowVaultModal(false);
    resetVaultModal();
    setShowForgotPasswordModal(true);
  };

  // =====================================================
  // GO TO PREVIOUS PAGE
  // =====================================================

  const goToPreviousPage = async () => {
    if (loading || !hasPreviousPage || page <= 1) {
      return;
    }

    await fetchPage(page - 1, pageSize, search, sortOption);
  };

  // =====================================================
  // GO TO NEXT PAGE
  // =====================================================

  const goToNextPage = async () => {
    if (loading || !hasNextPage || page >= totalPages) {
      return;
    }

    await fetchPage(page + 1, pageSize, search, sortOption);
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
  // CREATE PASSCODE
  // =====================================================

  const handleCreate = async () => {
    if (!platform.trim() || !username.trim() || !password) {
      Toast.show({
        type: "info",
        text1: "Missing fields",
        text2: "Please enter platform, username and password.",
      });

      return;
    }

    /*
     * Vault state check
     */
    if (isVaultLoading) {
      Toast.show({
        type: "info",
        text1: "Please wait",
        text2: "Checking vault status...",
      });

      return;
    }

    if (!isVaultCreated) {
      setShowForm(false);
      openVaultModal();
      return;
    }

    if (!isVaultUnlocked || !vaultKey) {
      setShowForm(false);
      openVaultModal();
      return;
    }

    try {
      setCreating(true);

      const savedPlatform = platform.trim();

      const savedUsername = username.trim();

      const encryptedPassword = await encryptWithVaultKey(password, vaultKey);

      await createPasscode({
        platform: savedPlatform,
        username: savedUsername,
        password: encryptedPassword,
      });

      setPlatform("");
      setUsername("");
      setPassword("");

      setShowForm(false);

      await fetchPage(1, pageSize, search, sortOption);

      Toast.show({
        type: "success",
        text1: "Passcode saved",
        text2: `${savedPlatform} was added successfully.`,
      });
    } catch (error: any) {
      console.log("CREATE PASSCODE ERROR:", error);

      Toast.show({
        type: "error",
        text1: "Save failed",
        text2:
          error?.response?.data?.message ||
          error?.message ||
          "Unable to save passcode.",
      });
    } finally {
      setCreating(false);
    }
  };

  // =====================================================
  // EDIT
  // =====================================================

  const handleEdit = (item: Passcode) => {
    if (!isVaultCreated || !isVaultUnlocked || !vaultKey) {
      openVaultModal();
      return;
    }

    setEditingPasscode(item);

    setEditUsername(item.username);

    setEditPassword(item.password || "");
  };

  // =====================================================
  // UPDATE
  // =====================================================

  const handleUpdate = async () => {
    if (!editingPasscode) {
      return;
    }

    if (!editUsername.trim() || !editPassword.trim()) {
      Toast.show({
        type: "info",
        text1: "Missing fields",
        text2: "Username and password are required.",
      });

      return;
    }

    const usernameChanged =
      editUsername.trim() !== editingPasscode.username.trim();
    const passwordChanged = editPassword !== (editingPasscode.password || "");

    if (!usernameChanged && !passwordChanged) {
      setEditingPasscode(null);
      setEditUsername("");
      setEditPassword("");
      return;
    }
    if (!isVaultCreated || !isVaultUnlocked || !vaultKey) {
      Toast.show({
        type: "info",
        text1: "Vault is locked",
        text2: "Unlock your vault before updating a passcode.",
      });
      return;
    }

    try {
      setUpdating(true);

      const encryptedPassword = await encryptWithVaultKey(
        editPassword,
        vaultKey,
      );

      await updatePasscode(editingPasscode._id, {
        username: editUsername.trim(),

        password: encryptedPassword,
      });

      await fetchPage(page, pageSize, search, sortOption);

      setEditingPasscode(null);

      setEditUsername("");
      setEditPassword("");

      Toast.show({
        type: "success",
        text1: "Passcode updated",
        text2: "Your credentials updated successfully.",
      });
    } catch (error: any) {
      console.log("UPDATE PASSCODE ERROR:", error);

      Toast.show({
        type: "error",
        text1: "Update failed",
        text2: error?.message || "Unable to update passcode.",
      });
    } finally {
      setUpdating(false);
    }
  };

  // =====================================================
  // DELETE
  // =====================================================

  const handleDelete = (id: string) => {
    if (!isVaultCreated || !isVaultUnlocked || !vaultKey) {
      openVaultModal();
      return;
    }

    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) {
      return;
    }

    try {
      setDeleting(true);

      await deletePasscode(deleteConfirmId);
      if (selectedId === deleteConfirmId) setSelectedId(null);

      const targetPage = page > 1 && passcodes.length === 1 ? page - 1 : page;

      setDeleteConfirmId(null);

      await fetchPage(targetPage, pageSize, search, sortOption);

      Toast.show({
        type: "success",
        text1: "Passcode deleted",
        text2: "The passcode was removed successfully.",
      });
    } catch (error: any) {
      console.log("DELETE PASSCODE ERROR:", error?.response?.data || error);

      Toast.show({
        type: "error",
        text1: "Delete failed",
        text2: error?.response?.data?.message || "Unable to delete passcode.",
      });
    } finally {
      setDeleting(false);
    }
  };

  const renderPasscode = (item: Passcode) => (
    <PasscodeCard
      key={item._id}
      item={item}
      onOpen={(entry) => setSelectedId(entry._id)}
      isRevealed={revealedIds.has(item._id)}
      copiedField={copiedField}
      onDelete={handleDelete}
      onEdit={handleEdit}
      onToggleReveal={toggleReveal}
      onCopy={copyToClipboard}
    />
  );

  // =====================================================
  // UI
  // =====================================================

  const selectedPasscode = passcodes.find(item => item._id === selectedId);
  const showingDetails = !!selectedPasscode && isVaultUnlocked && !!vaultKey;
  const activeOperation = showForgotPasswordModal ? 'recovery' : showVaultModal ? 'unlock' : deleteConfirmId ? 'delete' : editingPasscode ? 'edit' : showForm ? 'add' : null;
  const activeView = activeOperation || (showingDetails ? 'details' : 'list');
  const operationBusy = creating || updating || deleting || unlocking || creatingVault;
  const managementModals = <PasscodeModals
            editingPasscode={activeOperation === "edit" ? editingPasscode : null}
            setEditingPasscode={setEditingPasscode}
            theme={theme}
            editUsername={editUsername}
            setEditUsername={setEditUsername}
            editPassword={editPassword}
            setEditPassword={setEditPassword}
            updating={updating}
            handleUpdate={handleUpdate}
            deleteConfirmId={activeOperation === "delete" ? deleteConfirmId : null}
            setDeleteConfirmId={setDeleteConfirmId}
            deleting={deleting}
            confirmDelete={confirmDelete}
          />;

  return (
    <AppLayout
      key={activeView}
      mobileTitle="Passcodes"
      mobileSubtitle="Manage all your accounts in one place."
      themeOverride={theme}
      contentBackgroundColor={theme.background}
      mobileHeaderActions={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add passcode"
          disabled={isVaultLoading || operationBusy || activeOperation === "recovery"}
          onPress={() => {
            setEditingPasscode(null);
            setDeleteConfirmId(null);
            setShowForm(false);
            if (!isVaultCreated || !isVaultUnlocked || !vaultKey) openVaultModal();
            else setShowForm(true);
          }}
          style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center", opacity: isVaultLoading || operationBusy || activeOperation === "recovery" ? 0.5 : 1 }}
        >
          <Feather name="plus" size={27} color={theme.accent} />
        </Pressable>
      }
    >
      <StatusBar style={dark ? "light" : "dark"} />
      <View
        style={{
          padding: showingDetails || activeOperation ? 0 : 16,
          flex: 1,
        }}
      >
        <View style={[styles.container, { maxWidth: 900, width: "100%", alignSelf: "center" }]}>
          {!activeOperation && (showingDetails && selectedPasscode ? <PasscodeDetails key={selectedPasscode._id} item={selectedPasscode} onClose={() => setSelectedId(null)} onEdit={handleEdit} onDelete={handleDelete} onCopy={copyToClipboard} copiedField={copiedField} /> : <>
          {!!itemId && <Button label="Show all passcodes" secondary onPress={() => { router.setParams({ itemId: "" }); setSearch(""); }} />}
          <PasscodesHeader
            passcodes={passcodes}
            category={category}
            setCategory={setCategory}
            theme={theme}
            isVaultLoading={isVaultLoading}
            isVaultCreated={isVaultCreated}
            isVaultUnlocked={isVaultUnlocked}
            vaultKey={vaultKey}
            openVaultModal={openVaultModal}
            setShowForm={setShowForm}
            search={search}
            setSearch={setSearch}
            sortLabel={sortLabel}
            showSortOptions={showSortOptions}
            setShowSortOptions={setShowSortOptions}
            sortOption={sortOption}
            setSortOption={setSortOption}
            fetchPage={fetchPage}
            pageSize={pageSize}
            loading={loading}
            totalRecords={totalRecords}
            hasPreviousPage={hasPreviousPage}
            hasNextPage={hasNextPage}
            goToPreviousPage={goToPreviousPage}
            goToNextPage={goToNextPage}
          />

          </>)}

          <PasscodeForm
            showForm={activeOperation === "add"}
            theme={theme}
            cancelCreate={cancelCreate}
            platform={platform}
            setPlatform={setPlatform}
            username={username}
            setUsername={setUsername}
            password={password}
            setPassword={setPassword}
            creating={creating}
            handleCreate={handleCreate}
          />
          {!activeOperation && !showingDetails && <VaultStateView
            theme={theme}
            isVaultLoading={isVaultLoading}
            isVaultCreated={isVaultCreated}
            isVaultUnlocked={isVaultUnlocked}
            loading={loading}
            passcodes={passcodes.filter(item => category === "All" || entryCategory(item) === category)}
            search={search || (category !== "All" ? category : "")}
            openVaultModal={openVaultModal}
            renderPasscode={renderPasscode}
          />}

          <VaultModal
            showVaultModal={activeOperation === "unlock"}
            closeVaultModal={closeVaultModal}
            theme={theme}
            isVaultCreated={isVaultCreated}
            vaultPassword={vaultPassword}
            setVaultPassword={setVaultPassword}
            confirmVaultPassword={confirmVaultPassword}
            setConfirmVaultPassword={setConfirmVaultPassword}
            vaultError={vaultError}
            setVaultError={setVaultError}
            showVaultPassword={showVaultPassword}
            setShowVaultPassword={setShowVaultPassword}
            showConfirmVaultPassword={showConfirmVaultPassword}
            setShowConfirmVaultPassword={setShowConfirmVaultPassword}
            unlocking={unlocking}
            creatingVault={creatingVault}
            handleUnlock={handleUnlock}
            handleCreateVault={handleCreateVault}
            onForgotPassword={openForgotPasswordModal}
          />
          <ForgotVaultPasswordModal
            visible={activeOperation === "recovery"}
            onClose={() => setShowForgotPasswordModal(false)}
            onSuccess={(masterVaultKey) => {
              completeVaultRecovery(masterVaultKey);
              setShowForgotPasswordModal(false);
              void refreshVault();
            }}
          />
          {managementModals}

        </View>
      </View>
    </AppLayout>
  );
}