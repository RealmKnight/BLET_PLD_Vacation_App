import { useEffect, useRef } from "react";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingScreen } from "@/components";

export default function NotFound() {
  const { member, isLoading, needsMemberAssociation, user } = useAuth();
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (hasNavigated.current || isLoading) return;

    let route = member ? "/(tabs)" : user && needsMemberAssociation ? "/(member-association)" : "/(auth)";

    if (process.env.NODE_ENV !== "production") {
      console.log("NotFound redirecting to:", route);
    }
    hasNavigated.current = true;
    router.replace(route as any);
  }, [member, isLoading, needsMemberAssociation, user]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return null;
}
