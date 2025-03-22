import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingScreen } from "@/components";

export default function Index() {
  const router = useRouter();
  const { member, user, needsMemberAssociation, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (member) {
      router.replace("/(tabs)");
    } else if (user && needsMemberAssociation) {
      router.replace("/(member-association)");
    } else {
      router.replace("/(auth)/login");
    }
  }, [member, user, needsMemberAssociation, isLoading]);

  return <LoadingScreen />;
}
