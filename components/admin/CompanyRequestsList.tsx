import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { format } from "date-fns";
import { Feather } from "@expo/vector-icons";
import { CompanyRequest } from "@/hooks/useCompanyRequests";
import { DenialReasonModal } from "./DenialReasonModal";
import { parseYMDDate } from "@/utils/date";

interface CompanyRequestsListProps {
  requests: CompanyRequest[];
  onApprove: (requestId: string) => Promise<boolean>;
  onDeny: (requestId: string, reason: string) => Promise<boolean>;
  onApproveCancellation: (requestId: string) => Promise<boolean>;
  isLoading: boolean;
  onRefresh: () => Promise<void>;
}

export function CompanyRequestsList({
  requests,
  onApprove,
  onDeny,
  onApproveCancellation,
  isLoading,
  onRefresh,
}: CompanyRequestsListProps) {
  const [selectedRequest, setSelectedRequest] = useState<CompanyRequest | null>(null);
  const [showDenialModal, setShowDenialModal] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const handleApprove = async (request: CompanyRequest) => {
    setActionInProgress(request.id);
    const success = await onApprove(request.id);
    setActionInProgress(null);

    if (!success) {
      // Show error toast or alert
      console.error("Failed to approve request");
    }
  };

  const handleApproveCancellation = async (requestId: string) => {
    setActionInProgress(requestId);
    const success = await onApproveCancellation(requestId);
    setActionInProgress(null);

    if (!success) {
      Alert.alert("Error", "Failed to approve cancellation. Please try again.");
    }
  };

  const handleDeny = async (reason: string) => {
    if (!selectedRequest) return;

    setActionInProgress(selectedRequest.id);
    const success = await onDeny(selectedRequest.id, reason);
    setActionInProgress(null);

    if (!success) {
      // Show error toast or alert
      console.error("Failed to deny request");
    }

    setShowDenialModal(false);
    setSelectedRequest(null);
  };

  const openDenialModal = (request: CompanyRequest) => {
    setSelectedRequest(request);
    setShowDenialModal(true);
  };

  const formatDate = (dateString: string) => {
    const normalizedDate = parseYMDDate(dateString);
    return format(normalizedDate, "EEE, MMM d, yyyy");
  };

  const renderItem = ({ item }: { item: CompanyRequest }) => (
    <View style={[styles.requestItem, item.status === "cancellation_pending" && styles.cancellationPending]}>
      <View style={styles.requestInfo}>
        <Text style={styles.dateText}>{formatDate(item.request_date)}</Text>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>
            {item.first_name} {item.last_name}
          </Text>
          <View style={[styles.typeBadge, item.leave_type === "PLD" ? styles.pldBadge : styles.sdvBadge]}>
            <Text style={styles.typeText}>{item.leave_type}</Text>
          </View>
        </View>
        <Text style={[styles.statusText, item.status === "cancellation_pending" && styles.cancellationText]}>
          {item.status === "cancellation_pending" ? "Cancellation Pending" : item.status}
        </Text>
      </View>

      <View style={styles.actionsContainer}>
        {item.status === "cancellation_pending" ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleApproveCancellation(item.id)}
            disabled={actionInProgress === item.id}
          >
            {actionInProgress === item.id ? (
              <ActivityIndicator size="small" color="#34D399" />
            ) : (
              <Feather name="check" size={24} color="#34D399" />
            )}
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleApprove(item)}
              disabled={actionInProgress === item.id}
            >
              {actionInProgress === item.id ? (
                <ActivityIndicator size="small" color="#34D399" />
              ) : (
                <Feather name="check" size={24} color="#34D399" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.denyButton]}
              onPress={() => openDenialModal(item)}
              disabled={actionInProgress === item.id}
            >
              {actionInProgress === item.id ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Feather name="x" size={24} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor="#BAC42A" />}
      >
        {requests.map((request) => (
          <View
            key={request.id}
            style={[styles.requestItem, request.status === "cancellation_pending" && styles.cancellationRequest]}
          >
            <View style={styles.requestInfo}>
              <View style={styles.header}>
                <View style={styles.memberInfo}>
                  <Text style={styles.name}>
                    {request.first_name} {request.last_name}
                  </Text>
                  <Text style={styles.pin}>PIN: {request.pin_number}</Text>
                </View>
                <View
                  style={[
                    styles.typeBadge,
                    request.leave_type === "PLD" ? styles.pldBadge : styles.sdvBadge,
                    request.status === "cancellation_pending" && styles.cancellationBadge,
                  ]}
                >
                  <Text style={styles.typeText}>
                    {request.leave_type}
                    {request.status === "cancellation_pending" && " (Cancellation)"}
                  </Text>
                </View>
              </View>

              <View style={styles.dateContainer}>
                <Text style={styles.date}>{formatDate(request.request_date)}</Text>
                <Text style={styles.division}>Division {request.division}</Text>
              </View>
            </View>

            <View style={styles.actions}>
              {request.status === "cancellation_pending" ? (
                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => handleApproveCancellation(request.id)}
                  disabled={actionInProgress === request.id}
                >
                  {actionInProgress === request.id ? (
                    <ActivityIndicator size="small" color="#34D399" />
                  ) : (
                    <Feather name="check" size={24} color="#34D399" />
                  )}
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => handleApprove(request)}
                    disabled={actionInProgress === request.id}
                  >
                    {actionInProgress === request.id ? (
                      <ActivityIndicator size="small" color="#34D399" />
                    ) : (
                      <Feather name="check" size={24} color="#34D399" />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.denyButton]}
                    onPress={() => openDenialModal(request)}
                    disabled={actionInProgress === request.id}
                  >
                    {actionInProgress === request.id ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Feather name="x" size={24} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      <DenialReasonModal
        visible={showDenialModal}
        onClose={() => {
          setShowDenialModal(false);
          setSelectedRequest(null);
        }}
        onConfirm={handleDeny}
        isLoading={!!actionInProgress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  requestItem: {
    backgroundColor: "#111111",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333333",
  },
  requestInfo: {
    flex: 1,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  memberInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  pin: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 12,
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
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  date: {
    fontSize: 14,
    color: "#FFFFFF",
  },
  division: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "#333333",
    paddingTop: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
    backgroundColor: "#1F1F1F",
  },
  approveButton: {
    borderWidth: 1,
    borderColor: "#34D399",
  },
  denyButton: {
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  emptyContainer: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
  },
  cancellationRequest: {
    borderColor: "#EF4444",
    borderWidth: 2,
  },
  cancellationBadge: {
    backgroundColor: "#EF4444",
  },
  cancellationPending: {
    borderColor: "#EF4444",
    borderWidth: 2,
  },
  cancellationText: {
    color: "#EF4444",
    fontStyle: "italic",
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  denyButtonText: {
    color: "#EF4444",
  },
  dateText: {
    fontSize: 14,
    color: "#FFFFFF",
  },
  memberName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    color: "#FFFFFF",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "#333333",
    paddingTop: 12,
  },
});
