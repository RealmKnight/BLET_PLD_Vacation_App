import { Stack } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { router } from "expo-router";

export default function MemberAssociationLayout() {
  const { member, isLoading } = useAuth();

  // Redirect to tabs if user already has a member association
  useEffect(() => {
    if (!isLoading && member) {
      console.log("MemberAssociationLayout: Redirecting to tabs due to existing member");
      router.replace("/(tabs)");
    }
  }, [member, isLoading]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "none",
      }}
    />
  );
}
