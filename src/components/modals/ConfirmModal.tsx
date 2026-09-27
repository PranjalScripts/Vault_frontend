import React from "react";
import { FeedbackDialog, FeedbackProps } from "./FeedbackDialog";
export function ConfirmModal(props: FeedbackProps & { onConfirm: () => void; busy?: boolean; error?: string }) {
  return <FeedbackDialog buttonLabel="Delete" {...props} kind="confirm" />;
}
