import { StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedView } from "@/components/ThemedView";
import { AuthHeader } from "@/components/AuthHeader";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function LoadingScreen() {
  const backgroundColor = useThemeColor({}, "background");

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]} edges={["top", "bottom"]}>
      <ThemedView style={styles.container}>
        <AuthHeader />
        <ActivityIndicator size="large" color="#BAC42A" style={styles.spinner} />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: {
    marginTop: 20,
  },
});
