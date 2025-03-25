import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingScreen } from "@/components";
import { View, StyleSheet } from "react-native";

export default function Index() {
  const router = useRouter();
  const { member, user, needsMemberAssociation, isLoading } = useAuth();
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    if (isLoading || hasNavigated) return;

    // Add a short delay to ensure Root Layout is mounted
    const timer = setTimeout(() => {
      if (member) {
        router.replace("/(tabs)");
      } else if (user && needsMemberAssociation) {
        router.replace("/(member-association)");
      } else {
        router.replace("/(auth)/login");
      }
      setHasNavigated(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [member, user, needsMemberAssociation, isLoading, hasNavigated, router]);

  return (
    <View style={styles.container}>
      <LoadingScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
});
