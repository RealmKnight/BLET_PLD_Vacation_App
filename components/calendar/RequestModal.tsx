import React, { useState, useMemo, useEffect } from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native";
import { format, addDays, addMonths, isBefore, isAfter, startOfDay, parseISO } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useTimeOffRequests } from "@/hooks/useTimeOffRequests";
import { useMyTime } from "@/hooks/useMyTime";

// Define types for allocation data
type MemberRequest = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  leave_type: "PLD" | "SDV";
  status: "pending" | "approved" | "denied" | "waitlisted";
};

type AllocationSlot = {
  position: number;
  member: MemberRequest | null;
};

interface RequestModalProps {
  visible: boolean;
  date: Date | null;
  division: string;
  onClose: () => void;
  onSubmit: (type: "PLD" | "SDV") => void;
}

export function RequestModal({ visible, date, division, onClose, onSubmit }: RequestModalProps) {
  const [requestType, setRequestType] = useState<"PLD" | "SDV">("PLD");
  const [allocations, setAllocations] = useState<AllocationSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [maxAllotment, setMaxAllotment] = useState(6); // Default to 6 until we fetch the real value
  const [error, setError] = useState<string | null>(null);

  const { timeStats } = useMyTime();
  const { submitRequest, isSubmitting } = useTimeOffRequests();

  // Calculate the allowed date range
  const dateRanges = useMemo(() => {
    const today = startOfDay(new Date());
    // Set time to noon to avoid timezone issues
    today.setHours(12, 0, 0, 0);

    return {
      minAllowedDate: addDays(today, 2), // Min: current date + 2 days (48 hours)
      maxAllowedDate: addMonths(today, 6), // Max: current date + 6 months
    };
  }, []);

  // Check if the date is eligible for requests
  const dateStatus = useMemo(() => {
    if (!date) return { isEligible: false, isTooEarly: false, isTooLate: false };

    // Make a copy of date to avoid modifying the original
    const normalizedDate = new Date(date);
    // Set time to noon to avoid timezone issues
    normalizedDate.setHours(12, 0, 0, 0);

    const isTooEarly = isBefore(normalizedDate, dateRanges.minAllowedDate);
    const isTooLate = isAfter(normalizedDate, dateRanges.maxAllowedDate);
    const isEligible = !isTooEarly && !isTooLate;

    return { isEligible, isTooEarly, isTooLate };
  }, [date, dateRanges]);

  const canSubmitRequest = useMemo(() => {
    if (!date || !dateStatus.isEligible) return false;

    // Check if there are available slots
    const currentAllocations = allocations.filter((a) => a.member).length;
    if (currentAllocations >= maxAllotment) {
      return false;
    }

    // Check if user has available days
    if (requestType === "PLD") {
      return timeStats.available.pld > 0;
    } else {
      return timeStats.available.sdv > 0;
    }
  }, [date, dateStatus.isEligible, allocations, maxAllotment, requestType, timeStats]);

  // Load allocation and requests data for the selected date
  const fetchAllocations = async () => {
    if (!date || !division || !visible) return;

    setLoading(true);
    setError(null);

    try {
      // Ensure date is normalized for consistent formatting
      const normalizedDate = new Date(date);
      normalizedDate.setHours(12, 0, 0, 0);
      const formattedDate = format(normalizedDate, "yyyy-MM-dd");

      // 1. Get max allotment for the date
      const { data: allotmentData, error: allotmentError } = await supabase
        .from("pld_sdv_allotments")
        .select("max_allotment")
        .eq("date", formattedDate)
        .eq("division", division)
        .single();

      if (allotmentError && allotmentError.code !== "PGRST116") {
        console.error("Error fetching allotment:", allotmentError);
        setError("Failed to load allotment data.");
      }

      const slots = allotmentData?.max_allotment || maxAllotment;
      setMaxAllotment(slots);

      // 2. Get existing requests for this date (both pending and approved)
      const { data: requestsData, error: requestsError } = await supabase
        .from("pld_sdv_requests")
        .select(
          `
          id, 
          leave_type,
          member_id,
          status
        `
        )
        .eq("request_date", formattedDate)
        .eq("division", division)
        .in("status", ["pending", "approved"])
        .order("requested_at", { ascending: true });

      if (requestsError) {
        console.error("Error fetching requests:", requestsError);
        setError("Failed to load request data.");
      }

      // 3. Get member info for each request
      const memberRequests = [];
      if (requestsData && requestsData.length > 0) {
        for (const request of requestsData) {
          const { data: memberData, error: memberError } = await supabase
            .from("members")
            .select("first_name, last_name")
            .eq("id", request.member_id)
            .single();

          if (memberError) {
            console.error("Error fetching member:", memberError);
            continue;
          }

          memberRequests.push({
            id: request.member_id,
            first_name: memberData?.first_name || "Unknown",
            last_name: memberData?.last_name || "Member",
            leave_type: request.leave_type,
            status: request.status,
          });
        }
      }

      // 4. Build the allocations list
      const allocationsList: AllocationSlot[] = [];
      for (let i = 0; i < slots; i++) {
        if (memberRequests && i < memberRequests.length) {
          allocationsList.push({
            position: i + 1,
            member: memberRequests[i],
          });
        } else {
          // Empty slot
          allocationsList.push({
            position: i + 1,
            member: null,
          });
        }
      }

      setAllocations(allocationsList);
    } catch (error) {
      console.error("Error in fetchAllocations:", error);
      setError("An error occurred while loading the data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllocations();
  }, [date, division, visible]);

  const handleSubmit = async () => {
    if (!date || !dateStatus.isEligible || !canSubmitRequest) {
      if (!canSubmitRequest) {
        if (requestType === "PLD" && timeStats.available.pld <= 0) {
          Alert.alert("No PLD Days Available", "You have used all your available PLD days.");
        } else if (requestType === "SDV" && timeStats.available.sdv <= 0) {
          Alert.alert("No SDV Days Available", "You have used all your available SDV days.");
        } else {
          Alert.alert("No Slots Available", "All slots for this date have been filled.");
        }
      }
      return;
    }

    const result = await submitRequest(date, requestType, division);
    if (result) {
      // Wait a short moment to ensure the database has processed the request
      setTimeout(async () => {
        await fetchAllocations();
      }, 500);

      // Notify parent
      onSubmit(requestType);
    }
  };

  // If date isn't eligible, close the modal
  React.useEffect(() => {
    if (visible && date && !dateStatus.isEligible) {
      onClose();
    }
  }, [visible, date, dateStatus.isEligible, onClose]);

  if (!date) return null;

  // Render the allocation list
  const renderAllocationList = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#BAC42A" />
          <Text style={styles.loadingText}>Loading allocations...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }

    return (
      <View style={styles.allocationContainer}>
        <Text style={styles.allocationTitle}>
          Current Allocations ({allocations.filter((a) => a.member).length}/{maxAllotment})
        </Text>

        {allocations.map((slot) => (
          <View key={`slot-${slot.position}`} style={styles.allocationItem}>
            <Text style={styles.allocationNumber}>{slot.position}.</Text>
            {slot.member ? (
              <View style={styles.allocationInfo}>
                <Text style={styles.memberName}>
                  {slot.member.first_name} {slot.member.last_name}
                </Text>
                <View
                  style={[
                    styles.leaveTypeBadge,
                    slot.member.leave_type === "PLD" ? styles.pldBadge : styles.sdvBadge,
                    slot.member.status === "pending" && styles.pendingBadge,
                  ]}
                >
                  <Text style={styles.leaveTypeText}>
                    {slot.member.leave_type}
                    {slot.member.status === "pending" ? " (Pending)" : ""}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={styles.availableText}>Available</Text>
            )}
          </View>
        ))}
      </View>
    );
  };

  return (
    <Modal visible={visible && dateStatus.isEligible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Request Leave for {format(date, "EEEE, MMMM d, yyyy")}</Text>

          <Text style={styles.description}>Choose the type of day you want to request.</Text>

          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                requestType === "PLD" && styles.typeButtonSelected,
                timeStats.available.pld <= 0 && styles.typeButtonDisabled,
              ]}
              onPress={() => setRequestType("PLD")}
              disabled={timeStats.available.pld <= 0}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  requestType === "PLD" && styles.typeButtonTextSelected,
                  timeStats.available.pld <= 0 && styles.typeButtonTextDisabled,
                ]}
              >
                PLD ({timeStats.available.pld} left)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeButton,
                requestType === "SDV" && styles.typeButtonSelected,
                timeStats.available.sdv <= 0 && styles.typeButtonDisabled,
              ]}
              onPress={() => setRequestType("SDV")}
              disabled={timeStats.available.sdv <= 0}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  requestType === "SDV" && styles.typeButtonTextSelected,
                  timeStats.available.sdv <= 0 && styles.typeButtonTextDisabled,
                ]}
              >
                SDV ({timeStats.available.sdv} left)
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.allocationScrollView} contentContainerStyle={styles.allocationScrollContent}>
            {renderAllocationList()}
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitButton, !canSubmitRequest && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmitRequest || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Text style={[styles.submitButtonText, !canSubmitRequest && styles.submitButtonTextDisabled]}>
                  {!canSubmitRequest ? `No ${requestType} Days Available` : "Submit Request"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  container: {
    backgroundColor: "#111111",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 500,
    borderWidth: 1,
    borderColor: "#333333",
    alignItems: "center",
    maxHeight: "80%", // Limit height on larger screens
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#BAC42A",
    marginBottom: 16,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#FFFFFF",
    marginBottom: 24,
    textAlign: "center",
    width: "90%",
  },
  typeSelector: {
    flexDirection: "row",
    marginBottom: 24,
    width: "90%",
    justifyContent: "center",
  },
  typeButton: {
    flex: 1,
    paddingVertical: 16,
    marginHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#1F1F1F",
    borderWidth: 1,
    borderColor: "#333333",
    maxWidth: 120,
  },
  typeButtonSelected: {
    backgroundColor: "#BAC42A",
  },
  typeButtonText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  typeButtonTextSelected: {
    color: "#000000",
  },
  allocationScrollView: {
    width: "100%",
    maxHeight: 250,
  },
  allocationScrollContent: {
    paddingBottom: 12,
  },
  allocationContainer: {
    width: "100%",
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  allocationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  allocationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  allocationNumber: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
    width: 30,
  },
  allocationInfo: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  memberName: {
    fontSize: 16,
    color: "#FFFFFF",
    flex: 1,
  },
  leaveTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  pldBadge: {
    backgroundColor: "#BAC42A",
  },
  sdvBadge: {
    backgroundColor: "#F59E0B",
  },
  leaveTypeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#000000",
  },
  availableText: {
    fontSize: 16,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  loadingText: {
    color: "#FFFFFF",
    marginTop: 8,
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  errorText: {
    color: "#EF4444",
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
    width: "100%",
  },
  cancelButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginRight: 16,
    borderWidth: 1,
    borderColor: "#333333",
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: "#BAC42A",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
  },
  submitButtonText: {
    fontSize: 16,
    color: "#000000",
    fontWeight: "500",
  },
  typeButtonDisabled: {
    backgroundColor: "#333333",
    opacity: 0.5,
  },
  typeButtonTextDisabled: {
    color: "#666666",
  },
  submitButtonDisabled: {
    backgroundColor: "#333333",
    opacity: 0.5,
  },
  submitButtonTextDisabled: {
    color: "#666666",
  },
  pendingBadge: {
    backgroundColor: "#F59E0B",
    opacity: 0.7,
  },
});
