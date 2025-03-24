import { StyleSheet, TouchableOpacity, View, ScrollView, useWindowDimensions, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { HelloWave } from "@/components/HelloWave";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/contexts/AuthContext";
import { AuthHeader } from "@/components/AuthHeader";
import { AppHeader } from "@/components/AppHeader";

export default function HomeScreen() {
  const router = useRouter();
  const { signOut, member } = useAuth();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
      // Even if signOut fails, we still want to redirect to login
      // This handles cases where the session is already invalid
    } finally {
      // Always redirect to login, regardless of signOut success
      router.replace("/(auth)/login");
    }
  };

  const handleProfile = () => {
    console.log("Navigating to profile from home");
    router.push("/(profile)");
  };

  const handleAdmin = () => {
    router.push("/admin" as any);
  };

  const handleCalendar = () => {
    router.push("/calendar" as any);
  };

  const handleMyTime = () => {
    router.push("/mytime" as any);
  };

  const handleNotifications = () => {
    router.push("/notifications" as any);
  };

  const isAdmin = member?.role && ["division_admin", "union_admin", "application_admin"].includes(member.role);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ThemedView style={[styles.container, { backgroundColor: "#000000" }]}>
        <AppHeader />
        <ScrollView
          style={[styles.scrollView, { backgroundColor: "#000000" }]}
          contentContainerStyle={[styles.scrollContent, { backgroundColor: "#000000" }]}
          showsVerticalScrollIndicator={false}
        >
          <ThemedView style={[styles.content, isMobile && styles.contentMobile, { backgroundColor: "#000000" }]}>
            <View style={[styles.headerContainer, { backgroundColor: "#000000" }]}>
              <View style={[styles.header, { backgroundColor: "#000000" }]}>
                <AuthHeader />
              </View>
            </View>

            <ThemedView style={[styles.welcomeContainer, { backgroundColor: "#000000" }]}>
              <ThemedText type="title" style={[styles.welcomeText, isMobile && styles.welcomeTextMobile]}>
                Welcome, {member?.first_name}!
              </ThemedText>
              <HelloWave />
            </ThemedView>

            <ThemedView
              style={[styles.featuresGrid, isMobile && styles.featuresGridMobile, { backgroundColor: "#000000" }]}
            >
              <TouchableOpacity
                style={[styles.featureCard, isMobile && styles.featureCardMobile]}
                onPress={handleCalendar}
              >
                <Ionicons name="calendar-outline" size={32} color="#BAC42A" />
                <ThemedText type="subtitle" style={styles.featureTitle}>
                  Calendar
                </ThemedText>
                <ThemedText style={[styles.featureDescription, isMobile && styles.featureDescriptionMobile]}>
                  View and request PLDs, SVDs, and vacations
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.featureCard, isMobile && styles.featureCardMobile]}
                onPress={handleMyTime}
              >
                <Ionicons name="time-outline" size={32} color="#BAC42A" />
                <ThemedText type="subtitle" style={styles.featureTitle}>
                  My Time
                </ThemedText>
                <ThemedText style={[styles.featureDescription, isMobile && styles.featureDescriptionMobile]}>
                  Track your time off and requests
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.featureCard, isMobile && styles.featureCardMobile]}
                onPress={handleNotifications}
              >
                <Ionicons name="notifications-outline" size={32} color="#BAC42A" />
                <ThemedText type="subtitle" style={styles.featureTitle}>
                  Notifications
                </ThemedText>
                <ThemedText style={[styles.featureDescription, isMobile && styles.featureDescriptionMobile]}>
                  Stay updated with union news and alerts
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.featureCard, isMobile && styles.featureCardMobile]}
                onPress={handleProfile}
              >
                <Ionicons name="person-outline" size={32} color="#BAC42A" />
                <ThemedText type="subtitle" style={styles.featureTitle}>
                  Profile
                </ThemedText>
                <ThemedText style={[styles.featureDescription, isMobile && styles.featureDescriptionMobile]}>
                  Manage your account and preferences
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
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
    backgroundColor: "#000000",
  },
  fixedHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    paddingTop: Platform.OS === "ios" ? 44 : 24,
    paddingBottom: 8,
    backgroundColor: "#000000",
  },
  headerButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 16,
    backgroundColor: "#000000",
  },
  headerButtonsMobile: {
    paddingHorizontal: 10,
    gap: 8,
  },
  headerButton: {
    padding: 4,
  },
  headerButtonsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#000000",
  },
  headerButtonsRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#000000",
  },
  headerButtonsLeftMobile: {
    gap: 8,
  },
  headerButtonsRightMobile: {
    gap: 8,
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#000000",
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: Platform.OS === "ios" ? 80 : 60,
    backgroundColor: "#000000",
  },
  content: {
    padding: 20,
    maxWidth: 1200,
    alignSelf: "center",
    width: "100%",
    backgroundColor: "#000000",
  },
  contentMobile: {
    padding: 16,
  },
  headerContainer: {
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: "#000000",
  },
  header: {
    alignItems: "center",
    backgroundColor: "#000000",
  },
  welcomeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
    backgroundColor: "#000000",
  },
  welcomeText: {
    color: "#BAC42A",
    fontSize: 24,
  },
  welcomeTextMobile: {
    fontSize: 20,
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "space-between",
    backgroundColor: "#000000",
  },
  featuresGridMobile: {
    gap: 12,
  },
  featureCard: {
    width: "48%",
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#BAC42A",
  },
  featureCardMobile: {
    width: "100%",
    padding: 12,
  },
  featureTitle: {
    color: "#BAC42A",
    textAlign: "center",
    fontSize: 16,
  },
  featureDescription: {
    fontSize: 14,
    textAlign: "center",
    color: "#FFFFFF",
    opacity: 0.8,
  },
  featureDescriptionMobile: {
    fontSize: 12,
  },
});
