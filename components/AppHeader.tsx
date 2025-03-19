import { StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { ThemedView } from "./ThemedView";

export function AppHeader() {
  const router = useRouter();
  const { member, signOut } = useAuth();

  const handleAuthPress = () => {
    if (member) {
      signOut();
      router.replace("/(auth)/login");
    } else {
      router.push("/(auth)/login");
    }
  };

  return (
    <ThemedView style={styles.header}>
      <TouchableOpacity
        onPress={handleAuthPress}
        style={styles.authButton}
        accessibilityLabel={member ? "Sign out" : "Sign in"}
      >
        <Ionicons name={member ? "log-out-outline" : "log-in-outline"} size={24} color="#BAC42A" />
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  authButton: {
    padding: 8,
    borderRadius: 8,
  },
});
