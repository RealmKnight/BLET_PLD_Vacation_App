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
import { useRouter, useSegments } from "expo-router";

// Prevent the splash screen from auto-hiding before asset loading is complete.
if (Platform.OS !== "web") {
  SplashScreen.preventAutoHideAsync();
}

function RootLayoutNav() {
  const { member, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inMemberAssociation = segments[0] === "(member-association)";
    const inTabs = segments[0] === "(tabs)";

    console.log("RootLayout: Navigation check", {
      member: member ? "exists" : "null",
      currentSegment: segments[0],
      isLoading,
    });

    // If we have a member
    if (member) {
      // We should never be on the member association screen
      if (inMemberAssociation) {
        console.log("RootLayout: Member exists, preventing member association screen");
        router.replace("/(tabs)");
        return;
      }

      // If we're on the auth screen, redirect to home
      if (inAuthGroup) {
        console.log("RootLayout: Member exists, redirecting to home");
        router.replace("/(tabs)");
        return;
      }
    } else {
      // If we don't have a member and we're not on the auth screen, redirect to login
      if (!inAuthGroup) {
        console.log("RootLayout: No member, redirecting to login");
        router.replace("/(auth)/login");
        return;
      }
    }
  }, [member, segments, isLoading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(member-association)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

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
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <RootLayoutNav />
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
