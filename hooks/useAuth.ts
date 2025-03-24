import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";

export interface Member {
  id: string;
  role: "application_admin" | "union_admin" | "division_admin" | "company_admin" | "user";
  email: string;
  division_id?: number;
  created_at: string;
  updated_at: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  date_of_birth?: string;
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchMember(session.user.id);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchMember(session.user.id);
      } else {
        setMember(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchMember = async (userId: string) => {
    try {
      const { data, error } = await supabase.from("members").select("*").eq("id", userId).single();

      if (error) throw error;

      // Ensure the role is not null before setting the member
      if (data && data.role) {
        setMember(data as Member);
      } else {
        console.error("Member data is missing required fields:", data);
        setMember(null);
      }
    } catch (error) {
      console.error("Error fetching member:", error);
      setMember(null);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setMember(null);
      setSession(null);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  return {
    session,
    member,
    loading,
    signOut,
  };
}
