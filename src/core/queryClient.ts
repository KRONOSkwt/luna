import { QueryClient } from '@tanstack/react-query'

/** Single shared query client — mounted once in main.tsx. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
})

/** Stable query key for the memories query (timeline + admin bind the same key). */
export const memoriesKey = ['memories'] as const
