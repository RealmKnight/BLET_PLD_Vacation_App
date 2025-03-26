import { create } from "zustand";
import { TimeStats, TimeOffRequest } from "@/hooks/useMyTime";

interface TimeStore {
  timeStats: TimeStats;
  timeOffRequests: TimeOffRequest[];
  isLoading: boolean;
  error: string | null;
  setTimeStats: (stats: TimeStats) => void;
  setTimeOffRequests: (requests: TimeOffRequest[]) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  refresh: () => void;
}

export const useTimeStore = create<TimeStore>((set) => ({
  timeStats: {
    total: { pld: 0, sdv: 0 },
    available: { pld: 0, sdv: 0 },
    requested: { pld: 0, sdv: 0 },
    waitlisted: { pld: 0, sdv: 0 },
    approved: { pld: 0, sdv: 0 },
    paidInLieu: { pld: 0, sdv: 0 },
  },
  timeOffRequests: [],
  isLoading: false,
  error: null,
  setTimeStats: (stats) => set({ timeStats: stats }),
  setTimeOffRequests: (requests) => set({ timeOffRequests: requests }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  refresh: () =>
    set((state) => ({
      ...state,
      isLoading: true, // Set loading to true to trigger a refresh
      error: null, // Clear any previous errors
    })),
}));
