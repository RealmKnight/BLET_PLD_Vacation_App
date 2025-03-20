import { useEffect } from "react";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

export default function NotFound() {
  const { member, isLoading, needsMemberAssociation } = useAuth();

  useEffect(() => {
    // Determine which screen to show
    const route = isLoading ? "/index" : member ? "/index" : needsMemberAssociation ? "/member-association" : "/auth";

    console.log("NotFound redirecting to:", route);
    router.replace(route);
  }, [member, isLoading, needsMemberAssociation]);

  return null;
}
