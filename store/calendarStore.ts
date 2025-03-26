import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { DayAllotment } from "@/hooks/useCalendarAllotments";
import { startOfMonth, endOfMonth } from "date-fns";
import { formatDateToYMD, normalizeDate } from "@/utils/date";

// Add request tracking
let currentRequest: AbortController | null = null;
let debounceTimer: NodeJS.Timeout | null = null;
let isInitialized = false;
let retryAttempts = 0;
let initTimer: NodeJS.Timeout | null = null;
let pendingFetches: Array<{ month: Date; division: string }> = [];
let isInitializing = false;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const INIT_DELAY = 1000; // Increased to 1 second to ensure auth is ready

interface CalendarStore {
  allotments: Record<string, DayAllotment>;
  isLoading: boolean;
  error: string | null;
  currentMonth: Date;
  userDivision: string | null;
  isInitialized: boolean;
  isInitializing: boolean;
  pendingMonth: Date | null;
  setAllotments: (allotments: Record<string, DayAllotment>) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentMonth: (month: Date) => void;
  setUserDivision: (division: string | null) => void;
  fetchAllotments: (month: Date, division: string) => Promise<void>;
  initialize: () => () => void;
  calculateAvailability: (
    maxAllotment: number,
    currentRequests: number,
    dateStr: string
  ) => "available" | "limited" | "full" | "restricted";
}

export const useCalendarStore = create<CalendarStore>((set, get) => ({
  allotments: {},
  isLoading: true,
  error: null,
  currentMonth: new Date(),
  userDivision: null,
  isInitialized: false,
  isInitializing: false,
  pendingMonth: null,
  setAllotments: (allotments) => {
    console.log("[CalendarStore] Setting allotments:", {
      count: Object.keys(allotments).length,
      firstDate: Object.keys(allotments)[0],
      lastDate: Object.keys(allotments)[Object.keys(allotments).length - 1],
    });
    set({ allotments });
  },
  setIsLoading: (loading) => {
    console.log("[CalendarStore] Setting loading:", loading);
    set({ isLoading: loading });
  },
  setError: (error) => set({ error }),
  setCurrentMonth: (month) => {
    console.log("[CalendarStore] Setting current month:", formatDateToYMD(month));

    // Always update the current month in state
    set({ currentMonth: month });

    // If initializing or not initialized, store as pending
    if (isInitializing || !isInitialized) {
      console.log("[CalendarStore] Store not ready, setting pending month");
      set({ pendingMonth: month });
      return;
    }

    // Only fetch if we're initialized and have a division
    const state = get();
    if (state.userDivision) {
      get().fetchAllotments(month, state.userDivision);
    }
  },
  setUserDivision: (division) => {
    console.log("[CalendarStore] Setting user division:", division);
    set({ userDivision: division });

    // Only fetch if we're initialized and not initializing
    if (isInitialized && !isInitializing && division) {
      const state = get();
      const monthToUse = state.pendingMonth || state.currentMonth;
      get().fetchAllotments(monthToUse, division);
    }
  },
  fetchAllotments: async (month: Date, division: string) => {
    // Don't fetch if we're not ready
    if (!isInitialized || isInitializing || !division) {
      console.log("[CalendarStore] Skipping fetch - not ready:", { isInitialized, isInitializing, division });
      // Store the fetch request for later
      pendingFetches.push({ month, division });
      return;
    }

    // Verify session before proceeding
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        console.log("[CalendarStore] No valid session, skipping fetch");
        return;
      }
    } catch (err) {
      console.log("[CalendarStore] Error checking session, skipping fetch");
      return;
    }

    // Cancel any existing request
    if (currentRequest) {
      console.log("[CalendarStore] Cancelling previous request");
      currentRequest.abort();
      currentRequest = null;
    }

    // Clear any existing debounce timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }

    // Create new abort controller
    currentRequest = new AbortController();
    const { signal } = currentRequest;

    // Debounce the request
    return new Promise<void>((resolve, reject) => {
      debounceTimer = setTimeout(async () => {
        try {
          console.log("[CalendarStore] Fetching allotments for:", {
            month: formatDateToYMD(month),
            division,
          });

          set({ isLoading: true, error: null });

          const start = normalizeDate(startOfMonth(month));
          const end = normalizeDate(endOfMonth(month));
          const startDate = formatDateToYMD(start);
          const endDate = formatDateToYMD(end);

          console.log("[CalendarStore] Fetching date range:", { startDate, endDate });

          const { data, error } = await supabase
            .from("pld_sdv_allotments")
            .select("*")
            .eq("division", division)
            .gte("date", startDate)
            .lte("date", endDate)
            .abortSignal(signal);

          if (signal.aborted) {
            console.log("[CalendarStore] Request was aborted");
            resolve();
            return;
          }

          if (error) throw error;

          const allotmentMap: Record<string, DayAllotment> = {};

          if (data) {
            console.log("[CalendarStore] Processing allotments data:", {
              count: data.length,
              sampleDate: data[0]?.date,
            });

            data.forEach((item) => {
              const dateStr = formatDateToYMD(item.date);
              const availability = get().calculateAvailability(item.max_allotment, item.current_requests || 0, dateStr);

              allotmentMap[dateStr] = {
                date: dateStr,
                maxAllotment: item.max_allotment,
                currentRequests: item.current_requests || 0,
                availability,
              };
            });

            console.log("[CalendarStore] Setting new allotments:", {
              count: Object.keys(allotmentMap).length,
              firstDate: Object.keys(allotmentMap)[0],
              lastDate: Object.keys(allotmentMap)[Object.keys(allotmentMap).length - 1],
              sampleAvailability: Object.values(allotmentMap)[0]?.availability,
            });

            set({ allotments: { ...allotmentMap } });
          } else {
            console.log("[CalendarStore] No allotments data received");
            set({ allotments: {} });
          }
          resolve();
        } catch (err: any) {
          if (!signal.aborted) {
            console.error("[CalendarStore] Error fetching allotments:", err);
            set({ error: err.message || "Failed to load allotments" });
            reject(err);
          }
        } finally {
          if (!signal.aborted) {
            set({ isLoading: false });
          }
        }
      }, 300); // 300ms debounce
    });
  },
  initialize: () => {
    console.log("[CalendarStore] Starting initialization");
    isInitializing = true;
    set({ isInitializing: true });

    // Clear any existing init timer
    if (initTimer) {
      clearTimeout(initTimer);
      initTimer = null;
    }

    // Add a delay before initialization to allow auth to settle
    initTimer = setTimeout(async () => {
      try {
        // Verify session is available
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          console.log("[CalendarStore] No session available, delaying initialization");
          // Try again in 1 second
          setTimeout(() => get().initialize(), RETRY_DELAY);
          return;
        }

        console.log("[CalendarStore] Completing initialization after delay");
        isInitialized = true;
        isInitializing = false;
        set({ isInitialized: true, isInitializing: false });
        retryAttempts = 0;

        // Process any pending fetches
        const state = get();
        if (state.userDivision) {
          // Get the most recent pending fetch or use current state
          const lastPendingFetch = pendingFetches[pendingFetches.length - 1];
          const monthToUse = lastPendingFetch?.month || state.pendingMonth || state.currentMonth;

          // Clear pending fetches
          pendingFetches = [];

          // Trigger the fetch
          get().fetchAllotments(monthToUse, state.userDivision);

          // Clear pending month after use
          if (state.pendingMonth) {
            set({ pendingMonth: null });
          }
        }
      } catch (err) {
        console.error("[CalendarStore] Error during initialization:", err);
        // Try again in 1 second
        setTimeout(() => get().initialize(), RETRY_DELAY);
      }
    }, INIT_DELAY);

    return () => {
      console.log("[CalendarStore] Cleanup");
      isInitialized = false;
      isInitializing = false;
      set({ isInitialized: false, isInitializing: false, pendingMonth: null });
      retryAttempts = 0;
      pendingFetches = [];

      // Clear init timer
      if (initTimer) {
        clearTimeout(initTimer);
        initTimer = null;
      }

      // Cancel any pending request
      if (currentRequest) {
        currentRequest.abort();
        currentRequest = null;
      }

      // Clear any pending timer
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }

      // Clear state
      set({
        allotments: {},
        isLoading: false,
        error: null,
        userDivision: null,
      });
    };
  },
  calculateAvailability: (maxAllotment: number, currentRequests: number, dateStr: string) => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const minAllowedDate = new Date(today);
    minAllowedDate.setDate(today.getDate() + 2);
    const dateToCheck = new Date(dateStr);

    if (dateToCheck < minAllowedDate) {
      return "restricted";
    }

    if (currentRequests >= maxAllotment) return "full";
    if (currentRequests >= maxAllotment * 0.7) return "limited";
    return "available";
  },
}));
