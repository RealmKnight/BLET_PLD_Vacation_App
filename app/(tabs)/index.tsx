import { StyleSheet, TouchableOpacity, View, ScrollView, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { HelloWave } from "@/components/HelloWave";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/contexts/AuthContext";
import { AuthHeader } from "@/components/AuthHeader";

export default function HomeScreen() {
  const router = useRouter();
  const { signOut, member } = useAuth();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleProfile = () => {
    router.push("/profile" as any);
  };

  const handleCalendar = () => {
    router.push("/calendar" as any);
  };

  const handleMyTime = () => {
    router.push("/my-time" as any);
  };

  const handleNotifications = () => {
    router.push("/notifications" as any);
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.fixedHeader}>
        <View style={[styles.headerButtons, isMobile && styles.headerButtonsMobile]}>
          <TouchableOpacity onPress={handleProfile} style={styles.headerButton}>
            <Ionicons name="person-circle-outline" size={24} color="#BAC42A" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.headerButton}>
            <Ionicons name="log-out-outline" size={24} color="#BAC42A" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        <ThemedView style={[styles.container, isMobile && styles.containerMobile]}>
          <View style={styles.headerContainer}>
            <View style={styles.header}>
              <AuthHeader />
            </View>
          </View>

          <ThemedView style={[styles.content, isMobile && styles.contentMobile]}>
            <ThemedView style={styles.welcomeContainer}>
              <ThemedText type="title" style={styles.welcomeText}>
                Welcome, {member?.first_name}!
              </ThemedText>
              <HelloWave />
            </ThemedView>

            <ThemedView style={styles.featuresGrid}>
              <TouchableOpacity style={styles.featureCard} onPress={handleCalendar}>
                <Ionicons name="calendar-outline" size={32} color="#BAC42A" />
                <ThemedText type="subtitle" style={styles.featureTitle}>
                  Calendar
                </ThemedText>
                <ThemedText style={styles.featureDescription}>View and request PLDs, SVDs, and vacations</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity style={styles.featureCard} onPress={handleMyTime}>
                <Ionicons name="time-outline" size={32} color="#BAC42A" />
                <ThemedText type="subtitle" style={styles.featureTitle}>
                  My Time
                </ThemedText>
                <ThemedText style={styles.featureDescription}>Track your time off and requests</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity style={styles.featureCard} onPress={handleNotifications}>
                <Ionicons name="notifications-outline" size={32} color="#BAC42A" />
                <ThemedText type="subtitle" style={styles.featureTitle}>
                  Notifications
                </ThemedText>
                <ThemedText style={styles.featureDescription}>Stay updated with union news and alerts</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity style={styles.featureCard} onPress={handleProfile}>
                <Ionicons name="person-outline" size={32} color="#BAC42A" />
                <ThemedText type="subtitle" style={styles.featureTitle}>
                  Profile
                </ThemedText>
                <ThemedText style={styles.featureDescription}>Manage your account and preferences</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerMobile: {
    maxWidth: 600,
    alignSelf: "center",
    width: "100%",
  },
  fixedHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingRight: 20,
    gap: 16,
  },
  headerButtonsMobile: {
    paddingRight: 10,
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  headerContainer: {
    paddingTop: 20,
    paddingBottom: 10,
  },
  header: {
    alignItems: "center",
  },
  content: {
    padding: 20,
  },
  contentMobile: {
    padding: 16,
  },
  welcomeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
  },
  welcomeText: {
    color: "#BAC42A",
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "space-between",
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
  featureTitle: {
    color: "#BAC42A",
    textAlign: "center",
  },
  featureDescription: {
    fontSize: 12,
    textAlign: "center",
    color: "#FFFFFF",
  },
});
