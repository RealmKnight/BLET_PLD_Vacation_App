import React, { useState, useEffect } from "react";
import { Redirect, Stack, usePathname, useNavigation } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { View, StyleSheet, ActivityIndicator } from "react-native";

type AllowedRoutes = {
  application_admin: string[];
  union_admin: string[];
  division_admin: string[];
};

export default function AdminLayout() {
  const { member } = useAuth();
  const pathname = usePathname();
  const navigation = useNavigation();
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Monitor navigation state to show overlay during transitions
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", () => {
      setIsTransitioning(true);
    });

    const subscribeToFocus = navigation.addListener("focus", () => {
      // Delay hiding the overlay slightly to ensure smooth transition
      setTimeout(() => {
        setIsTransitioning(false);
      }, 100);
    });

    return () => {
      unsubscribe();
      subscribeToFocus();
    };
  }, [navigation]);

  // If no member or no role, redirect to home
  if (!member?.role) {
    return <Redirect href="/(tabs)" />;
  }

  // Define accessible routes based on role
  const allowedRoutes: AllowedRoutes = {
    application_admin: ["application", "union", "division"],
    union_admin: ["union", "division"],
    division_admin: ["division"],
  };

  const accessibleRoutes = allowedRoutes[member.role as keyof AllowedRoutes] || [];

  // Extract the route name more accurately from the pathname
  let currentRoute = pathname.split("/").pop();

  // Handle empty string (end slash case)
  if (currentRoute === "") {
    const segments = pathname.split("/").filter(Boolean);
    currentRoute = segments[segments.length - 1];
  }

  if (process.env.NODE_ENV !== "production") {
    console.log("AdminLayout - Current pathname:", pathname);
    console.log("AdminLayout - Extracted route:", currentRoute);
    console.log("AdminLayout - Accessible routes:", accessibleRoutes);
  }

  // If trying to access unauthorized route, redirect to first allowed route or home
  if (currentRoute && !accessibleRoutes.includes(currentRoute)) {
    // Use explicit routes instead of string concatenation to satisfy type checking
    const redirectPath =
      accessibleRoutes.length > 0
        ? accessibleRoutes[0] === "application"
          ? "/(admin)/application"
          : accessibleRoutes[0] === "union"
          ? "/(admin)/union"
          : "/(admin)/division"
        : "/";
    return <Redirect href={redirectPath} />;
  }

  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#000000" },
          animation: "fade",
          animationDuration: 100,
          presentation: "transparentModal",
        }}
      >
        <Stack.Screen name="application" />
        <Stack.Screen name="union" />
        <Stack.Screen name="division" />
      </Stack>

      {isTransitioning && (
        <View style={styles.overlay}>
          <ActivityIndicator size="small" color="#BAC42A" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
});
