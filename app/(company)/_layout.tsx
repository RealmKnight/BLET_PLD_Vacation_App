import { Stack } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";

export default function CompanyLayout() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Only attempt navigation when loading is complete and we're not already at the root
    if (!isLoading && !user?.user_metadata?.is_company_admin && segments[0] === "(company)") {
      // Use setTimeout to ensure this happens after mount
      setTimeout(() => {
        router.replace("/");
      }, 0);
    }
  }, [user, isLoading, segments]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#000000" },
      }}
    >
      <Stack.Screen
        name="companyadmin"
        options={{
          headerShown: true,
          title: "Company Administration",
        }}
      />
    </Stack>
  );
}
