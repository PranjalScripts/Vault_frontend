export type Todo = {
  _id: string;
  title: string;
  description: string;
  category: "Work" | "Study" | "Personal" | "Health" | "Other";
  priority: "low" | "medium" | "high";
  dueDate?: string | null;
  isCompleted: boolean;
  createdAt?: string;
};

export type TodoStatus = "all" | "completed" | "pending";
export type TodoSort = "newest" | "oldest" | "dueSoon" | "priority";
export type TodoCategory = Todo["category"];
export type FilterType = "newest" | "oldest" | "completed" | "pending";

export type DeleteType =
  | "completed"
  | "pending"
  | null;

export const PAGE_SIZE = 10;
