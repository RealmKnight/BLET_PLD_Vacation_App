import { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSegments } from "expo-router";
import { Database } from "@/types/supabase";
import { User } from "@supabase/supabase-js";

type Member = Database["public"]["Tables"]["members"]["Row"];

interface AuthContextType {
  user: User | null;
  member: Member | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  associateMember: (pin: string) => Promise<void>;
  signOut: () => Promise<void>;
  needsMemberAssociation: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// This hook can be used to access the user info.
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// This hook will protect the route access based on user authentication.
function useProtectedRoute(member: Member | null, needsMemberAssociation: boolean) {
  const segments = useSegments();
  const router = useRouter();
  const isNavigatingRef = useRef(false);
  const previousMemberRef = useRef<Member | null>(null);

  // Effect to handle navigation
  useEffect(() => {
    console.log("useProtectedRoute: Current state:", {
      member: member ? "exists" : "null",
      needsMemberAssociation,
      currentSegment: segments[0],
      isNavigating: isNavigatingRef.current,
      previousMember: previousMemberRef.current ? "exists" : "null",
    });

    const inAuthGroup = segments[0] === "(auth)";
    const inMemberAssociation = segments[0] === "(member-association)";
    const inTabsGroup = segments[0] === "(tabs)";

    // If we're navigating, don't process any more navigation
    if (isNavigatingRef.current) {
      return;
    }

    // Handle navigation based on member state
    if (member) {
      // If we have a member, we should be on the home screen
      if (inAuthGroup || inMemberAssociation) {
        console.log("useProtectedRoute: Member exists, redirecting to home");
        isNavigatingRef.current = true;
        router.replace("/(tabs)");
        return;
      }
    } else if (needsMemberAssociation) {
      // If we need member association, go to that screen
      if (!inMemberAssociation) {
        console.log("useProtectedRoute: Needs member association, redirecting to association screen");
        isNavigatingRef.current = true;
        router.replace("/(member-association)");
        return;
      }
    } else if (!inAuthGroup) {
      // If we don't have a member and don't need association, go to login
      console.log("useProtectedRoute: No member, redirecting to login");
      isNavigatingRef.current = true;
      router.replace("/(auth)/login");
      return;
    }

    // Update previous member reference
    previousMemberRef.current = member;

    // Reset navigation state after a short delay
    if (isNavigatingRef.current) {
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 100);
    }
  }, [member, segments, needsMemberAssociation, router]);

  // Log state changes
  useEffect(() => {
    console.log("useProtectedRoute: State changed", {
      member: member ? "exists" : "null",
      needsMemberAssociation,
      currentSegment: segments[0],
      previousMember: previousMemberRef.current ? "exists" : "null",
    });
  }, [member, needsMemberAssociation, segments]);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [needsMemberAssociation, setNeedsMemberAssociation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session check:", session ? "Session exists" : "No session");
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchMember(session.user.id);
      } else {
        setMember(null);
        setNeedsMemberAssociation(false);
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session ? "Session exists" : "No session");
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchMember(session.user.id);
      } else {
        setMember(null);
        setNeedsMemberAssociation(false);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchMember = async (userId: string) => {
    try {
      console.log("Fetching member for user:", userId);
      const { data: memberData, error: memberError } = await supabase
        .from("members")
        .select("*")
        .eq("id", userId)
        .single()
        .throwOnError();

      if (memberError) {
        console.error("Error fetching member:", memberError);
        throw memberError;
      }

      if (memberData) {
        console.log("Found associated member:", memberData);
        setMember(memberData);
        setNeedsMemberAssociation(false);
      } else {
        console.log("No associated member found, checking for unclaimed members");
        // Check for unclaimed members
        const { data: unclaimedData, error: unclaimedError } = await supabase
          .from("members")
          .select("*")
          .is("id", null)
          .throwOnError();

        if (unclaimedError) {
          console.error("Error fetching unclaimed members:", unclaimedError);
          throw unclaimedError;
        }

        if (unclaimedData && unclaimedData.length > 0) {
          console.log("Found unclaimed members, needs association");
          setNeedsMemberAssociation(true);
        } else {
          console.log("No unclaimed members found");
          setNeedsMemberAssociation(false);
        }
      }
    } catch (error) {
      console.error("Error in fetchMember:", error);
      setNeedsMemberAssociation(false);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await fetchMember(data.user.id);
      }
    } catch (error) {
      console.error("Error signing in:", error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      if (data.user) {
        await fetchMember(data.user.id);
      }
    } catch (error) {
      console.error("Error signing up:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error);
        // If the session is already invalid, we still want to clear the state
        if (error.message.includes("Session from session_id claim in JWT does not exist")) {
          setUser(null);
          setMember(null);
          setNeedsMemberAssociation(false);
          return;
        }
        throw error;
      }
      setUser(null);
      setMember(null);
      setNeedsMemberAssociation(false);
    } catch (error) {
      console.error("Error signing out:", error);
      // Even if there's an error, we want to clear the state
      setUser(null);
      setMember(null);
      setNeedsMemberAssociation(false);
      throw error;
    }
  };

  const associateMember = async (pin: string) => {
    try {
      console.log("Starting member association with PIN:", pin);
      const { data: memberData, error: memberError } = await supabase
        .from("members")
        .select("*")
        .eq("pin", pin)
        .is("id", null)
        .single()
        .throwOnError();

      if (memberError) {
        console.error("Error finding member:", memberError);
        throw memberError;
      }

      if (!memberData) {
        console.log("No member found with PIN:", pin);
        throw new Error("Invalid PIN or member already associated");
      }

      console.log("Found member:", memberData);
      const { data: currentUser, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error("Error getting current user:", userError);
        throw userError;
      }

      if (!currentUser.user) {
        console.error("No current user found");
        throw new Error("No authenticated user found");
      }

      console.log("Current user:", currentUser.user);

      const { error: updateError } = await supabase
        .from("members")
        .update({ id: currentUser.user.id })
        .eq("pin", pin)
        .throwOnError();

      if (updateError) {
        console.error("Error updating member:", updateError);
        throw updateError;
      }

      console.log("Member updated successfully");
      setMember({ ...memberData, id: currentUser.user.id });
      setNeedsMemberAssociation(false);
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Error in associateMember:", error);
      throw error;
    }
  };

  const value = {
    user,
    member,
    needsMemberAssociation,
    isLoading,
    signIn,
    signUp,
    signOut,
    associateMember,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
