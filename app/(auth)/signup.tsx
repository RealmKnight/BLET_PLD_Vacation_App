import { useState } from "react";
import { StyleSheet, TouchableOpacity, View, useWindowDimensions, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedTextInput } from "@/components/ThemedTextInput";
import { AuthHeader } from "@/components/AuthHeader";
import { useAuth } from "@/contexts/AuthContext";

export default function SignupScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await signUp(email, password);
      router.replace("/(member-association)");
    } catch (err) {
      console.error("Signup error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === "object" && err !== null && "message" in err) {
        setError((err as { message: string }).message);
      } else {
        setError("Failed to create account. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false} showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.container}>
          <AuthHeader />

          <ThemedView style={[styles.form, isMobile && styles.formMobile]}>
            <ThemedText type="title" style={[styles.title, isMobile && styles.titleMobile]}>
              Create Account
            </ThemedText>
            <ThemedText style={[styles.subtitle, isMobile && styles.subtitleMobile]}>Sign up to get started</ThemedText>

            <ThemedTextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={[styles.input, isMobile && styles.inputMobile]}
            />

            <ThemedTextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={[styles.input, isMobile && styles.inputMobile]}
            />

            <ThemedTextInput
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              style={[styles.input, isMobile && styles.inputMobile]}
            />

            {error && <ThemedText style={styles.error}>{error}</ThemedText>}

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled, isMobile && styles.buttonMobile]}
              onPress={handleSignup}
              disabled={isLoading}
            >
              <ThemedText style={styles.buttonText}>{isLoading ? "Creating Account..." : "Create Account"}</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginLink} onPress={() => router.push("/(auth)/login")}>
              <ThemedText style={styles.loginText}>
                Already have an account? <ThemedText style={styles.loginTextHighlight}>Sign in</ThemedText>
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000000",
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingTop: Platform.OS === "ios" ? 44 : 24,
    minHeight: "100%",
  },
  form: {
    padding: 20,
    gap: 16,
    maxWidth: 600,
    alignSelf: "center",
    width: "100%",
    marginBottom: 20,
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
  error: {
    color: "#EF4444",
    textAlign: "center",
    fontSize: 14,
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
  loginLink: {
    marginTop: 16,
  },
  loginText: {
    textAlign: "center",
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.7,
  },
  loginTextHighlight: {
    color: "#BAC42A",
    textDecorationLine: "underline",
  },
});
