import React from "react";
import { StyleSheet, TouchableOpacity, View, Platform, useWindowDimensions } from "react-native";
import { useRouter, usePathname } from "expo-router";
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
  const pathname = usePathname();
  const { member, signOut } = useAuth();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // Debug logging for member data
  console.log("Member data:", member);

  // Check if user is an admin (not just a regular user)
  const isAdmin = member?.role && ["division_admin", "union_admin", "application_admin"].includes(member.role);
  // In Expo Router, the actual route path doesn't include the group parentheses
  const isAdminRoute =
    pathname === "/application" || pathname === "/union" || pathname === "/division" || pathname.startsWith("/(admin)");

  // Debug logging
  console.log("Current pathname:", pathname);
  console.log("Is admin route:", isAdminRoute);
  console.log("Is admin:", isAdmin);

  const handleBack = () => router.back();
  const handleAdmin = () => {
    console.log("Handling admin click, isAdminRoute:", isAdminRoute);
    if (isAdminRoute) {
      // If we're on an admin route, go to the home/tabs screen
      router.push("/(tabs)");
    } else if (member?.role === "application_admin") {
      router.push("/(admin)/application");
    } else if (member?.role === "union_admin") {
      router.push("/(admin)/union");
    } else if (member?.role === "division_admin") {
      router.push("/(admin)/division");
    }
  };
  const handleProfile = () => {
    console.log("Navigating to profile");
    router.push("/(profile)");
  };
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
                  <Ionicons name={isAdminRoute ? "home-outline" : "settings-outline"} size={24} color="#BAC42A" />
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
