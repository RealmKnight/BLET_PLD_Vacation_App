import React, { useState, useMemo, useCallback, useEffect } from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native";
import { format, addDays, addMonths, isBefore, isAfter, startOfDay, parseISO } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useTimeOffRequests } from "@/hooks/useTimeOffRequests";
import { useMyTime } from "@/hooks/useMyTime";
import { getCurrentMember } from "@/lib/supabase";
import { useCalendarAllotments } from "@/hooks/useCalendarAllotments";
import { useTimeStore } from "@/store/timeStore";
import { formatDateToYMD } from "@/utils/date";
import { Database } from "@/types/supabase";
import { useFocusEffect } from "@react-navigation/native";

// Define types for allocation data
type MemberRequest = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  leave_type: Database["public"]["Enums"]["leave_type"];
  status: Database["public"]["Enums"]["pld_sdv_status"];
};

interface AllocationSlot {
  position: number;
  member: MemberRequest | null;
}

interface RequestData {
  id: string;
  leave_type: Database["public"]["Enums"]["leave_type"];
  status: Database["public"]["Enums"]["pld_sdv_status"];
  member_id: string;
  members: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    division: string | null;
  };
}

type Member = Database["public"]["Tables"]["members"]["Row"];

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
  const [isLoading, setIsLoading] = useState(false);
  const [maxAllotment, setMaxAllotment] = useState(6);
  const [error, setError] = useState<string | null>(null);
  const [existingRequest, setExistingRequest] = useState<{ type: "PLD" | "SDV"; status: string } | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  const { timeStats } = useTimeStore();
  const { submitRequest, isSubmitting } = useTimeOffRequests();
  const { refresh: refreshAllotments } = useCalendarAllotments(date || new Date());

  // Memoize date-related values
  const normalizedDate = useMemo(() => {
    if (!date) return null;
    const normalized = new Date(date);
    normalized.setHours(12, 0, 0, 0);
    return normalized;
  }, [date]);

  const formattedDate = useMemo(() => {
    return normalizedDate ? formatDateToYMD(normalizedDate) : null;
  }, [normalizedDate]);

  // Check if the date is eligible for requests - memoized
  const dateStatus = useMemo(() => {
    if (!normalizedDate) return { isEligible: false, isTooEarly: false, isTooLate: false };

    const today = startOfDay(new Date());
    today.setHours(12, 0, 0, 0);
    const minAllowedDate = addDays(today, 2);
    const maxAllowedDate = addMonths(today, 6);

    const isTooEarly = isBefore(normalizedDate, minAllowedDate);
    const isTooLate = isAfter(normalizedDate, maxAllowedDate);
    const isEligible = !isTooEarly && !isTooLate;

    return { isEligible, isTooEarly, isTooLate };
  }, [normalizedDate]);

  // Check if user can submit request - memoized
  const canSubmitRequest = useMemo(() => {
    if (!date || !dateStatus.isEligible || existingRequest) return false;

    const currentAllocations = allocations.filter((a) => a.member).length;
    if (currentAllocations >= maxAllotment) {
      return false;
    }

    return requestType === "PLD" ? timeStats.available.pld > 0 : timeStats.available.sdv > 0;
  }, [date, dateStatus.isEligible, allocations, maxAllotment, requestType, timeStats, existingRequest]);

  // Memoize the onClose callback
  const memoizedOnClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Memoize the refresh function
  const memoizedRefresh = useCallback(async () => {
    await refreshAllotments();
  }, [refreshAllotments]);

  // Memoize the submit handler
  const handleSubmit = useCallback(async () => {
    if (!canSubmitRequest || !date) return;

    try {
      setError(null);
      const success = await submitRequest(date, requestType, division);

      if (success) {
        await memoizedRefresh();
        if (onSubmit) {
          onSubmit(requestType);
        }
        memoizedOnClose();
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unexpected error occurred");
      }
    }
  }, [canSubmitRequest, date, requestType, division, submitRequest, memoizedRefresh, onSubmit, memoizedOnClose]);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setAllocations([]);
      setError(null);
      setExistingRequest(null);
    }
  }, [visible]);

  // Memoize the fetchAllocations function
  const fetchAllocations = useCallback(async () => {
    if (!formattedDate || !division || !dateStatus.isEligible || isLoading) return;

    try {
      setIsLoading(true);
      setError(null);

      // Get current member first
      const member = await getCurrentMember();
      if (!member?.id) {
        throw new Error("Unable to load member data");
      }

      // Optimize the query to get both requests and allotment in one go
      const { data: requestsData, error: requestsError } = await supabase
        .from("pld_sdv_requests")
        .select(
          `
          id,
          leave_type,
          status,
          member_id,
          members!inner (
            id,
            first_name,
            last_name,
            division
          )
        `
        )
        .eq("request_date", formattedDate)
        .eq("division", division)
        .or(
          `status.in.(pending,approved),and(member_id.eq.${member.id},status.in.(pending,approved,waitlisted,cancellation_pending))`
        );

      if (requestsError) throw requestsError;

      // Get max allotment
      const { data: allotmentData, error: allotmentError } = await supabase
        .from("pld_sdv_allotments")
        .select("max_allotment")
        .eq("date", formattedDate)
        .eq("division", division)
        .single();

      if (allotmentError) throw allotmentError;

      // Check for existing requests - use proper typing
      const existingReq = requestsData?.find(
        (req) =>
          req.member_id === member.id &&
          ["pending", "approved", "waitlisted", "cancellation_pending"].includes(req.status)
      );

      const newExistingRequest = existingReq
        ? {
            type: existingReq.leave_type,
            status: existingReq.status,
          }
        : null;

      // Set max allotment
      const slots = allotmentData?.max_allotment || maxAllotment;

      // Process requests and build allocation list
      const allocationsList: AllocationSlot[] = [];

      // Add existing requests (only pending and approved)
      if (requestsData) {
        requestsData
          .filter(
            (request) =>
              ["pending", "approved"].includes(request.status) &&
              request.members !== null &&
              request.members.id !== null
          )
          .forEach((request) => {
            if (request.members && request.members.id) {
              // TypeScript guard
              allocationsList.push({
                position: allocationsList.length + 1,
                member: {
                  id: request.members.id,
                  first_name: request.members.first_name ?? "",
                  last_name: request.members.last_name ?? "",
                  leave_type: request.leave_type,
                  status: request.status,
                },
              });
            }
          });
      }

      // Fill remaining slots
      for (let i = allocationsList.length; i < slots; i++) {
        allocationsList.push({
          position: i + 1,
          member: null,
        });
      }

      // Batch state updates
      setAllocations(allocationsList);
      setMaxAllotment(slots);
      setExistingRequest(newExistingRequest);
    } catch (error) {
      console.error("Error in fetchAllocations:", error);
      setError("An error occurred while loading the data.");
    } finally {
      setIsLoading(false);
    }
  }, [formattedDate, division, dateStatus.isEligible, isLoading, maxAllotment]);

  // Only fetch when modal becomes visible and we have valid data
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const loadData = async () => {
        if (!visible || !formattedDate || !dateStatus.isEligible || isFetching) return;

        try {
          setIsFetching(true);
          await fetchAllocations();
        } catch (error) {
          if (isMounted) {
            setError("Failed to load allocations");
          }
        } finally {
          if (isMounted) {
            setIsFetching(false);
          }
        }
      };

      loadData();

      return () => {
        isMounted = false;
      };
    }, [visible, formattedDate, dateStatus.isEligible, fetchAllocations, isFetching])
  );

  // Handle ineligible dates
  useEffect(() => {
    if (visible && date && !dateStatus.isEligible) {
      memoizedOnClose();
    }
  }, [visible, date, dateStatus.isEligible, memoizedOnClose]);

  if (!date) return null;

  // Render the allocation list
  const renderAllocationList = () => {
    if (isLoading) {
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

  // Get the submit button text
  const getSubmitButtonText = () => {
    if (!canSubmitRequest) {
      if (existingRequest) {
        return `${existingRequest.type} Request Already ${existingRequest.status}`;
      }
      if (requestType === "PLD" && timeStats.available.pld <= 0) {
        return "No PLD Days Available";
      }
      if (requestType === "SDV" && timeStats.available.sdv <= 0) {
        return "No SDV Days Available";
      }
      return "No Slots Available";
    }
    return "Submit Request";
  };

  return (
    <Modal
      visible={visible && dateStatus.isEligible}
      transparent
      animationType="slide"
      onRequestClose={memoizedOnClose}
    >
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
            <TouchableOpacity style={styles.cancelButton} onPress={memoizedOnClose} disabled={isSubmitting}>
              <Text style={[styles.cancelButtonText, isSubmitting && styles.disabledButtonText]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitButton,
                !canSubmitRequest && styles.submitButtonDisabled,
                isSubmitting && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!canSubmitRequest || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Text
                  style={[
                    styles.submitButtonText,
                    (!canSubmitRequest || isSubmitting) && styles.submitButtonTextDisabled,
                  ]}
                >
                  {getSubmitButtonText()}
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
  disabledButtonText: {
    opacity: 0.5,
  },
});
