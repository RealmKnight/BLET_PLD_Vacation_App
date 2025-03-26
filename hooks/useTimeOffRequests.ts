import { useState } from "react";
import { Alert } from "react-native";
import { supabase } from "@/lib/supabase";
import { getCurrentMember } from "@/lib/supabase";
import { format } from "date-fns";
import { useTimeStore } from "@/store/timeStore";

export function useTimeOffRequests() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refresh: refreshTimeData } = useTimeStore();

  const submitRequest = async (date: Date, type: "PLD" | "SDV", division: string) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Get current member
      const member = await getCurrentMember();
      if (!member?.id) {
        throw new Error("Unable to load member data");
      }

      // Format date for database
      const formattedDate = format(date, "yyyy-MM-dd");

      // Check for existing requests
      const { data: existingRequests, error: checkError } = await supabase
        .from("pld_sdv_requests")
        .select("id, status")
        .eq("member_id", member.id)
        .eq("request_date", formattedDate)
        .in("status", ["pending", "approved", "waitlisted", "cancellation_pending"]);

      if (checkError) throw checkError;

      if (existingRequests && existingRequests.length > 0) {
        const errorMessage = "You already have an active request for this date";
        setError(errorMessage);
        Alert.alert("Request Failed", errorMessage);
        return false;
      }

      // Submit the request
      const { data: request, error: requestError } = await supabase
        .from("pld_sdv_requests")
        .insert({
          member_id: member.id,
          division,
          request_date: formattedDate,
          leave_type: type,
          status: "pending",
          requested_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (requestError) {
        const errorMessage = requestError.message || "An unexpected error occurred";
        setError(errorMessage);
        Alert.alert("Request Failed", errorMessage);
        return false;
      }

      // Refresh time data in the store
      await refreshTimeData();

      Alert.alert(
        "Request Submitted",
        `Your ${type} request for ${formattedDate} has been submitted and is pending approval.`
      );

      return true;
    } catch (err: any) {
      console.error("Error submitting request:", err);
      const errorMessage = err.message || "Failed to submit request";
      setError(errorMessage);

      if (!err.message?.includes("active request already exists")) {
        Alert.alert("Error", "Failed to submit request. Please try again later.");
      }
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelPendingRequest = async (requestId: string) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const member = await getCurrentMember();
      if (!member || !member.id) {
        throw new Error("Unable to load member data");
      }

      // Call the cancel_pending_request function
      const { data, error: cancelError } = await supabase.rpc("cancel_pending_request", {
        request_id: requestId,
        user_id: member.id,
      });

      if (cancelError) {
        throw cancelError;
      }

      if (!data) {
        Alert.alert("Cannot Cancel", "Only pending requests can be cancelled directly.");
        return false;
      }

      Alert.alert("Request Cancelled", "Your request has been cancelled successfully.");
      return true;
    } catch (err: any) {
      console.error("Error cancelling request:", err);
      setError(err.message || "Failed to cancel request");
      Alert.alert("Error", "Failed to cancel request. Please try again later.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitRequest,
    cancelPendingRequest,
    isSubmitting,
    error,
  };
}
