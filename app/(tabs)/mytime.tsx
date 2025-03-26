import React, { useState } from "react";
import { StyleSheet, useWindowDimensions, Platform, View, RefreshControl, Alert, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { AppHeader } from "@/components/AppHeader";
import { TimeStats } from "@/components/my-time/TimeStats";
import { TimeOffRequestsList } from "@/components/my-time/TimeOffRequestsList";
import { ConfirmationModal } from "@/components/my-time/ConfirmationModal";
import { useMyTime, TimeOffRequest } from "@/hooks/useMyTime";
import { format } from "date-fns";
import { parseYMDDate } from "@/utils/date";

// Define sections for the FlatList
type Section = {
  id: string;
  type: "header" | "stats" | "requests" | "waitlisted";
};

const sections: Section[] = [
  { id: "header", type: "header" },
  { id: "stats", type: "stats" },
  { id: "requests", type: "requests" },
  { id: "waitlisted", type: "waitlisted" },
];

export default function MyTimeScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const { timeStats, timeOffRequests, isLoading, error, cancelRequest, requestPaidInLieu, refresh } = useMyTime();
  const [selectedRequest, setSelectedRequest] = useState<TimeOffRequest | null>(null);
  const [modalType, setModalType] = useState<"cancel" | "paidInLieu" | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Format date function using our utility
  const formatDate = (dateString: string) => {
    const normalizedDate = parseYMDDate(dateString);
    return format(normalizedDate, "MMM d, yyyy");
  };

  // Handle cancel confirmation
  const handleCancelConfirm = async () => {
    if (!selectedRequest) return;

    setActionInProgress(selectedRequest.id);
    const success = await cancelRequest(selectedRequest.id);
    setActionInProgress(null);

    if (!success) {
      Alert.alert("Error", "Failed to cancel request. Please try again.");
    }

    closeModal();
  };

  // Handle paid in lieu confirmation
  const handlePaidInLieuConfirm = async () => {
    if (!selectedRequest) return;

    setActionInProgress(selectedRequest.id);
    const success = await requestPaidInLieu(selectedRequest.id);
    setActionInProgress(null);

    if (!success) {
      Alert.alert("Error", "Failed to request paid in lieu. Please try again.");
    } else {
      Alert.alert("Success", "Your request has been submitted for payment in lieu.");
    }

    closeModal();
  };

  // Close modal
  const closeModal = () => {
    setModalType(null);
    setSelectedRequest(null);
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

  const renderSection = ({ item }: { item: Section }) => {
    switch (item.type) {
      case "header":
        return (
          <>
            <View style={styles.headerContainer}>
              <View style={styles.header}>
                <Image source={require("@/assets/images/BLETblackgold.png")} style={styles.logo} contentFit="contain" />
              </View>
            </View>

            <ThemedText type="title" style={styles.title}>
              My Time
            </ThemedText>

            {error && (
              <View style={styles.errorContainer}>
                <ThemedText style={styles.errorText}>{error}</ThemedText>
              </View>
            )}
          </>
        );

      case "stats":
        return <TimeStats stats={timeStats} isLoading={isLoading} onRequestPaidInLieu={requestPaidInLieu} />;

      case "requests":
        return (
          <TimeOffRequestsList
            requests={timeOffRequests}
            onCancelRequest={openCancelConfirmation}
            onRequestPaidInLieu={openPaidInLieuConfirmation}
            isLoading={isLoading}
            showWaitlisted={false}
            actionInProgress={actionInProgress}
          />
        );

      case "waitlisted":
        return (
          <TimeOffRequestsList
            requests={timeOffRequests}
            onCancelRequest={openCancelConfirmation}
            onRequestPaidInLieu={openPaidInLieuConfirmation}
            isLoading={isLoading}
            showWaitlisted={true}
            actionInProgress={actionInProgress}
          />
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ThemedView style={styles.container}>
        <AppHeader />
        <FlatList
          data={sections}
          renderItem={renderSection}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.content, isMobile && styles.contentMobile]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor="#BAC42A" />}
        />

        {/* Confirmation Modals */}
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
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000000",
  },
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#000000",
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: Platform.OS === "ios" ? 80 : 60,
    backgroundColor: "#000000",
    paddingBottom: 40,
  },
  content: {
    padding: 20,
    maxWidth: 800,
    alignSelf: "center",
    width: "100%",
    backgroundColor: "#000000",
  },
  contentMobile: {
    padding: 16,
    backgroundColor: "#000000",
  },
  headerContainer: {
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: "#000000",
  },
  header: {
    alignItems: "center",
    backgroundColor: "#000000",
  },
  logo: {
    width: 160,
    height: 100,
    marginBottom: 8,
  },
  title: {
    color: "#BAC42A",
    fontSize: 24,
    marginBottom: 20,
  },
  errorContainer: {
    backgroundColor: "#FF000030",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FF0000",
  },
  errorText: {
    color: "#FF0000",
    fontSize: 14,
  },
});
