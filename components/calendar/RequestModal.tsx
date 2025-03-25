import React, { useState, useMemo } from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet, TextInput } from "react-native";
import { format, addDays, addMonths, isBefore, isAfter, startOfDay } from "date-fns";

interface RequestModalProps {
  visible: boolean;
  date: Date | null;
  onClose: () => void;
  onSubmit: (type: "PLD" | "SDV") => void;
}

export function RequestModal({ visible, date, onClose, onSubmit }: RequestModalProps) {
  const [requestType, setRequestType] = useState<"PLD" | "SDV">("PLD");

  // Calculate the allowed date range
  const dateRanges = useMemo(() => {
    const today = startOfDay(new Date());
    return {
      minAllowedDate: addDays(today, 2), // Min: current date + 2 days (48 hours)
      maxAllowedDate: addMonths(today, 6), // Max: current date + 6 months
    };
  }, []);

  // Check if the date is eligible for requests
  const dateStatus = useMemo(() => {
    if (!date) return { isEligible: false, isTooEarly: false, isTooLate: false };

    const isTooEarly = isBefore(date, dateRanges.minAllowedDate);
    const isTooLate = isAfter(date, dateRanges.maxAllowedDate);
    const isEligible = !isTooEarly && !isTooLate;

    return { isEligible, isTooEarly, isTooLate };
  }, [date, dateRanges]);

  const handleSubmit = () => {
    // Double-check date eligibility before submission
    if (date && dateStatus.isEligible) {
      onSubmit(requestType);
    } else {
      onClose();
    }
  };

  // If date isn't eligible, close the modal
  React.useEffect(() => {
    if (visible && date && !dateStatus.isEligible) {
      onClose();
    }
  }, [visible, date, dateStatus.isEligible, onClose]);

  // This is a placeholder for the next phase
  // We'll implement the full request modal with form fields

  if (!date) return null;

  return (
    <Modal visible={visible && dateStatus.isEligible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Request Leave for {format(date, "EEEE, MMMM d, yyyy")}</Text>

          <Text style={styles.description}>
            Submit a request for Personal Leave Day (PLD) or Single Vacation Day (SDV).
          </Text>

          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[styles.typeButton, requestType === "PLD" && styles.typeButtonSelected]}
              onPress={() => setRequestType("PLD")}
            >
              <Text style={[styles.typeButtonText, requestType === "PLD" && styles.typeButtonTextSelected]}>PLD</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeButton, requestType === "SDV" && styles.typeButtonSelected]}
              onPress={() => setRequestType("SDV")}
            >
              <Text style={[styles.typeButtonText, requestType === "SDV" && styles.typeButtonTextSelected]}>SDV</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.comingSoon}>Full request form coming in the next phase</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Submit Request</Text>
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
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#BAC42A",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: "#FFFFFF",
    marginBottom: 24,
  },
  typeSelector: {
    flexDirection: "row",
    marginBottom: 24,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#1F1F1F",
    borderWidth: 1,
    borderColor: "#333333",
  },
  typeButtonSelected: {
    backgroundColor: "#BAC42A",
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  typeButtonTextSelected: {
    color: "#000000",
  },
  comingSoon: {
    textAlign: "center",
    fontSize: 14,
    color: "#9CA3AF",
    fontStyle: "italic",
    marginVertical: 24,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: "#BAC42A",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  submitButtonText: {
    fontSize: 16,
    color: "#000000",
    fontWeight: "500",
  },
});
