import { View } from "react-native";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import { CompanyRequestsList } from "@/components/admin/CompanyRequestsList";
import { useCompanyRequests } from "@/hooks/useCompanyRequests";
import { TouchableOpacity } from "react-native";

export default function CompanyAdmin() {
  const { user, isLoading, signOut } = useAuth();
  const router = useRouter();
  const { requests, isLoading: requestsLoading, error, approveRequest, denyRequest, refresh } = useCompanyRequests();

  useEffect(() => {
    async function checkCompanyAdminAccess() {
      if (isLoading) {
        if (process.env.NODE_ENV !== "production") {
          console.log("Loading auth state...");
        }
        return;
      }

      if (!user) {
        if (process.env.NODE_ENV !== "production") {
          console.log("No user found, redirecting to login");
        }
        router.replace("/");
        return;
      }

      // Check if user has company_admin in their metadata
      const isCompanyAdmin = user.user_metadata?.is_company_admin === true;

      if (process.env.NODE_ENV !== "production") {
        console.log("Company admin check:", {
          metadata: user.user_metadata,
          isCompanyAdmin,
        });
      }

      if (!isCompanyAdmin) {
        if (process.env.NODE_ENV !== "production") {
          console.log("User is not a company admin, redirecting");
        }
        router.replace("/");
      }
    }

    checkCompanyAdminAccess();
  }, [user, isLoading]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <ThemedView style={{ flex: 1, padding: 16 }}>
          <ThemedText>Loading...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: "CN/WC BLET PLD/SDV App - Company Administration",
          headerShown: true,
          contentStyle: { backgroundColor: "#000000" },
          headerStyle: { backgroundColor: "#000000" },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: { color: "#FFFFFF" },
          headerRight: () => (
            <View style={{ paddingRight: 8 }}>
              <TouchableOpacity
                onPress={handleSignOut}
                className="bg-red-500 rounded-lg px-3 py-1.5 flex-row items-center justify-center"
              >
                <Ionicons name="log-out-outline" size={36} color="white" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <ThemedView style={{ flex: 1, padding: 16 }}>
        <ThemedText type="title" style={{ marginBottom: 16 }}>
          Welcome, {user?.email}
        </ThemedText>

        {error && (
          <ThemedView
            style={{
              backgroundColor: "#FF000020",
              padding: 12,
              borderRadius: 8,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: "#FF0000",
            }}
          >
            <ThemedText style={{ color: "#FF0000" }}>{error}</ThemedText>
          </ThemedView>
        )}

        <CompanyRequestsList
          requests={requests}
          onApprove={approveRequest}
          onDeny={denyRequest}
          isLoading={requestsLoading}
          onRefresh={refresh}
        />
      </ThemedView>
    </SafeAreaView>
  );
}
