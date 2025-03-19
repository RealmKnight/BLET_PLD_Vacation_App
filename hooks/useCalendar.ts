import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";
import { useDivision } from "./useDivision";
import { Database } from "@/types/supabase";

type CalendarEvent = Database["public"]["Tables"]["calendar_events"]["Row"];

type CalendarDay = {
  date: string;
  status: "past" | "locked" | "available" | "limited" | "full";
  spotsLeft: number;
  totalSpots: number;
  events: CalendarEvent[];
};

export function useCalendar() {
  const { member } = useAuth();
  const { division } = useDivision();
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    if (!member?.division_id || !division) {
      setIsLoading(false);
      return;
    }

    fetchCalendarData();
  }, [member?.division_id, division]);

  async function fetchCalendarData() {
    if (!member?.division_id || !division) {
      setError(new Error("No division data available"));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch events for the next 30 days
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      const { data: events, error: eventsError } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("division_id", member.division_id)
        .gte("date", startDate.toISOString())
        .lte("date", endDate.toISOString());

      if (eventsError) throw eventsError;

      // Process events into calendar days
      const days: CalendarDay[] = [];
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split("T")[0];
        const dayEvents = events.filter((event) => event.date === dateStr);
        const spotsLeft = division.daily_quota - dayEvents.length;

        let status: CalendarDay["status"] = "available";
        if (currentDate < new Date()) {
          status = "past";
        } else if (currentDate.getTime() - new Date().getTime() < 48 * 60 * 60 * 1000) {
          status = "locked";
        } else if (spotsLeft <= 0) {
          status = "full";
        } else if (spotsLeft <= 2) {
          status = "limited";
        }

        days.push({
          date: dateStr,
          status,
          spotsLeft,
          totalSpots: division.daily_quota,
          events: dayEvents,
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      setCalendarDays(days);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch calendar data"));
    } finally {
      setIsLoading(false);
    }
  }

  async function submitRequest(date: string, type: CalendarEvent["type"]) {
    if (!member?.division_id) {
      throw new Error("No division ID available");
    }

    try {
      const { data, error } = await supabase
        .from("calendar_events")
        .insert({
          date,
          type,
          status: "pending",
          member_id: member.id,
          division_id: member.division_id,
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh calendar data
      await fetchCalendarData();

      return data;
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to submit request");
    }
  }

  async function cancelRequest(eventId: string) {
    if (!member?.id) {
      throw new Error("No user ID available");
    }

    try {
      const { error } = await supabase.from("calendar_events").delete().eq("id", eventId).eq("member_id", member.id);

      if (error) throw error;

      // Refresh calendar data
      await fetchCalendarData();
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to cancel request");
    }
  }

  async function joinWaitlist(date: string, type: CalendarEvent["type"]) {
    if (!member?.division_id) {
      throw new Error("No division ID available");
    }

    try {
      const { data, error } = await supabase
        .from("calendar_events")
        .insert({
          date,
          type,
          status: "waitlisted",
          member_id: member.id,
          division_id: member.division_id,
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh calendar data
      await fetchCalendarData();

      return data;
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to join waitlist");
    }
  }

  return {
    calendarDays,
    isLoading,
    error,
    selectedDate,
    setSelectedDate,
    submitRequest,
    cancelRequest,
    joinWaitlist,
    refreshCalendar: fetchCalendarData,
  };
}
