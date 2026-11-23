"use client";

/**
 * useQueryWithLoader
 *
 * Wraps a TanStack Query result and drives the global MomentumLoader
 * automatically based on query state — zero wiring boilerplate.
 *
 * @example — indeterminate (most queries)
 * const { data } = useQueryWithLoader(useFeedQuery(), "feed");
 *
 * @example — determinate (file download, multi-step sync)
 * const { data } = useQueryWithLoader(useWorkoutsQuery(), "workout", {
 *   getProgress: (data) => data?.downloadedCount / data?.totalCount,
 * });
 */

import { useEffect, useRef } from "react";
import { useLoaderStore, type LoadingContext } from "@/stores/loader-store";

interface QueryLike<TData = unknown> {
  status: unknown;
  isFetching: boolean;
  data?: TData;
  error?: unknown;
}

interface UseQueryWithLoaderOptions<TData> {
  /** Called with query data each fetch; return 0–1 to switch to determinate mode. */
  getProgress?: (data: TData | undefined) => number | undefined;
  /** Custom error message shown in the error state. */
  errorMessage?: string;
  /** Skip showing the loader for this query (e.g., background refetch). */
  skip?: boolean;
}

export function useQueryWithLoader<TQuery extends QueryLike<any>>(
  query: TQuery,
  context: LoadingContext = "generic",
  options: UseQueryWithLoaderOptions<TQuery["data"]> = {}
): TQuery {
  const { load, finish, fail, updateProgress } = useLoaderStore();
  const { getProgress, errorMessage, skip = false } = options;

  const prevStatus = useRef<string | null>(null);

  useEffect(() => {
    if (skip) return;

    const { status, isFetching, data, error } = query;

    // Only show loader on the first load (not background refetches)
    const isFirstLoad = status === "pending" && isFetching;
    const wasLoading = prevStatus.current === "loading";

    if (isFirstLoad && prevStatus.current !== "loading") {
      const progress = getProgress?.(data);
      load({
        mode: progress !== undefined
          ? { type: "determinate", progress }
          : { type: "indeterminate" },
        context,
      });
      prevStatus.current = "loading";
    }

    if (wasLoading) {
      if (status === "success") {
        finish();
        prevStatus.current = "success";
      } else if (status === "error") {
        fail(
          errorMessage ??
            (error instanceof Error ? error.message : "Something went wrong.")
        );
        prevStatus.current = "error";
      }
    }

    // Update determinate progress mid-fetch
    if (status === "pending" && getProgress && data !== undefined) {
      const p = getProgress(data);
      if (p !== undefined) updateProgress(p);
    }
  }, [
    query.status,
    query.isFetching,
    query.data,
    query.error,
    context,
    load,
    finish,
    fail,
    updateProgress,
    getProgress,
    errorMessage,
    skip,
  ]);

  return query;
}

/**
 * useMutationWithLoader
 *
 * Wraps any async function and shows the loader while it runs.
 *
 * @example
 * const publish = useMutationWithLoader(publishWorkout, "plan");
 * await publish(data);
 */
export function useMutationWithLoader<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  context: LoadingContext = "generic",
  errorMessage?: string
): (...args: TArgs) => Promise<TResult> {
  const { load, finish, fail } = useLoaderStore();

  return async (...args: TArgs) => {
    load({ context });
    try {
      const result = await fn(...args);
      finish();
      return result;
    } catch (err) {
      fail(errorMessage ?? (err instanceof Error ? err.message : "Something went wrong."));
      throw err;
    }
  };
}
