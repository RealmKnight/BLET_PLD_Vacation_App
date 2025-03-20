import { useState } from "react";
import { StyleSheet, TouchableOpacity, View, ScrollView, Platform } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedTextInput } from "@/components/ThemedTextInput";
import { AuthHeader } from "@/components/AuthHeader";
import { ContactAdmin } from "@/components/ContactAdmin";
import { SafeAreaView } from "react-native-safe-area-context";
import { useWindowDimensions } from "react-native";

export default function MemberAssociationScreen() {
  const { associateMember } = useAuth();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showContactAdmin, setShowContactAdmin] = useState(false);
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const handleSubmit = async () => {
    if (!pin) {
      setError("Please enter your CN PIN");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("MemberAssociationScreen: Attempting to associate member with PIN:", pin);
      await associateMember(pin);
      console.log("MemberAssociationScreen: Successfully associated member");
    } catch (err) {
      console.error("MemberAssociationScreen: Error associating member:", err);
      if (err instanceof Error) {
        setError(err.message);
        setShowContactAdmin(true);
      } else if (typeof err === "object" && err !== null && "message" in err) {
        setError((err as { message: string }).message);
        setShowContactAdmin(true);
      } else {
        setError("Failed to associate member. Please try again.");
        setShowContactAdmin(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ThemedView style={styles.container}>
        <AuthHeader />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ThemedView style={[styles.form, isMobile && styles.formMobile]}>
            <ThemedText type="title" style={[styles.title, isMobile && styles.titleMobile]}>
              Welcome to BLET PLD
            </ThemedText>
            <ThemedText style={[styles.subtitle, isMobile && styles.subtitleMobile]}>
              Please enter your CN PIN to continue
            </ThemedText>

            <ThemedTextInput
              placeholder="Enter your CN PIN"
              value={pin}
              onChangeText={setPin}
              keyboardType="number-pad"
              style={[styles.input, isMobile && styles.inputMobile]}
              maxLength={6}
            />

            {error && (
              <ThemedView style={styles.errorContainer}>
                <ThemedText style={styles.error}>{error}</ThemedText>
                <TouchableOpacity style={styles.helpButton} onPress={() => setShowContactAdmin(true)}>
                  <ThemedText style={styles.helpButtonText}>Need Help?</ThemedText>
                </TouchableOpacity>
              </ThemedView>
            )}

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled, isMobile && styles.buttonMobile]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              <ThemedText style={styles.buttonText}>{isLoading ? "Associating..." : "Continue"}</ThemedText>
            </TouchableOpacity>

            {showContactAdmin && (
              <View style={styles.contactAdminContainer}>
                <ContactAdmin onClose={() => setShowContactAdmin(false)} />
              </View>
            )}
          </ThemedView>
        </ScrollView>
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: Platform.OS === "ios" ? 80 : 60,
  },
  form: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    gap: 16,
    maxWidth: 600,
    alignSelf: "center",
    width: "100%",
  },
  formMobile: {
    padding: 16,
  },
  title: {
    fontSize: 32,
    marginBottom: 8,
    textAlign: "center",
    color: "#BAC42A",
  },
  titleMobile: {
    fontSize: 28,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: "center",
    opacity: 0.7,
    color: "#FFFFFF",
  },
  subtitleMobile: {
    fontSize: 14,
    marginBottom: 24,
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#BAC42A",
    color: "#FFFFFF",
    fontSize: 16,
  },
  inputMobile: {
    height: 44,
    fontSize: 14,
  },
  errorContainer: {
    gap: 8,
  },
  error: {
    color: "#EF4444",
    textAlign: "center",
    fontSize: 14,
  },
  helpButton: {
    padding: 8,
    alignItems: "center",
  },
  helpButtonText: {
    color: "#BAC42A",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  button: {
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#BAC42A",
  },
  buttonMobile: {
    height: 44,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
  contactAdminContainer: {
    marginTop: 16,
  },
});
