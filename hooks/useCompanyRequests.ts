import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

export interface CompanyRequest {
  id: string;
  pin_number: number;
  first_name: string;
  last_name: string;
  request_date: string;
  leave_type: "PLD" | "SDV";
  status: "pending" | "approved" | "denied" | "waitlisted";
  division: string;
}

export function useCompanyRequests() {
  const [requests, setRequests] = useState<CompanyRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load pending requests
  const loadRequests = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get all pending requests, ordered by date (closest first)
      const { data: requestsData, error: requestsError } = await supabase
        .from("pld_sdv_requests")
        .select(
          `
          id,
          request_date,
          leave_type,
          status,
          division,
          member_id
        `
        )
        .eq("status", "pending")
        .order("request_date", { ascending: true });

      if (requestsError) throw requestsError;

      // Get member details for each request
      const requestsWithMemberDetails = await Promise.all(
        (requestsData || []).map(async (request) => {
          const { data: memberData, error: memberError } = await supabase
            .from("members")
            .select("pin_number, first_name, last_name")
            .eq("id", request.member_id)
            .single();

          if (memberError) {
            console.error("Error fetching member:", memberError);
            return null;
          }

          return {
            id: request.id,
            pin_number: memberData.pin_number,
            first_name: memberData.first_name || "",
            last_name: memberData.last_name || "",
            request_date: request.request_date,
            leave_type: request.leave_type,
            status: request.status,
            division: request.division,
          };
        })
      );

      // Filter out any null values from failed member fetches
      setRequests(requestsWithMemberDetails.filter((r): r is CompanyRequest => r !== null));
    } catch (err: any) {
      console.error("Error loading requests:", err);
      setError(err.message || "Failed to load requests");
    } finally {
      setIsLoading(false);
    }
  };

  // Approve a request
  const approveRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("pld_sdv_requests")
        .update({
          status: "approved",
          responded_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (error) throw error;

      // Refresh requests
      await loadRequests();
      return true;
    } catch (err: any) {
      console.error("Error approving request:", err);
      setError(err.message || "Failed to approve request");
      return false;
    }
  };

  // Deny a request with a reason
  const denyRequest = async (requestId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from("pld_sdv_requests")
        .update({
          status: "denied",
          responded_at: new Date().toISOString(),
          denial_reason: reason,
        })
        .eq("id", requestId);

      if (error) throw error;

      // Refresh requests
      await loadRequests();
      return true;
    } catch (err: any) {
      console.error("Error denying request:", err);
      setError(err.message || "Failed to deny request");
      return false;
    }
  };

  // Load requests on mount
  useEffect(() => {
    loadRequests();
  }, []);

  return {
    requests,
    isLoading,
    error,
    approveRequest,
    denyRequest,
    refresh: loadRequests,
  };
}
