export type Todo = {
  _id: string;
  title: string;
  description: string;
  category: string;
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

export const TODO_CATEGORIES = ["Personal", "Study", "Shopping", "Work", "Health", "Finance", "Home", "Travel", "Other"];
