import React, { useState } from "react";
import { View, StyleSheet, Pressable, useWindowDimensions, ActivityIndicator } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { ThemedText } from "./ThemedText";

type AdminRoute = "application" | "union" | "division";
type AdminRoutePath = "/(admin)/application" | "/(admin)/union" | "/(admin)/division";

const ADMIN_ROUTES: Record<AdminRoute, { title: string; path: AdminRoutePath }> = {
  application: {
    title: "Application Dashboard",
    path: "/(admin)/application",
  },
  union: {
    title: "Union Dashboard",
    path: "/(admin)/union",
  },
  division: {
    title: "Division Dashboard",
    path: "/(admin)/division",
  },
};

type AdminRole = "application_admin" | "union_admin" | "division_admin";
type AllowedRoutes = Record<AdminRole, AdminRoute[]>;

export function AdminNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { member } = useAuth();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isSmallMobile = width < 480;
  const [isTransitioning, setIsTransitioning] = useState(false);

  console.log("AdminNavigation rendering with:", {
    pathname,
    memberRole: member?.role,
    isVisible: !!member?.role,
  });

  if (!member?.role) return null;

  const allowedRoutes: AllowedRoutes = {
    application_admin: ["application", "union", "division"],
    union_admin: ["union", "division"],
    division_admin: ["division"],
  };

  const accessibleRoutes = allowedRoutes[member.role as AdminRole] || [];
  console.log("Available routes for role:", accessibleRoutes);

  // Get title for current section
  const getCurrentTitle = () => {
    if (pathname.includes("application")) return "Application Admin";
    if (pathname.includes("union")) return "Union Admin";
    if (pathname.includes("division")) return "Division Admin";
    return "Admin Dashboard";
  };

  const handleNavigation = (routePath: AdminRoutePath) => {
    if (pathname !== routePath) {
      // Only show transition for actual navigation
      setIsTransitioning(true);

      // Navigate to the new route
      router.push(routePath);

      // Hide transition overlay after a short delay
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }
  };

  return (
    <View style={[styles.container, isMobile && styles.containerMobile]}>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>{getCurrentTitle()}</ThemedText>
      </View>
      <View
        style={[
          styles.tabsContainer,
          isMobile && styles.tabsContainerMobile,
          isSmallMobile && styles.tabsContainerSmallMobile,
        ]}
      >
        {accessibleRoutes.map((route) => {
          const routePath = ADMIN_ROUTES[route].path;
          const isActive = pathname.includes(route);
          console.log(`Route ${route}: isActive=${isActive}, path=${routePath}`);
          return (
            <Pressable
              key={route}
              style={[
                styles.button,
                isActive && styles.activeButton,
                isMobile && styles.buttonMobile,
                isSmallMobile && styles.buttonSmallMobile,
              ]}
              onPress={() => handleNavigation(routePath)}
            >
              <ThemedText style={[styles.buttonText, isActive && styles.activeButtonText]}>
                {ADMIN_ROUTES[route].title}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {isTransitioning && (
        <View style={styles.transitionOverlay}>
          <ActivityIndicator size="small" color="#BAC42A" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1A1A1A",
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
    marginTop: 70,
    paddingVertical: 16,
    zIndex: 0,
  },
  containerMobile: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  header: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 16,
    maxWidth: 1200,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#BAC42A",
    textAlign: "center",
  },
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    maxWidth: 1200,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 20,
  },
  tabsContainerMobile: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 0,
  },
  tabsContainerSmallMobile: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 0,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#333333",
    borderWidth: 1,
    borderColor: "transparent",
  },
  buttonMobile: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    flex: 1,
    minWidth: 120,
  },
  buttonSmallMobile: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    flex: 1,
    minWidth: 120,
  },
  activeButton: {
    backgroundColor: "#000000",
    borderColor: "#BAC42A",
  },
  buttonText: {
    fontSize: 14,
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "500",
  },
  activeButtonText: {
    color: "#BAC42A",
  },
  transitionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
});
