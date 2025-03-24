import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_API_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_API_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase configuration. Please check your .env file.");
}

// Custom storage adapter that works for web and native
const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    if (Platform.OS === "web") {
      // Check if we're in a browser environment
      if (typeof window !== "undefined") {
        return window.localStorage.getItem(key);
      }
      // Return null during SSR
      return null;
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === "web") {
      // Check if we're in a browser environment
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, value);
      }
      // No-op during SSR
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    if (Platform.OS === "web") {
      // Check if we're in a browser environment
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key);
      }
      // No-op during SSR
      return;
    }
    return SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Helper to get the current user's session
export async function getCurrentSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

// Helper to get the current user's profile
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

// Helper to get the current user's member profile
export async function getCurrentMember() {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data: member, error } = await supabase.from("members").select("*").eq("id", user.id).single();

  if (error) throw error;
  return member;
}
