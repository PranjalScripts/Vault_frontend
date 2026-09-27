import React from "react";
import { FeedbackDialog, FeedbackProps } from "./FeedbackDialog";
export function SuccessModal(props: FeedbackProps) { return <FeedbackDialog {...props} kind="success" />; }
