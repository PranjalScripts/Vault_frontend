export type Todo = {
  _id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  createdAt?: string;
};

export type FilterType =
  | "newest"
  | "oldest"
  | "completed"
  | "pending";

export type DeleteType =
  | "completed"
  | "pending"
  | null;

export const PAGE_SIZE = 20;
