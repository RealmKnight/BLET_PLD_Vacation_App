import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
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
  const { member, isLoading, needsMemberAssociation, user } = useAuth();
  const colorScheme = useColorScheme();

  // Add more detailed logging
  useEffect(() => {
    console.log("RootLayoutNav state change:", {
      hasMember: !!member,
      hasUser: !!user,
      memberData: member,
      isLoading,
      needsMemberAssociation,
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
    });
  }, [member, isLoading, needsMemberAssociation, user]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" redirect={!!member || (!!user && needsMemberAssociation)} />
        <Stack.Screen name="(member-association)" redirect={!user || !!member || !needsMemberAssociation} />
        <Stack.Screen name="(tabs)" redirect={!member} />
        <Stack.Screen name="index" redirect={true} />
      </Stack>
    </ThemeProvider>
  );
}
