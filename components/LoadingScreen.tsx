import { ActivityIndicator, StyleSheet, Platform, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedView } from "./ThemedView";
import { ThemedText } from "./ThemedText";
import { useEffect, useState } from "react";

export function LoadingScreen() {
  const [showFallback, setShowFallback] = useState(false);
  const isWeb = Platform.OS === "web";

  useEffect(() => {
    if (isWeb) {
      // Show a fallback message if loading takes too long
      const timeout = setTimeout(() => {
        setShowFallback(true);
      }, 5000); // Reduced to 5 seconds for better UX

      return () => clearTimeout(timeout);
    }
  }, []);

  const handleRefresh = () => {
    if (isWeb) {
      window.location.reload();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#BAC42A" />
        {showFallback && isWeb && (
          <Pressable onPress={handleRefresh}>
            <ThemedView style={styles.fallbackContainer}>
              <ThemedText style={styles.fallbackText}>Taking longer than expected?</ThemedText>
              <ThemedText style={styles.refreshText}>Click here to refresh</ThemedText>
            </ThemedView>
          </Pressable>
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
    justifyContent: "center",
    alignItems: "center",
  },
  fallbackContainer: {
    marginTop: 20,
    alignItems: "center",
    padding: 16,
  },
  fallbackText: {
    textAlign: "center",
    opacity: 0.7,
    fontSize: 16,
  },
  refreshText: {
    marginTop: 8,
    color: "#BAC42A",
    textDecorationLine: "underline",
    fontSize: 14,
  },
});
