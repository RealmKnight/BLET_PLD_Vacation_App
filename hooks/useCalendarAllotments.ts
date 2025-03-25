import { useEffect, useState, useCallback } from "react";
import { startOfMonth, endOfMonth, addDays, isBefore, startOfDay } from "date-fns";
import { supabase } from "@/lib/supabase";
import { getCurrentMember } from "@/lib/supabase";
import { formatDateToYMD, normalizeDate, parseYMDDate } from "@/utils/date";

export type DayAllotment = {
  date: string;
  maxAllotment: number;
  currentRequests: number;
  availability: "available" | "limited" | "full" | "restricted";
};

export function useCalendarAllotments(month: Date) {
  const [allotments, setAllotments] = useState<Record<string, DayAllotment>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userDivision, setUserDivision] = useState<string | null>(null);

  // Determine availability status based on allotment, current requests, and date restrictions
  const getAvailability = useCallback((maxAllotment: number, currentRequests: number, dateStr: string) => {
    // Check if date is within 48 hours
    const today = startOfDay(new Date());
    today.setHours(12, 0, 0, 0);
    const minAllowedDate = addDays(today, 2);
    const dateToCheck = parseYMDDate(dateStr);

    if (isBefore(dateToCheck, minAllowedDate)) {
      return "restricted";
    }

    if (currentRequests >= maxAllotment) return "full";
    if (currentRequests >= maxAllotment * 0.7) return "limited";
    return "available";
  }, []);

  // Fetch allotments for a specific date
  const fetchDateAllotment = useCallback(
    async (date: Date) => {
      if (!userDivision) return;

      try {
        const formattedDate = formatDateToYMD(normalizeDate(date));

        // Fetch allotment from Supabase
        const { data, error } = await supabase
          .from("pld_sdv_allotments")
          .select("*")
          .eq("division", userDivision)
          .eq("date", formattedDate)
          .single();

        if (error && error.code !== "PGRST116") throw error;

        if (data) {
          const allotment: DayAllotment = {
            date: formattedDate,
            maxAllotment: data.max_allotment,
            currentRequests: data.current_requests || 0,
            availability: getAvailability(data.max_allotment, data.current_requests || 0, formattedDate),
          };

          setAllotments((prev) => ({
            ...prev,
            [formattedDate]: allotment,
          }));
        }
      } catch (err) {
        console.error("Error fetching date allotment:", err);
      }
    },
    [userDivision, getAvailability]
  );

  const fetchAllotments = useCallback(async () => {
    if (!userDivision) return;

    setIsLoading(true);
    setError(null);

    try {
      // Get start and end of month, normalized to UTC noon
      const start = normalizeDate(startOfMonth(month));
      const end = normalizeDate(endOfMonth(month));

      // Format as YYYY-MM-DD
      const startDate = formatDateToYMD(start);
      const endDate = formatDateToYMD(end);

      // Fetch allotments from Supabase
      const { data, error } = await supabase
        .from("pld_sdv_allotments")
        .select("*")
        .eq("division", userDivision)
        .gte("date", startDate)
        .lte("date", endDate);

      if (error) throw error;

      // Create a map of date to allotment data
      const allotmentMap: Record<string, DayAllotment> = {};

      // Process allotments from the database
      if (data) {
        data.forEach((item) => {
          const dateStr = formatDateToYMD(item.date);
          allotmentMap[dateStr] = {
            date: dateStr,
            maxAllotment: item.max_allotment,
            currentRequests: item.current_requests || 0,
            availability: getAvailability(item.max_allotment, item.current_requests || 0, dateStr),
          };
        });
      }

      setAllotments(allotmentMap);
    } catch (err: any) {
      console.error("Error fetching allotments:", err);
      setError(err.message || "Failed to load allotments");
    } finally {
      setIsLoading(false);
    }
  }, [month, userDivision, getAvailability]);

  useEffect(() => {
    async function loadUserDivision() {
      try {
        const member = await getCurrentMember();
        if (member?.division) {
          setUserDivision(member.division);
        }
      } catch (err) {
        console.error("Error loading user division:", err);
        setError("Failed to load user division");
      }
    }

    loadUserDivision();
  }, []);

  useEffect(() => {
    if (userDivision) {
      fetchAllotments();
    }
  }, [fetchAllotments, userDivision]);

  return {
    allotments,
    isLoading,
    error,
    userDivision,
    refresh: fetchAllotments,
    refreshDate: fetchDateAllotment,
  };
}
