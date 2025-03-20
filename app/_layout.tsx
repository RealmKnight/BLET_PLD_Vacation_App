import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppHeader } from "@/components/AppHeader";
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

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded && Platform.OS !== "web") {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const { member, isLoading, needsMemberAssociation } = useAuth();
  const colorScheme = useColorScheme();

  console.log("RootLayoutNav state:", {
    hasMember: !!member,
    memberData: member,
    isLoading,
    needsMemberAssociation,
  });

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        {isLoading ? (
          <Stack.Screen name="(tabs)" options={{ animation: "none" }} />
        ) : member ? (
          <Stack.Screen name="(tabs)" options={{ animation: "none" }} />
        ) : needsMemberAssociation ? (
          <Stack.Screen name="(member-association)" options={{ animation: "none" }} />
        ) : (
          <Stack.Screen name="(auth)" options={{ animation: "none" }} />
        )}
      </Stack>
    </ThemeProvider>
  );
}
