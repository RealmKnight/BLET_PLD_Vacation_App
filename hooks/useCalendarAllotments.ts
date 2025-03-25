import { useEffect, useState } from "react";
import { addDays, format, startOfMonth, endOfMonth } from "date-fns";
import { supabase } from "@/lib/supabase";
import { getCurrentMember } from "@/lib/supabase";

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
    if (!userDivision) return;

    async function fetchAllotments() {
      setIsLoading(true);
      setError(null);

      try {
        // Get start and end of month
        const start = startOfMonth(month);
        const end = endOfMonth(month);

        // Format as YYYY-MM-DD
        const startDate = format(start, "yyyy-MM-dd");
        const endDate = format(end, "yyyy-MM-dd");

        // Fetch allotments from Supabase
        const { data, error } = await supabase
          .from("pld_sdv_allotments")
          .select("*")
          .eq("division", userDivision as string)
          .gte("date", startDate)
          .lte("date", endDate);

        if (error) throw error;

        // Create a map of date to allotment data
        const allotmentMap: Record<string, DayAllotment> = {};

        // First build default allotments (0 for all dates in month)
        let currentDate = start;
        while (currentDate <= end) {
          const dateStr = format(currentDate, "yyyy-MM-dd");
          allotmentMap[dateStr] = {
            date: dateStr,
            maxAllotment: 0,
            currentRequests: 0,
            availability: "full", // Default to full if no allotment record exists
          };
          currentDate = addDays(currentDate, 1);
        }

        // Then fill in actual allotments from the database
        if (data) {
          data.forEach((item) => {
            const dateStr = format(new Date(item.date), "yyyy-MM-dd");
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
    }

    fetchAllotments();
  }, [month, userDivision]);

  return { allotments, isLoading, error, userDivision };
}
