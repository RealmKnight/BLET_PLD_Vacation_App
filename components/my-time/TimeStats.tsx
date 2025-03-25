import React, { useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { TimeStats as TimeStatsType } from "@/hooks/useMyTime";

interface TimeStatsProps {
  stats: TimeStatsType;
  isLoading: boolean;
  onRequestPaidInLieu?: (requestId: string) => Promise<boolean>;
}

export function TimeStats({ stats, isLoading, onRequestPaidInLieu }: TimeStatsProps) {
  const [showPaidInLieuModal, setShowPaidInLieuModal] = useState(false);
  const [selectedType, setSelectedType] = useState<"PLD" | "SDV" | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  const handlePaidInLieuPress = () => {
    if (onRequestPaidInLieu) {
      setShowPaidInLieuModal(true);
    } else {
      Alert.alert("Feature Not Available", "The ability to request paid in lieu is not available at this time.");
    }
  };

  const handleSelectType = (type: "PLD" | "SDV") => {
    setSelectedType(type);
  };

  const handleConfirmPaidInLieu = async () => {
    if (!selectedType || !onRequestPaidInLieu) return;

    setIsRequesting(true);
    try {
      // We'd need the actual request ID here, but since we're just showing a modal
      // from the stats view, we'll just use a placeholder ID that would be selected
      // in a real implementation with a list of requests
      const success = await onRequestPaidInLieu("placeholder-id");

      if (success) {
        Alert.alert("Request Submitted", `Your request to receive payment for a ${selectedType} has been submitted.`);
      } else {
        Alert.alert("Request Failed", "Unable to process your request. Please try again later.");
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred while processing your request.");
    } finally {
      setIsRequesting(false);
      setShowPaidInLieuModal(false);
      setSelectedType(null);
    }
  };

  const handleCancelPaidInLieu = () => {
    setShowPaidInLieuModal(false);
    setSelectedType(null);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading time statistics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.firstColumn} />
        <View style={styles.column}>
          <Text style={styles.headerText}>PLD</Text>
        </View>
        <View style={styles.column}>
          <Text style={styles.headerText}>SDV</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.firstColumn}>
          <Text style={styles.rowTitle}>Total</Text>
        </View>
        <View style={styles.column}>
          <Text style={styles.value}>{stats.total.pld}</Text>
        </View>
        <View style={styles.column}>
          <Text style={styles.value}>{stats.total.sdv}</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.firstColumn}>
          <Text style={styles.rowTitle}>Available</Text>
        </View>
        <View style={styles.column}>
          <Text style={styles.value}>{stats.available.pld}</Text>
        </View>
        <View style={styles.column}>
          <Text style={styles.value}>{stats.available.sdv}</Text>
        </View>
        <View style={styles.iconContainer} />
      </View>

      <View style={styles.row}>
        <View style={styles.firstColumn}>
          <Text style={styles.rowTitle}>Requested</Text>
        </View>
        <View style={styles.column}>
          <Text style={styles.value}>{stats.requested.pld}</Text>
        </View>
        <View style={styles.column}>
          <Text style={styles.value}>{stats.requested.sdv}</Text>
        </View>
        <View style={styles.iconContainer} />
      </View>

      <View style={styles.row}>
        <View style={styles.firstColumn}>
          <Text style={styles.rowTitle}>Waitlisted</Text>
        </View>
        <View style={styles.column}>
          <Text style={styles.value}>{stats.waitlisted.pld}</Text>
        </View>
        <View style={styles.column}>
          <Text style={styles.value}>{stats.waitlisted.sdv}</Text>
        </View>
        <View style={styles.iconContainer} />
      </View>

      <View style={styles.row}>
        <View style={styles.firstColumn}>
          <Text style={styles.rowTitle}>Approved</Text>
        </View>
        <View style={styles.column}>
          <Text style={styles.value}>{stats.approved.pld}</Text>
        </View>
        <View style={styles.column}>
          <Text style={styles.value}>{stats.approved.sdv}</Text>
        </View>
        <View style={styles.iconContainer} />
      </View>

      <View style={styles.row}>
        <View style={styles.firstColumn}>
          <Text style={styles.rowTitle}>Paid in Lieu</Text>
        </View>
        <View style={styles.column}>
          <Text style={styles.value}>{stats.paidInLieu.pld}</Text>
        </View>
        <View style={styles.column}>
          <Text style={styles.value}>{stats.paidInLieu.sdv}</Text>
        </View>
        <TouchableOpacity style={styles.iconContainer} onPress={handlePaidInLieuPress}>
          <Feather name="dollar-sign" size={20} color="#BAC42A" />
        </TouchableOpacity>
      </View>

      {showPaidInLieuModal && (
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Request Paid in Lieu</Text>
            <Text style={styles.modalDescription}>Select the type of day you want to request payment for:</Text>

            <View style={styles.typeButtonsContainer}>
              <TouchableOpacity
                style={[styles.typeButton, selectedType === "PLD" && styles.selectedTypeButton]}
                onPress={() => handleSelectType("PLD")}
              >
                <Text style={[styles.typeButtonText, selectedType === "PLD" && styles.selectedTypeButtonText]}>
                  PLD
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeButton, selectedType === "SDV" && styles.selectedTypeButton]}
                onPress={() => handleSelectType("SDV")}
              >
                <Text style={[styles.typeButtonText, selectedType === "SDV" && styles.selectedTypeButtonText]}>
                  SDV
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancelPaidInLieu}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmButton, !selectedType && styles.disabledButton]}
                onPress={handleConfirmPaidInLieu}
                disabled={!selectedType || isRequesting}
              >
                <Text style={styles.confirmButtonText}>{isRequesting ? "Processing..." : "Request Payment"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#111111",
    borderRadius: 12,
    marginBottom: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#333333",
  },
  headerRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
    backgroundColor: "#1F1F1F",
    paddingVertical: 12,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  firstColumn: {
    flex: 2,
    paddingLeft: 16,
    justifyContent: "center",
  },
  column: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#BAC42A",
  },
  rowTitle: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  value: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  iconContainer: {
    width: 50,
    alignItems: "center",
    justifyContent: "center",
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
  // Modal styles
  modalContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "#1F1F1F",
    borderRadius: 12,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333333",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#BAC42A",
    marginBottom: 16,
    textAlign: "center",
  },
  modalDescription: {
    fontSize: 16,
    color: "#FFFFFF",
    marginBottom: 24,
    textAlign: "center",
  },
  typeButtonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
    width: "100%",
  },
  typeButton: {
    backgroundColor: "#333333",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginHorizontal: 8,
    minWidth: 100,
    alignItems: "center",
  },
  selectedTypeButton: {
    backgroundColor: "#BAC42A",
  },
  typeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  selectedTypeButtonText: {
    color: "#000000",
  },
  modalButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  cancelButton: {
    backgroundColor: "#333333",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: "#BAC42A",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 160,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.5,
  },
});
