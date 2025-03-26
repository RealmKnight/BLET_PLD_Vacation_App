import React from "react";
import { StyleSheet, View, Text, TouchableOpacity, FlatList } from "react-native";
import { Feather } from "@expo/vector-icons";
import { TimeOffRequest } from "@/hooks/useMyTime";
import { parseYMDDate } from "@/utils/date";

interface TimeOffRequestsListProps {
  requests: TimeOffRequest[];
  onCancelRequest: (request: TimeOffRequest) => void;
  onRequestPaidInLieu: (request: TimeOffRequest) => void;
  isLoading: boolean;
  showWaitlisted?: boolean;
  actionInProgress: string | null;
}

export function TimeOffRequestsList({
  requests,
  onCancelRequest,
  onRequestPaidInLieu,
  isLoading,
  showWaitlisted = false,
  actionInProgress,
}: TimeOffRequestsListProps) {
  // Filter and sort requests
  const filteredRequests = requests
    .filter((request) => {
      if (showWaitlisted) {
        return request.status === "waitlisted";
      } else {
        return request.status !== "waitlisted" && request.status !== "cancelled";
      }
    })
    .sort((a, b) => {
      // Convert dates to Date objects for comparison
      const dateA = parseYMDDate(a.requestDate);
      const dateB = parseYMDDate(b.requestDate);
      // Sort ascending (closest dates first)
      return dateA.getTime() - dateB.getTime();
    });

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
          <Text style={styles.dateText}>{item.requestDate}</Text>
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
            onPress={() => onCancelRequest(item)}
            disabled={actionInProgress === item.id}
          >
            <Feather name="x-circle" size={22} color="#EF4444" />
          </TouchableOpacity>
        )}

        {/* Show cancel button for approved or waitlisted requests */}
        {(item.status === "waitlisted" || (item.status === "approved" && !item.paidInLieu)) && (
          <TouchableOpacity
            style={[styles.actionButton, styles.requestCancelButton]}
            onPress={() => onCancelRequest(item)}
            disabled={actionInProgress === item.id}
          >
            <Feather name="clock" size={22} color="#F59E0B" />
          </TouchableOpacity>
        )}

        {/* Show paid in lieu button for approved requests that aren't already paid in lieu */}
        {item.status === "approved" && !item.paidInLieu && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onRequestPaidInLieu(item)}
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
