import type { Database } from "./supabase/types";

// Type-safe table helpers
export type Table<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTable<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateTable<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Available tables
export type Site = Table<"site">;

// Database utility functions
export const getTableName = <T extends keyof Database["public"]["Tables"]>(
  table: T
): string => {
  return table;
};

// Type-safe query builders (optional - for advanced usage)
export const createTypedQuery = <T extends keyof Database["public"]["Tables"]>(
  table: T
) => {
  return { table };
};
