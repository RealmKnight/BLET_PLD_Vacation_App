import React from "react";
import { StyleSheet, TouchableOpacity, View, Platform, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";

interface AppHeaderProps {
  showBackButton?: boolean;
  showAdminButton?: boolean;
  showProfileButton?: boolean;
  showLogoutButton?: boolean;
  customLeftButton?: React.ReactNode;
  customRightButtons?: React.ReactNode;
}

export function AppHeader({
  showBackButton = false,
  showAdminButton = true,
  showProfileButton = true,
  showLogoutButton = true,
  customLeftButton,
  customRightButtons,
}: AppHeaderProps) {
  const router = useRouter();
  const { member, signOut } = useAuth();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // Check if user is an admin (not just a regular user)
  const isAdmin = member?.role && ["division_admin", "union_admin", "application_admin"].includes(member.role);

  const handleBack = () => router.back();
  const handleAdmin = () => router.push("/(tabs)/admin" as any);
  const handleProfile = () => router.push("/profile" as any);
  const handleLogout = async () => {
    try {
      await signOut();
      router.replace("/(auth)/login" as any);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <View style={styles.fixedHeader}>
      <View style={[styles.headerButtons, isMobile && styles.headerButtonsMobile]}>
        {/* Left side */}
        <View style={styles.leftButtons}>
          {customLeftButton || (
            <>
              {showBackButton && (
                <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
                  <Ionicons name="arrow-back-outline" size={24} color="#BAC42A" />
                </TouchableOpacity>
              )}
              {showAdminButton && isAdmin && (
                <TouchableOpacity onPress={handleAdmin} style={styles.headerButton}>
                  <Ionicons name="settings-outline" size={24} color="#BAC42A" />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* Right side */}
        <View style={styles.rightButtons}>
          {customRightButtons || (
            <>
              {showProfileButton && (
                <TouchableOpacity onPress={handleProfile} style={styles.headerButton}>
                  <Ionicons name="person-circle-outline" size={24} color="#BAC42A" />
                </TouchableOpacity>
              )}
              {showLogoutButton && (
                <TouchableOpacity onPress={handleLogout} style={styles.headerButton}>
                  <Ionicons name="log-out-outline" size={24} color="#BAC42A" />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  },
  headerButtonsMobile: {
    paddingHorizontal: 10,
  },
  leftButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  rightButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerButton: {
    padding: 8,
  },
});
