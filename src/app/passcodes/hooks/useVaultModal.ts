import { useCallback, useState } from "react";

export function useVaultModal() {
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [vaultPassword, setVaultPassword] = useState("");
  const [confirmVaultPassword, setConfirmVaultPassword] = useState("");
  const [showVaultPassword, setShowVaultPassword] = useState(false);
  const [showConfirmVaultPassword, setShowConfirmVaultPassword] = useState(false);
  const [vaultError, setVaultError] = useState("");

  const resetVaultModal = useCallback(() => {
    setVaultPassword("");
    setConfirmVaultPassword("");
    setVaultError("");
    setShowVaultPassword(false);
    setShowConfirmVaultPassword(false);
  }, []);

  return {
    showVaultModal,
    setShowVaultModal,
    vaultPassword,
    setVaultPassword,
    confirmVaultPassword,
    setConfirmVaultPassword,
    showVaultPassword,
    setShowVaultPassword,
    showConfirmVaultPassword,
    setShowConfirmVaultPassword,
    vaultError,
    setVaultError,
    resetVaultModal,
  };
}
