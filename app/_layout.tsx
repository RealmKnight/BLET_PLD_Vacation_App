import React from "react";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState, useRef } from "react";
import "react-native-reanimated";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LoadingScreen } from "@/components";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Platform } from "react-native";

// Prevent the splash screen from auto-hiding before asset loading is complete.
if (Platform.OS !== "web") {
  SplashScreen.preventAutoHideAsync();
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    // Add your fonts here
  });
  const colorScheme = useColorScheme();

  // Create custom dark theme
  const customDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: "#000000",
      card: "#000000",
    },
  };

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded && Platform.OS !== "web") {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  return (
    <ThemeProvider value={colorScheme === "dark" ? customDarkTheme : DefaultTheme}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      {!loaded ? (
        <LoadingScreen />
      ) : (
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      )}
    </ThemeProvider>
  );
}

function RootLayoutNav() {
  const { member, isLoading, needsMemberAssociation, user } = useAuth();
  const colorScheme = useColorScheme();
  const [isNavigating, setIsNavigating] = useState(false);
  const isWeb = Platform.OS === "web";
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const prevUserRef = useRef(user);
  const prevMemberRef = useRef(member);
  const loadingTimeoutRef = useRef<NodeJS.Timeout>();

  // Add more detailed logging
  useEffect(() => {
    // Remove detailed logging with sensitive data
    if (process.env.NODE_ENV !== "production") {
      console.log("RootLayoutNav state change:", {
        hasMember: !!member,
        hasUser: !!user,
        isLoading,
        platform: Platform.OS,
        initialLoad,
      });
    }

    // Update refs after logging
    prevUserRef.current = user;
    prevMemberRef.current = member;
  }, [member, isLoading, needsMemberAssociation, user, initialLoad]);

  // Handle initial load state
  useEffect(() => {
    if (!isLoading && initialLoad) {
      setInitialLoad(false);
    }
  }, [isLoading]);

  // Handle tab visibility for web
  useEffect(() => {
    if (!isWeb) return;

    function handleVisibilityChange() {
      const isVisible = document.visibilityState === "visible";
      setIsTabVisible(isVisible);
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isWeb]);

  // Handle loading timeout for web
  useEffect(() => {
    if (!isWeb || !isLoading) return;

    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    // Set a new timeout
    loadingTimeoutRef.current = setTimeout(() => {
      if (process.env.NODE_ENV !== "production") {
        console.log("Loading timeout reached, forcing navigation state reset");
      }
      setIsNavigating(false);
      setInitialLoad(false);
    }, 3000); // 3 second timeout

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [isWeb, isLoading]);

  // Handle navigation state
  useEffect(() => {
    if (!isLoading && !initialLoad) {
      setIsNavigating(true);
      const timeout = setTimeout(
        () => {
          setIsNavigating(false);
        },
        isWeb ? 100 : 1000
      );
      return () => clearTimeout(timeout);
    }
  }, [isLoading, isWeb, initialLoad]);

  // Show loading only during initial load or explicit loading states
  const shouldShowLoading =
    (initialLoad && isLoading) || // Initial load
    (!initialLoad && isLoading && !member) || // Loading without member
    (isNavigating && !isWeb); // Native navigation

  if (shouldShowLoading && isTabVisible) {
    return <LoadingScreen />;
  }

  // Check if user is an admin
  const isAdmin = member?.role && ["division_admin", "union_admin", "application_admin"].includes(member.role);

  return (
    <>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#000000" },
          animation: "fade",
          animationDuration: 200,
          presentation: "card",
        }}
      >
        <Stack.Screen name="(auth)" redirect={!!member || (!!user && needsMemberAssociation)} />
        <Stack.Screen name="(member-association)" redirect={!user || !!member || !needsMemberAssociation} />
        <Stack.Screen name="(tabs)" redirect={!member} />
        <Stack.Screen name="(admin)" redirect={!member || !isAdmin} />
        <Stack.Screen name="(profile)" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="index" redirect={true} />
      </Stack>
    </>
  );
}
