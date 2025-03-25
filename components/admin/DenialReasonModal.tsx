import React, { useState } from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet, TextInput } from "react-native";
import { Feather } from "@expo/vector-icons";

interface DenialReasonModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isLoading: boolean;
}

const DENIAL_REASONS = [
  "No unscheduled days left to schedule for this request",
  "Date already filled",
  "Request conflicts with existing schedule",
  "Request submitted too late",
  "Other",
];

export function DenialReasonModal({ visible, onClose, onConfirm, isLoading }: DenialReasonModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customReason, setCustomReason] = useState<string>("");

  const handleConfirm = () => {
    const finalReason = selectedReason === "Other" ? customReason : selectedReason;
    if (finalReason.trim()) {
      onConfirm(finalReason);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Denial Reason</Text>
          <Text style={styles.description}>Select or enter a reason for denying this request:</Text>

          <View style={styles.reasonsContainer}>
            {DENIAL_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[styles.reasonButton, selectedReason === reason && styles.selectedReasonButton]}
                onPress={() => {
                  setSelectedReason(reason);
                  if (reason !== "Other") setCustomReason("");
                }}
              >
                <Text style={[styles.reasonButtonText, selectedReason === reason && styles.selectedReasonButtonText]}>
                  {reason}
                </Text>
                {selectedReason === reason && <Feather name="check" size={18} color="#000000" />}
              </TouchableOpacity>
            ))}
          </View>

          {selectedReason === "Other" && (
            <TextInput
              style={styles.customReasonInput}
              placeholder="Enter custom reason..."
              placeholderTextColor="#666666"
              value={customReason}
              onChangeText={setCustomReason}
              multiline
              numberOfLines={3}
            />
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={isLoading}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmButton,
                (!selectedReason || (selectedReason === "Other" && !customReason.trim())) && styles.disabledButton,
              ]}
              onPress={handleConfirm}
              disabled={isLoading || !selectedReason || (selectedReason === "Other" && !customReason.trim())}
            >
              <Text style={styles.confirmButtonText}>{isLoading ? "Denying..." : "Confirm Denial"}</Text>
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
    color: "#EF4444",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: "#FFFFFF",
    marginBottom: 16,
  },
  reasonsContainer: {
    marginBottom: 16,
  },
  reasonButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1F1F1F",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#333333",
  },
  selectedReasonButton: {
    backgroundColor: "#BAC42A",
  },
  reasonButtonText: {
    fontSize: 14,
    color: "#FFFFFF",
    flex: 1,
  },
  selectedReasonButtonText: {
    color: "#000000",
    fontWeight: "500",
  },
  customReasonInput: {
    backgroundColor: "#1F1F1F",
    borderRadius: 8,
    padding: 12,
    color: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#333333",
    marginBottom: 16,
    minHeight: 80,
    textAlignVertical: "top",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#333333",
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  confirmButton: {
    backgroundColor: "#EF4444",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  disabledButton: {
    opacity: 0.5,
  },
});
