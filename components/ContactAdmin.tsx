import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedView } from "./ThemedView";
import { ThemedText } from "./ThemedText";

interface ContactAdminProps {
  onClose?: () => void;
}

export function ContactAdmin({ onClose }: ContactAdminProps) {
  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="subtitle" style={styles.title}>
          Need Help?
        </ThemedText>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#BAC42A" />
          </TouchableOpacity>
        )}
      </View>

      <ThemedView style={styles.content}>
        <ThemedText style={styles.description}>
          If you're having trouble associating your CN PIN, please contact your union representative or division
          administrator for assistance.
        </ThemedText>

        <ThemedView style={styles.contactInfo}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Contact Information
          </ThemedText>

          <View style={styles.contactItem}>
            <Ionicons name="mail-outline" size={20} color="#BAC42A" />
            <ThemedText style={styles.contactText}>Email: support@bletcnwcgca.org</ThemedText>
          </View>

          <View style={styles.contactItem}>
            <Ionicons name="call-outline" size={20} color="#BAC42A" />
            <ThemedText style={styles.contactText}>Phone: (920) 346-2906</ThemedText>
          </View>

          <View style={styles.contactItem}>
            <Ionicons name="location-outline" size={20} color="#BAC42A" />
            <ThemedText style={styles.contactText}>N6380 Church Road, Brandon, WI 53919</ThemedText>
          </View>
        </ThemedView>

        <ThemedView style={styles.instructions}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            What to Include
          </ThemedText>
          <ThemedText style={styles.instructionText}>
            • Your full name{"\n"}• Your CN PIN{"\n"}• Your division number{"\n"}• A brief description of the issue
            {"\n"}• Your contact information
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BAC42A",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#BAC42A",
  },
  title: {
    color: "#BAC42A",
    fontSize: 18,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 16,
    gap: 24,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: "#FFFFFF",
  },
  contactInfo: {
    gap: 12,
  },
  sectionTitle: {
    color: "#BAC42A",
    fontSize: 16,
    marginBottom: 8,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  contactText: {
    fontSize: 14,
    color: "#FFFFFF",
  },
  instructions: {
    gap: 8,
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#FFFFFF",
  },
});
