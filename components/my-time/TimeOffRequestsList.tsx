import React, { useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity, FlatList, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { TimeOffRequest } from "@/hooks/useMyTime";
import { ConfirmationModal } from "./ConfirmationModal";
import { formatDateToYMD, normalizeDate, parseYMDDate } from "@/utils/date";
import { format } from "date-fns";
import { useCalendarAllotments } from "@/hooks/useCalendarAllotments";

interface TimeOffRequestsListProps {
  requests: TimeOffRequest[];
  onCancel: (requestId: string) => Promise<boolean>;
  onRequestPaidInLieu: (requestId: string) => Promise<boolean>;
  isLoading: boolean;
  showWaitlisted?: boolean;
}

export function TimeOffRequestsList({
  requests,
  onCancel,
  onRequestPaidInLieu,
  isLoading,
  showWaitlisted = false,
}: TimeOffRequestsListProps) {
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<TimeOffRequest | null>(null);
  const [modalType, setModalType] = useState<"cancel" | "paidInLieu" | null>(null);

  // Get the calendar allotments functions
  const { refreshDate } = useCalendarAllotments(new Date());

  // Filter requests based on status (waitlisted or not)
  const filteredRequests = requests.filter((request) => {
    if (showWaitlisted) {
      return request.status === "waitlisted";
    } else {
      return request.status !== "waitlisted" && request.status !== "cancelled";
    }
  });

  // Format date function using our utility
  const formatDate = (dateString: string) => {
    const normalizedDate = parseYMDDate(dateString);
    return format(normalizedDate, "MMM d, yyyy");
  };

  // Open cancel confirmation modal
  const openCancelConfirmation = (request: TimeOffRequest) => {
    setSelectedRequest(request);
    setModalType("cancel");
  };

  // Open paid in lieu confirmation modal
  const openPaidInLieuConfirmation = (request: TimeOffRequest) => {
    setSelectedRequest(request);
    setModalType("paidInLieu");
  };

  // Close modal
  const closeModal = () => {
    setModalType(null);
    setSelectedRequest(null);
  };

  // Handle cancel confirmation
  const handleCancelConfirm = async () => {
    if (!selectedRequest) return;

    setActionInProgress(selectedRequest.id);
    const success = await onCancel(selectedRequest.id);
    setActionInProgress(null);

    if (success) {
      // Refresh the allotments for the specific date that was cancelled
      const requestDate = parseYMDDate(selectedRequest.requestDate);
      await refreshDate(requestDate);
    } else {
      Alert.alert("Error", "Failed to cancel request. Please try again.");
    }

    closeModal();
  };

  // Handle paid in lieu confirmation
  const handlePaidInLieuConfirm = async () => {
    if (!selectedRequest) return;

    setActionInProgress(selectedRequest.id);
    const success = await onRequestPaidInLieu(selectedRequest.id);
    setActionInProgress(null);

    if (!success) {
      Alert.alert("Error", "Failed to request paid in lieu. Please try again.");
    } else {
      Alert.alert("Success", "Your request has been submitted for payment in lieu.");
    }

    closeModal();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading requests...</Text>
      </View>
    );
  }

  if (filteredRequests.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{showWaitlisted ? "No waitlisted requests" : "No time off requests"}</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: TimeOffRequest }) => (
    <View style={[styles.requestItem, item.status === "cancellation_pending" && styles.cancellationPending]}>
      <View style={styles.requestInfo}>
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{formatDate(item.requestDate)}</Text>
          <View style={[styles.typeBadge, item.leaveType === "PLD" ? styles.pldBadge : styles.sdvBadge]}>
            <Text style={styles.typeText}>{item.leaveType}</Text>
          </View>
        </View>

        <View style={styles.statusContainer}>
          {showWaitlisted && item.waitlistPosition !== undefined && (
            <Text style={styles.waitlistText}>Position: {item.waitlistPosition}</Text>
          )}

          {!showWaitlisted && (
            <Text
              style={[
                styles.statusText,
                item.status === "approved" && styles.approvedText,
                item.status === "pending" && styles.pendingText,
                item.status === "denied" && styles.deniedText,
                item.status === "cancellation_pending" && styles.cancellationPendingText,
              ]}
            >
              {item.status === "cancellation_pending"
                ? "Cancellation Pending"
                : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              {item.paidInLieu && " • Paid in Lieu"}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.actionsContainer}>
        {/* Show cancel button for pending requests */}
        {item.status === "pending" && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openCancelConfirmation(item)}
            disabled={actionInProgress === item.id}
          >
            <Feather name="x-circle" size={22} color="#EF4444" />
          </TouchableOpacity>
        )}

        {/* Show cancel button for approved or waitlisted requests */}
        {(item.status === "waitlisted" || (item.status === "approved" && !item.paidInLieu)) && (
          <TouchableOpacity
            style={[styles.actionButton, styles.requestCancelButton]}
            onPress={() => openCancelConfirmation(item)}
            disabled={actionInProgress === item.id}
          >
            <Feather name="clock" size={22} color="#F59E0B" />
          </TouchableOpacity>
        )}

        {/* Show paid in lieu button for approved requests that aren't already paid in lieu */}
        {item.status === "approved" && !item.paidInLieu && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openPaidInLieuConfirmation(item)}
            disabled={actionInProgress === item.id}
          >
            <Feather name="dollar-sign" size={22} color="#BAC42A" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{showWaitlisted ? "Waitlisted Requests" : "Time Off Requests"}</Text>
      <FlatList
        data={filteredRequests}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Cancel Confirmation Modal */}
      {selectedRequest && modalType === "cancel" && (
        <ConfirmationModal
          visible={true}
          title="Cancel Request"
          message={`Are you sure you want to cancel your ${selectedRequest.leaveType} request for ${formatDate(
            selectedRequest.requestDate
          )}?`}
          confirmText="Cancel Request"
          cancelText="Keep Request"
          onConfirm={handleCancelConfirm}
          onCancel={closeModal}
          isLoading={actionInProgress === selectedRequest.id}
          destructive={true}
        />
      )}

      {/* Paid in Lieu Confirmation Modal */}
      {selectedRequest && modalType === "paidInLieu" && (
        <ConfirmationModal
          visible={true}
          title="Request Paid in Lieu"
          message={`Are you sure you want to request ${selectedRequest.leaveType} for ${formatDate(
            selectedRequest.requestDate
          )} to be paid in lieu?`}
          confirmText="Request Payment"
          cancelText="Cancel"
          onConfirm={handlePaidInLieuConfirm}
          onCancel={closeModal}
          isLoading={actionInProgress === selectedRequest.id}
          destructive={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#BAC42A",
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 8,
  },
  requestItem: {
    backgroundColor: "#111111",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#333333",
  },
  requestInfo: {
    flex: 1,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginRight: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  pldBadge: {
    backgroundColor: "#BAC42A",
  },
  sdvBadge: {
    backgroundColor: "#F59E0B",
  },
  typeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#000000",
  },
  statusContainer: {
    marginTop: 4,
  },
  statusText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  approvedText: {
    color: "#34D399",
  },
  pendingText: {
    color: "#F59E0B",
  },
  deniedText: {
    color: "#EF4444",
  },
  waitlistText: {
    fontSize: 14,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    marginLeft: 12,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: "#1F1F1F",
  },
  loadingContainer: {
    backgroundColor: "#111111",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  loadingText: {
    color: "#FFFFFF",
    opacity: 0.7,
  },
  emptyContainer: {
    backgroundColor: "#111111",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#333333",
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 16,
  },
  cancellationPending: {
    borderColor: "#EF4444",
    borderWidth: 2,
  },
  cancellationPendingText: {
    color: "#EF4444",
    fontStyle: "italic",
  },
  requestCancelButton: {
    backgroundColor: "#F59E0B",
  },
});
