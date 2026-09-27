import React from "react";
import { FeedbackDialog, FeedbackProps } from "./FeedbackDialog";
export function ErrorModal(props: FeedbackProps) { return <FeedbackDialog {...props} kind="error" />; }
