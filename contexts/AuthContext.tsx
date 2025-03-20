import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";
import { User } from "@supabase/supabase-js";
import { Platform } from "react-native";

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [needsMemberAssociation, setNeedsMemberAssociation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Function to update all auth states at once
  const updateAuthState = (states: {
    user: User | null;
    member: Member | null;
    needsMemberAssociation: boolean;
    isLoading: boolean;
  }) => {
    setUser(states.user);
    setMember(states.member);
    setNeedsMemberAssociation(states.needsMemberAssociation);
    setIsLoading(states.isLoading);
  };

  const fetchMember = async (userId: string) => {
    try {
      console.log("Fetching member data for user:", userId);

      // First get the current session to ensure we have the latest user data
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const currentUser = session?.user || null;

      if (!currentUser) {
        console.log("No active session found during fetchMember");
        updateAuthState({
          user: currentUser,
          member: member,
          needsMemberAssociation: needsMemberAssociation,
          isLoading: false,
        });
        return;
      }

      const { data: memberData, error: memberError } = await supabase
        .from("members")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      console.log("Member query result:", {
        memberData,
        hasError: !!memberError,
        errorCode: memberError?.code,
        platform: Platform.OS,
      });

      // Handle network errors first
      if (memberError?.code === "PGRST116") {
        console.log("Network error encountered, preserving previous member state");
        updateAuthState({
          user: currentUser,
          member: member,
          needsMemberAssociation: needsMemberAssociation,
          isLoading: false,
        });
        return;
      }

      // Clear member state if there's any other error
      if (memberError) {
        console.error("Error fetching member:", memberError);
        updateAuthState({
          user: currentUser,
          member: null,
          needsMemberAssociation: false,
          isLoading: false,
        });
        return;
      }

      // If we have member data, update state and return early
      if (memberData) {
        console.log("Found associated member:", memberData);
        updateAuthState({
          user: currentUser,
          member: memberData,
          needsMemberAssociation: false,
          isLoading: false,
        });
        return;
      }

      // If we get here, we have no member data and no errors
      console.log("No associated member found for user, checking for unclaimed members");
      const { data: unclaimedData, error: unclaimedError } = await supabase.from("members").select("*").is("id", null);

      const hasUnclaimedMembers = !unclaimedError && unclaimedData && unclaimedData.length > 0;
      console.log("Unclaimed members check:", {
        hasUnclaimedMembers,
        hasError: !!unclaimedError,
      });

      updateAuthState({
        user: currentUser,
        member: null,
        needsMemberAssociation: hasUnclaimedMembers,
        isLoading: false,
      });
    } catch (error) {
      console.error("Unexpected error in fetchMember:", error);
      updateAuthState({
        user: null,
        member: null,
        needsMemberAssociation: false,
        isLoading: false,
      });
    }
  };

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        console.log("Initializing auth state...");
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (sessionError) {
          console.error("Error getting session:", sessionError);
          updateAuthState({
            user: null,
            member: null,
            needsMemberAssociation: false,
            isLoading: false,
          });
          return;
        }

        console.log("Session check result:", {
          hasSession: !!session,
          userId: session?.user?.id,
          platform: Platform.OS,
        });

        if (!session?.user) {
          console.log("No active session found, clearing state");
          updateAuthState({
            user: null,
            member: null,
            needsMemberAssociation: false,
            isLoading: false,
          });
          return;
        }

        // Set initial state with user
        updateAuthState({
          user: session.user,
          member: null,
          needsMemberAssociation: false,
          isLoading: true,
        });

        // Then fetch member data
        await fetchMember(session.user.id);
      } catch (error) {
        console.error("Error in initializeAuth:", error);
        if (mounted) {
          updateAuthState({
            user: null,
            member: null,
            needsMemberAssociation: false,
            isLoading: false,
          });
        }
      }
    }

    // Initialize auth state
    initializeAuth();

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      console.log("Auth state change event:", _event, {
        hasSession: !!session,
        userId: session?.user?.id,
        platform: Platform.OS,
      });

      if (!session?.user) {
        console.log("Auth state change: No session, clearing state");
        updateAuthState({
          user: null,
          member: null,
          needsMemberAssociation: false,
          isLoading: false,
        });
        return;
      }

      // Set initial state with user
      updateAuthState({
        user: session.user,
        member: null,
        needsMemberAssociation: false,
        isLoading: true,
      });

      // Then fetch member data
      await fetchMember(session.user.id);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

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
        if (error.message.includes("Session from session_id claim in JWT does not exist")) {
          updateAuthState({
            user: null,
            member: null,
            needsMemberAssociation: false,
            isLoading: false,
          });
          return;
        }
        throw error;
      }
      updateAuthState({
        user: null,
        member: null,
        needsMemberAssociation: false,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error signing out:", error);
      updateAuthState({
        user: null,
        member: null,
        needsMemberAssociation: false,
        isLoading: false,
      });
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

      const { data: currentUser, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error("Error getting current user:", userError);
        throw userError;
      }

      if (!currentUser.user) {
        console.error("No current user found");
        throw new Error("No authenticated user found");
      }

      const { error: updateError } = await supabase
        .from("members")
        .update({ id: currentUser.user.id })
        .eq("pin", pin)
        .throwOnError();

      if (updateError) {
        console.error("Error updating member:", updateError);
        throw updateError;
      }

      console.log("Successfully associated member, updating state");
      updateAuthState({
        user: currentUser.user,
        member: { ...memberData, id: currentUser.user.id },
        needsMemberAssociation: false,
        isLoading: false,
      });
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
