import { useCallback, useState } from "react";

export function usePasscodeForm() {
  const [platform, setPlatform] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showForm, setShowForm] = useState(false);

  const resetForm = useCallback(() => {
    setPlatform("");
    setUsername("");
    setPassword("");
  }, []);

  const cancelCreate = useCallback(() => {
    resetForm();
    setShowForm(false);
  }, [resetForm]);

  return {
    platform,
    setPlatform,
    username,
    setUsername,
    password,
    setPassword,
    showForm,
    setShowForm,
    resetForm,
    cancelCreate,
  };
}
