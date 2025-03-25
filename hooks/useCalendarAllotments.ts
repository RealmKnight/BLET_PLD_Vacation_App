import { useEffect, useState, useCallback } from "react";
import { startOfMonth, endOfMonth } from "date-fns";
import { supabase } from "@/lib/supabase";
import { getCurrentMember } from "@/lib/supabase";
import { formatDateToYMD, normalizeDate } from "@/utils/date";

export type DayAllotment = {
  date: string;
  maxAllotment: number;
  currentRequests: number;
  availability: "available" | "limited" | "full";
};

export function useCalendarAllotments(month: Date) {
  const [allotments, setAllotments] = useState<Record<string, DayAllotment>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userDivision, setUserDivision] = useState<string | null>(null);

  // Determine availability status based on allotment and current requests
  const getAvailability = (maxAllotment: number, currentRequests: number) => {
    if (currentRequests >= maxAllotment) return "full";
    if (currentRequests >= maxAllotment * 0.7) return "limited";
    return "available";
  };

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
            availability: getAvailability(item.max_allotment, item.current_requests || 0),
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
  }, [month, userDivision]);

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

  return { allotments, isLoading, error, userDivision, refresh: fetchAllotments };
}
