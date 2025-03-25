import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from "react-native";
import { format } from "date-fns";
import { Feather } from "@expo/vector-icons";
import { CompanyRequest } from "@/hooks/useCompanyRequests";
import { DenialReasonModal } from "./DenialReasonModal";

interface CompanyRequestsListProps {
  requests: CompanyRequest[];
  onApprove: (requestId: string) => Promise<boolean>;
  onDeny: (requestId: string, reason: string) => Promise<boolean>;
  isLoading: boolean;
  onRefresh: () => void;
}

export function CompanyRequestsList({ requests, onApprove, onDeny, isLoading, onRefresh }: CompanyRequestsListProps) {
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
    const date = new Date(dateString);
    return format(date, "EEE, MMM d, yyyy");
  };

  if (requests.length === 0 && !isLoading) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No pending requests to process</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor="#BAC42A" />}
      >
        {requests.map((request) => (
          <View key={request.id} style={styles.requestItem}>
            <View style={styles.requestInfo}>
              <View style={styles.header}>
                <View style={styles.memberInfo}>
                  <Text style={styles.name}>
                    {request.first_name} {request.last_name}
                  </Text>
                  <Text style={styles.pin}>PIN: {request.pin_number}</Text>
                </View>
                <View style={[styles.typeBadge, request.leave_type === "PLD" ? styles.pldBadge : styles.sdvBadge]}>
                  <Text style={styles.typeText}>{request.leave_type}</Text>
                </View>
              </View>

              <View style={styles.dateContainer}>
                <Text style={styles.date}>{formatDate(request.request_date)}</Text>
                <Text style={styles.division}>Division {request.division}</Text>
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton]}
                onPress={() => handleApprove(request)}
                disabled={actionInProgress === request.id}
              >
                <Feather name="check" size={24} color="#34D399" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.denyButton]}
                onPress={() => openDenialModal(request)}
                disabled={actionInProgress === request.id}
              >
                <Feather name="x" size={24} color="#EF4444" />
              </TouchableOpacity>
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
});
