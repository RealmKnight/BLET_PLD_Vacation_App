import { useState } from "react";
import { StyleSheet, TouchableOpacity, View, useWindowDimensions, Platform } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { ThemedText } from "@/components/ThemedText";
import { ThemedTextInput } from "@/components/ThemedTextInput";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/contexts/AuthContext";
import { AuthHeader } from "@/components/AuthHeader";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await signIn(email, password);
      router.replace("/(tabs)");
    } catch (err) {
      console.error("Login error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === "object" && err !== null && "message" in err) {
        setError((err as { message: string }).message);
      } else {
        setError("Failed to sign in. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ThemedView style={styles.container}>
        <AuthHeader />

        <ThemedView style={[styles.form, isMobile && styles.formMobile]}>
          <ThemedText type="title" style={[styles.title, isMobile && styles.titleMobile]}>
            Welcome Back
          </ThemedText>
          <ThemedText style={[styles.subtitle, isMobile && styles.subtitleMobile]}>Sign in to your account</ThemedText>

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

          {error && <ThemedText style={styles.error}>{error}</ThemedText>}

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled, isMobile && styles.buttonMobile]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <ThemedText style={styles.buttonText}>{isLoading ? "Signing in..." : "Sign In"}</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.signupLink} onPress={() => router.push("/(auth)/signup")}>
            <ThemedText style={styles.signupText}>
              Don't have an account? <ThemedText style={styles.signupTextHighlight}>Sign up</ThemedText>
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
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
    paddingTop: Platform.OS === "ios" ? 44 : 24,
  },
  form: {
    padding: 20,
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
  signupLink: {
    marginTop: 16,
  },
  signupText: {
    textAlign: "center",
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.7,
  },
  signupTextHighlight: {
    color: "#BAC42A",
    textDecorationLine: "underline",
  },
});
