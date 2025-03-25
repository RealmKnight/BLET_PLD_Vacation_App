import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { getCurrentMember } from "@/lib/supabase";
import { Alert } from "react-native";
import { formatDateToYMD, normalizeDate } from "@/utils/date";
import { Database } from "@/types/supabase";

export function useTimeOffRequests() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitRequest = async (date: Date, type: "PLD" | "SDV", division: string) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const member = await getCurrentMember();
      if (!member || !member.id) {
        throw new Error("Unable to load member data");
      }

      // Format date using our utility function
      const formattedDate = formatDateToYMD(normalizeDate(date));

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
        if (requestError.code === "23505") {
          // Unique constraint violation
          Alert.alert("Request Already Exists", "You already have a request for this date.");
        } else {
          throw requestError;
        }
        return null;
      }

      Alert.alert(
        "Request Submitted",
        `Your ${type} request for ${formattedDate} has been submitted and is pending approval.`
      );

      return request;
    } catch (err: any) {
      console.error("Error submitting request:", err);
      setError(err.message || "Failed to submit request");
      Alert.alert("Error", "Failed to submit request. Please try again later.");
      return null;
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
