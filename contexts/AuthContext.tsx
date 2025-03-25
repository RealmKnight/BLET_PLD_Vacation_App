import { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";
import { User } from "@supabase/supabase-js";
import { Platform } from "react-native";

type Member = Database["public"]["Tables"]["members"]["Row"];

// Email comes from auth.users, not from members table
interface AuthContextType {
  user: User | null; // Contains email from auth.users
  member: Member | null; // Contains profile data from members table
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
  const sessionCheckTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSessionCheckRef = useRef(Date.now());
  const isInitializedRef = useRef(false);

  // Function to update all auth states at once
  const updateAuthState = (states: {
    user: User | null;
    member: Member | null;
    needsMemberAssociation: boolean;
    isLoading: boolean;
  }) => {
    // Only update if there are actual changes
    const hasChanges =
      states.user?.id !== user?.id ||
      states.member?.id !== member?.id ||
      states.needsMemberAssociation !== needsMemberAssociation ||
      states.isLoading !== isLoading;

    if (hasChanges) {
      if (process.env.NODE_ENV !== "production") {
        console.log("Updating auth state", {
          userId: states.user?.id ? "present" : "none",
          memberId: states.member?.id ? "present" : "none",
          needsAssociation: states.needsMemberAssociation,
          loading: states.isLoading,
        });
      }
      setUser(states.user);
      setMember(states.member);
      setNeedsMemberAssociation(states.needsMemberAssociation);
      setIsLoading(states.isLoading);
    }
  };

  const fetchMember = async (userId: string) => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      if (process.env.NODE_ENV !== "production") {
        console.log("Already fetching member data, skipping...");
      }
      return;
    }

    // Don't fetch if we already have this member
    if (member?.id === userId) {
      if (process.env.NODE_ENV !== "production") {
        console.log("Member data already exists for user");
      }
      return;
    }

    try {
      isFetchingRef.current = true;
      if (process.env.NODE_ENV !== "production") {
        console.log("Fetching member data for user");
      }

      const { data: memberData, error: memberError } = await supabase
        .from("members")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (memberError) {
        console.error("Error fetching member");
        updateAuthState({
          user,
          member: null,
          needsMemberAssociation: false,
          isLoading: false,
        });
        return;
      }

      if (memberData) {
        if (process.env.NODE_ENV !== "production") {
          console.log("Found associated member");
        }
        // Ensure we still have the user when setting member
        const { data: currentUser } = await supabase.auth.getUser();
        updateAuthState({
          user: currentUser?.user || null,
          member: memberData,
          needsMemberAssociation: false,
          isLoading: false,
        });
        return;
      }

      // If we get here, we have no member data
      if (process.env.NODE_ENV !== "production") {
        console.log("No associated member found for user");
      }
      updateAuthState({
        user,
        member: null,
        needsMemberAssociation: true,
        isLoading: false,
      });
    } catch (error) {
      console.error("Unexpected error in fetchMember");
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
    const now = Date.now();
    const timeSinceLastCheck = now - lastSessionCheckRef.current;

    // Debounce session checks (2 second minimum between checks)
    if (!force && timeSinceLastCheck < 2000) {
      if (process.env.NODE_ENV !== "production") {
        console.log("Skipping session check due to debounce");
      }
      return;
    }

    // Don't check if we already have both user and member unless forced
    if (!force && user && member) {
      if (process.env.NODE_ENV !== "production") {
        console.log("Already have user and member, skipping session check");
      }
      return;
    }

    lastSessionCheckRef.current = now;

    try {
      if (process.env.NODE_ENV !== "production") {
        console.log("Checking for existing session...");
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        if (process.env.NODE_ENV !== "production") {
          console.log("Found existing session, restoring state...");
        }
        // Only update state if we have a different user or force is true
        if (force || !user || user.id !== session.user.id) {
          setUser(session.user);
          if (!member || member.id !== session.user.id) {
            setIsLoading(true);
            await fetchMember(session.user.id);
          } else {
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
        }
      } else {
        if (process.env.NODE_ENV !== "production") {
          console.log("No valid session found");
        }
        updateAuthState({
          user: null,
          member: null,
          needsMemberAssociation: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error("Error checking session");
      updateAuthState({
        user: null,
        member: null,
        needsMemberAssociation: false,
        isLoading: false,
      });
    }
  };

  // Initialize auth state once
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    async function initializeAuth() {
      try {
        if (process.env.NODE_ENV !== "production") {
          console.log("Initializing auth state...");
        }
        await checkAndRestoreSession(true);
      } catch (error) {
        console.error("Error in initializeAuth");
        updateAuthState({
          user: null,
          member: null,
          needsMemberAssociation: false,
          isLoading: false,
        });
      }
    }

    // Initialize auth state
    initializeAuth();

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (process.env.NODE_ENV !== "production") {
        console.log("Auth state change event:", _event, {
          hasSession: !!session,
          platform: Platform.OS,
        });
      }

      if (!session?.user) {
        if (process.env.NODE_ENV !== "production") {
          console.log("Auth state change: No session, clearing state");
        }
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
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array since this should only run once

  // Add visibility change handler for web
  useEffect(() => {
    if (!isWeb) return;

    async function handleVisibilityChange() {
      const now = Date.now();
      const timeSinceLastActive = now - lastActiveRef.current;
      const isVisible = document.visibilityState === "visible";

      if (isVisible && timeSinceLastActive > 5000) {
        // Only check if more than 5 seconds have passed
        if (process.env.NODE_ENV !== "production") {
          console.log("Tab became visible", { timeSinceLastActive });
        }
        // Only check session if we don't have both user and member
        if (!user || !member) {
          await checkAndRestoreSession(true);
        }
        lastActiveRef.current = now;
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isWeb, user, member]);

  // Add a timeout safety net for web
  useEffect(() => {
    if (!isWeb || !isLoading) return;

    // Set hydrated after initial render
    setIsHydrated(true);

    // Set a timeout to prevent infinite loading
    initTimeoutRef.current = setTimeout(() => {
      if (process.env.NODE_ENV !== "production") {
        console.log("Auth initialization timeout reached, resetting loading state");
      }
      setIsLoading(false);
    }, 10000); // 10 second timeout to allow for slower connections

    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };
  }, [isWeb, isLoading]);

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
      if (process.env.NODE_ENV !== "production") {
        console.error("Error signing in");
      }
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
      if (process.env.NODE_ENV !== "production") {
        console.error("Error signing up");
      }
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Error signing out");
        }
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
      if (process.env.NODE_ENV !== "production") {
        console.error("Error signing out");
      }
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
      if (process.env.NODE_ENV !== "production") {
        console.log("Starting member association with PIN");
      }
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
        if (process.env.NODE_ENV !== "production") {
          console.log("No member found with PIN");
        }
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

      if (process.env.NODE_ENV !== "production") {
        console.log("Successfully associated member, updating state");
      }
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
