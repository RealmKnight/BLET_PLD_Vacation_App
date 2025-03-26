import { useEffect } from "react";
import { differenceInYears } from "date-fns";
import { supabase } from "@/lib/supabase";
import { getCurrentMember } from "@/lib/supabase";
import { normalizeDate } from "@/utils/date";
import { useAuth } from "@/contexts/AuthContext";
import { useTimeStore } from "@/store/timeStore";
import { useCalendarAllotments } from "@/hooks/useCalendarAllotments";
import { useCalendarStore } from "@/store/calendarStore";

// Types for the hook
export interface TimeStats {
  total: {
    pld: number;
    sdv: number;
  };
  available: {
    pld: number;
    sdv: number;
  };
  requested: {
    pld: number;
    sdv: number;
  };
  waitlisted: {
    pld: number;
    sdv: number;
  };
  approved: {
    pld: number;
    sdv: number;
  };
  paidInLieu: {
    pld: number;
    sdv: number;
  };
}

// Add type for RPC functions
type Database = {
  rpc: {
    cancel_pending_request: {
      (args: { request_id: string; user_id: string }): Promise<{ data: boolean; error: any }>;
    };
  };
};

export interface TimeOffRequest {
  id: string;
  requestDate: string;
  requestedAt: string;
  leaveType: "PLD" | "SDV";
  status: "pending" | "approved" | "denied" | "waitlisted" | "cancellation_pending" | "cancelled";
  waitlistPosition?: number;
  paidInLieu?: boolean;
  respondedAt?: string;
  cancelledBy?: string;
  cancelledAt?: string;
}

export function useMyTime() {
  const { user } = useAuth();
  const {
    timeStats,
    timeOffRequests,
    isLoading,
    error,
    setTimeStats,
    setTimeOffRequests,
    setIsLoading,
    setError,
    refresh: triggerRefresh,
  } = useTimeStore();
  const { refresh: refreshAllotments } = useCalendarAllotments(new Date());
  const { fetchAllotments } = useCalendarStore();

  // Calculate PLD entitlement based on years of service
  const calculatePldEntitlement = (hireDate: string | null, override: number | null): number => {
    if (override !== null && override >= 0) {
      return override;
    }

    if (!hireDate) return 0;

    const yearsOfService = differenceInYears(new Date(), new Date(hireDate));

    if (yearsOfService < 1) return 0;
    if (yearsOfService < 3) return 5;
    if (yearsOfService < 6) return 8;
    if (yearsOfService < 10) return 11;
    return 13; // 10+ years
  };

  // Load time data from Supabase
  const loadTimeData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get current member
      const member = await getCurrentMember();
      if (!member || !member.id) {
        setError("Unable to load member data");
        setIsLoading(false);
        return;
      }

      // Calculate total PLD entitlement
      const totalPld = calculatePldEntitlement(member.company_hire_date, member.pld_override);

      // Get SDV entitlement from member record
      const totalSdv = member.sdv_entitlement || 0;

      // Get all requests for the current user
      const { data: requests, error: requestsError } = await supabase
        .from("pld_sdv_requests")
        .select("*")
        .eq("member_id", member.id)
        .order("request_date", { ascending: false });

      if (requestsError) throw requestsError;

      // Initialize counters
      let requestedPld = 0;
      let requestedSdv = 0;
      let waitlistedPld = 0;
      let waitlistedSdv = 0;
      let approvedPld = 0;
      let approvedSdv = 0;
      let paidInLieuPld = 0;
      let paidInLieuSdv = 0;

      // Format and count requests
      const formattedRequests: TimeOffRequest[] =
        requests?.map((request) => {
          // Count by status and type
          if (request.status === "pending" || request.status === "cancellation_pending") {
            if (request.leave_type === "PLD") requestedPld++;
            else requestedSdv++;
          } else if (request.status === "waitlisted") {
            if (request.leave_type === "PLD") waitlistedPld++;
            else waitlistedSdv++;
          } else if (request.status === "approved") {
            if (request.leave_type === "PLD") {
              approvedPld++;
              if (request.paid_in_lieu) paidInLieuPld++;
            } else {
              approvedSdv++;
              if (request.paid_in_lieu) paidInLieuSdv++;
            }
          }

          return {
            id: request.id,
            requestDate: request.request_date,
            requestedAt: request.requested_at || "",
            leaveType: request.leave_type,
            status: request.status,
            waitlistPosition: request.waitlist_position || undefined,
            paidInLieu: request.paid_in_lieu || false,
            respondedAt: request.responded_at || undefined,
            cancelledBy: request.cancelled_by || undefined,
            cancelledAt: request.cancelled_at || undefined,
          };
        }) || [];

      // Calculate available days
      const availablePld = totalPld - approvedPld - requestedPld - waitlistedPld;
      const availableSdv = totalSdv - approvedSdv - requestedSdv - waitlistedSdv;

      // Update store
      setTimeStats({
        total: { pld: totalPld, sdv: totalSdv },
        available: { pld: Math.max(0, availablePld), sdv: Math.max(0, availableSdv) },
        requested: { pld: requestedPld, sdv: requestedSdv },
        waitlisted: { pld: waitlistedPld, sdv: waitlistedSdv },
        approved: { pld: approvedPld, sdv: approvedSdv },
        paidInLieu: { pld: paidInLieuPld, sdv: paidInLieuSdv },
      });

      setTimeOffRequests(formattedRequests);
    } catch (err: any) {
      console.error("Error loading time data:", err);
      setError(err.message || "Failed to load time data");
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel a request
  const cancelRequest = async (requestId: string) => {
    try {
      const { data: request } = await supabase
        .from("pld_sdv_requests")
        .select("status, request_date")
        .eq("id", requestId)
        .single();

      if (!request) {
        throw new Error("Request not found");
      }

      if (request.status === "pending" && user?.id) {
        // Use the new direct cancellation for pending requests
        const { data, error } = await supabase.rpc("cancel_pending_request", {
          request_id: requestId,
          user_id: user.id,
        });

        if (error) throw error;
        if (!data) {
          throw new Error("Failed to cancel request");
        }
      } else {
        // For non-pending requests, use the existing cancellation flow
        const { error } = await supabase
          .from("pld_sdv_requests")
          .update({
            status: "cancellation_pending",
            responded_at: null,
          })
          .eq("id", requestId);

        if (error) throw error;
      }

      // Since realtime isn't working, we need to refresh both manually
      // but we'll do it in sequence to avoid multiple UI updates
      await loadTimeData();

      // Get the request date and fetch allotments for that month
      const requestDate = new Date(request.request_date);

      // Get the member's division
      const member = await getCurrentMember();
      if (member?.division) {
        await fetchAllotments(requestDate, member.division);
      }

      return true;
    } catch (err: any) {
      console.error("Error cancelling request:", err);
      setError(err.message || "Failed to cancel request");
      return false;
    }
  };

  // Request a day to be paid in lieu
  const requestPaidInLieu = async (requestId: string) => {
    try {
      const { error } = await supabase.from("pld_sdv_requests").update({ paid_in_lieu: true }).eq("id", requestId);

      if (error) throw error;

      // Refresh time data
      await loadTimeData();
      return true;
    } catch (err: any) {
      console.error("Error requesting paid in lieu:", err);
      setError(err.message || "Failed to request paid in lieu");
      return false;
    }
  };

  // Load time data on mount and when refresh is triggered
  useEffect(() => {
    loadTimeData();
  }, []);

  return {
    timeStats,
    timeOffRequests,
    isLoading,
    error,
    cancelRequest,
    requestPaidInLieu,
    refresh: loadTimeData,
  };
}
