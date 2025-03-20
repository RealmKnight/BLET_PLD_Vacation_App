import { Image, StyleSheet, Platform } from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

export function AuthHeader() {
  return (
    <ThemedView style={styles.container}>
      <Image source={require("@/assets/images/BLETblackgold.png")} style={styles.logo} />
      <ThemedText type="title" style={styles.title}>
        CN/WC GCA PLD App
      </ThemedText>
      <ThemedText style={styles.subtitle}>Personal Leave Day & Vacation Management</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 200,
    height: 120,
    resizeMode: "contain",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 8,
    color: "#BAC42A",
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    color: "#FFFFFF",
  },
});
