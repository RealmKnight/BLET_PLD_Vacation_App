import { useState } from "react";
import { StyleSheet } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedTextInput } from "@/components/ThemedTextInput";
import { ThemedButton } from "@/components/ThemedButton";

export default function MemberAssociationScreen() {
  const { associateMember } = useAuth();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!pin) {
      setError("Please enter your CN PIN");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("MemberAssociationScreen: Attempting to associate member with PIN:", pin);
      await associateMember(parseInt(pin, 10));
      console.log("MemberAssociationScreen: Successfully associated member");
    } catch (err) {
      console.error("MemberAssociationScreen: Error associating member:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === "object" && err !== null && "message" in err) {
        setError((err as { message: string }).message);
      } else {
        setError("Failed to associate member. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Welcome to BLET PLD
      </ThemedText>
      <ThemedText style={styles.subtitle}>Please enter your CN PIN to continue</ThemedText>

      <ThemedView style={styles.form}>
        <ThemedTextInput
          placeholder="Enter your CN PIN"
          value={pin}
          onChangeText={setPin}
          keyboardType="number-pad"
          style={styles.input}
          maxLength={6}
        />

        {error && <ThemedText style={styles.error}>{error}</ThemedText>}

        <ThemedButton onPress={handleSubmit} disabled={isLoading} style={styles.button}>
          {isLoading ? "Associating..." : "Continue"}
        </ThemedButton>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: "center",
    opacity: 0.7,
  },
  form: {
    gap: 16,
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  error: {
    color: "#EF4444",
    textAlign: "center",
  },
  button: {
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
});
