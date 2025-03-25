import { useEffect, useState } from "react";
import { differenceInYears } from "date-fns";
import { supabase } from "@/lib/supabase";
import { getCurrentMember } from "@/lib/supabase";

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

export interface TimeOffRequest {
  id: string;
  requestDate: string;
  requestedAt: string;
  leaveType: "PLD" | "SDV";
  status: "pending" | "approved" | "denied" | "waitlisted";
  waitlistPosition?: number;
  paidInLieu?: boolean;
  respondedAt?: string;
}

export function useMyTime() {
  const [timeStats, setTimeStats] = useState<TimeStats>({
    total: { pld: 0, sdv: 0 },
    available: { pld: 0, sdv: 0 },
    requested: { pld: 0, sdv: 0 },
    waitlisted: { pld: 0, sdv: 0 },
    approved: { pld: 0, sdv: 0 },
    paidInLieu: { pld: 0, sdv: 0 },
  });

  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      // Get SDV entitlement from member record (default to 0 if not set)
      // This value is managed by division admins and represents the number of
      // single day vacations (max 12, 6 per week for 2 weeks) allocated to the member
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
          if (request.status === "pending") {
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
          };
        }) || [];

      // Calculate available days
      const availablePld = totalPld - approvedPld - requestedPld - waitlistedPld;
      const availableSdv = totalSdv - approvedSdv - requestedSdv - waitlistedSdv;

      // Set state
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
      const { error } = await supabase.from("pld_sdv_requests").delete().eq("id", requestId);

      if (error) throw error;

      // Refresh time data
      await loadTimeData();
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

  // Load time data on mount
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
