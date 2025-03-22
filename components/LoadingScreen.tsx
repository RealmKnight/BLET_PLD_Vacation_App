import { ActivityIndicator, StyleSheet, Platform, Pressable, View } from "react-native";
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
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#BAC42A" />
          {showFallback && isWeb && (
            <Pressable onPress={handleRefresh}>
              <View style={styles.fallbackContainer}>
                <ThemedText style={styles.fallbackText}>Taking longer than expected?</ThemedText>
                <ThemedText style={styles.refreshText}>Click here to refresh</ThemedText>
              </View>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000000",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#000000",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
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
    color: "#FFFFFF",
  },
  refreshText: {
    marginTop: 8,
    color: "#BAC42A",
    textDecorationLine: "underline",
    fontSize: 14,
  },
});
