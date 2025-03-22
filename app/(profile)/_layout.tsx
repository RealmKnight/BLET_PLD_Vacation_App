import { Stack } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

export default function ProfileLayout() {
  const { member } = useAuth();

  // Redirect if no member
  if (!member) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#000000" },
        animation: "slide_from_right",
        animationDuration: 200,
        presentation: "card",
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
