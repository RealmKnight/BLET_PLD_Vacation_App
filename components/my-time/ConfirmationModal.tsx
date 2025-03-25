import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => Promise<boolean> | Promise<void>;
  onCancel: () => void;
  onSuccess?: () => Promise<void> | void;
  isLoading?: boolean;
  destructive?: boolean;
}

export function ConfirmationModal({
  visible,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  onSuccess,
  isLoading = false,
  destructive = false,
}: ConfirmationModalProps) {
  const handleConfirm = async () => {
    try {
      const result = await onConfirm();
      if (result !== false) {
        // If result is void or true, consider it successful
        if (onSuccess) {
          await onSuccess();
        }
      }
    } catch (error) {
      console.error("Error in confirmation:", error);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel} disabled={isLoading}>
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmButton, destructive && styles.destructiveButton, isLoading && styles.loadingButton]}
              onPress={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={[styles.confirmButtonText, destructive && styles.destructiveButtonText]}>
                  {confirmText}
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
    borderRadius: 12,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "#333333",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#CCCCCC",
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#2D2D2D",
    borderRadius: 8,
    marginRight: 12,
    minWidth: 100,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  confirmButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#BAC42A",
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "500",
  },
  destructiveButton: {
    backgroundColor: "#EF4444",
  },
  destructiveButtonText: {
    color: "#FFFFFF",
  },
  loadingButton: {
    opacity: 0.7,
  },
});
