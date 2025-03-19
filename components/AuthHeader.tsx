import { Image, StyleSheet } from "react-native";
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
    height: 130,
    resizeMode: "contain",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    color: "#BAC42A",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#FFFFFF",
    opacity: 0.8,
    textAlign: "center",
  },
});
