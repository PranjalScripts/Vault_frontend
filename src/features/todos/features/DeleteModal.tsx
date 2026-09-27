import React from "react";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { DeleteType } from "./types";

interface DeleteModalProps {
  visible: boolean;
  deleteType: DeleteType;
  deleteSingleId: string | null;
  deletingMultiple: boolean;
  theme: any;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteModal({ visible, deleteType, deletingMultiple, onClose, onConfirm }: DeleteModalProps) {
  return <ConfirmModal visible={visible}
    title={deleteType ? `Delete ${deleteType} tasks?` : "Delete Task?"}
    message={deleteType ? `Are you sure you want to delete all ${deleteType} tasks? You can restore them from Recently Deleted during the restore period.` : "Are you sure you want to delete this task? This action cannot be undone."}
    busy={deletingMultiple} onClose={onClose} onConfirm={onConfirm} />;
}
