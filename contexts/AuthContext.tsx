import { createContext, useContext, useEffect, useState, useRef } from "react";
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
  const [isHydrated, setIsHydrated] = useState(Platform.OS !== "web");
  const initTimeoutRef = useRef<NodeJS.Timeout>();
  const isWeb = Platform.OS === "web";
  const initialCheckRef = useRef(false);
  const lastActiveRef = useRef(Date.now());
  const isFetchingRef = useRef(false);

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
    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      console.log("Already fetching member data, skipping...");
      return;
    }

    try {
      isFetchingRef.current = true;
      console.log("Fetching member data for user:", userId);

      const { data: memberData, error: memberError } = await supabase
        .from("members")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (memberError) {
        console.error("Error fetching member:", memberError);
        updateAuthState({
          user,
          member: null,
          needsMemberAssociation: false,
          isLoading: false,
        });
        return;
      }

      if (memberData) {
        console.log("Found associated member:", memberData);
        updateAuthState({
          user,
          member: memberData,
          needsMemberAssociation: false,
          isLoading: false,
        });
        return;
      }

      // If we get here, we have no member data
      console.log("No associated member found for user");
      updateAuthState({
        user,
        member: null,
        needsMemberAssociation: false,
        isLoading: false,
      });
    } catch (error) {
      console.error("Unexpected error in fetchMember:", error);
      updateAuthState({
        user,
        member: null,
        needsMemberAssociation: false,
        isLoading: false,
      });
    } finally {
      isFetchingRef.current = false;
    }
  };

  // Function to check and restore session
  const checkAndRestoreSession = async (force = false) => {
    try {
      console.log("Checking for existing session...", { force });
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        console.log("Found existing session, restoring state...");
        // Only update state if we have a different user or force is true
        if (force || !user || user.id !== session.user.id) {
          setUser(session.user);
          if (!member) {
            setIsLoading(true);
            await fetchMember(session.user.id);
          }
        } else {
          setIsLoading(false);
        }
      } else {
        console.log("No valid session found");
        updateAuthState({
          user: null,
          member: null,
          needsMemberAssociation: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error("Error checking session:", error);
      updateAuthState({
        user: null,
        member: null,
        needsMemberAssociation: false,
        isLoading: false,
      });
    }
  };

  // Add visibility change handler for web
  useEffect(() => {
    if (!isWeb) return;

    async function handleVisibilityChange() {
      const now = Date.now();
      const timeSinceLastActive = now - lastActiveRef.current;
      const isVisible = document.visibilityState === "visible";

      if (isVisible) {
        console.log("Tab became visible", { timeSinceLastActive });
        // Only check session if we don't have a user or member
        if (!user || !member) {
          await checkAndRestoreSession(true);
        }
        lastActiveRef.current = now;
      }
    }

    // Check immediately on mount
    if (!initialCheckRef.current) {
      initialCheckRef.current = true;
      checkAndRestoreSession(true);
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isWeb, user, member]);

  // Add a timeout safety net for web
  useEffect(() => {
    if (isWeb) {
      // Set hydrated after initial render
      setIsHydrated(true);

      // Set a timeout to prevent infinite loading
      initTimeoutRef.current = setTimeout(() => {
        console.log("Auth initialization timeout reached, resetting loading state");
        setIsLoading(false);
      }, 5000); // 5 second timeout
    }

    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };
  }, [isWeb]);

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      if (!mounted || initialCheckRef.current) return;

      try {
        console.log("Initializing auth state...");
        initialCheckRef.current = true;
        await checkAndRestoreSession();
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

      // Only update state if we have a different user
      if (!user || user.id !== session.user.id) {
        setUser(session.user);
        setIsLoading(true);
        await fetchMember(session.user.id);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [user]);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Force a fresh session check after sign in
        await checkAndRestoreSession(true);
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
