import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";
import { z } from "zod";

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  divisionId: z.number(),
  phoneNumber: z.string().optional(),
  employeeId: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

type RegisterInput = z.infer<typeof registerSchema>;
type LoginInput = z.infer<typeof loginSchema>;

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export async function register(input: RegisterInput) {
  try {
    // Validate input
    const validatedData = registerSchema.parse(input);

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
    });

    if (authError) throw new AuthError(authError.message);
    if (!authData.user) throw new AuthError("Failed to create user");

    // Create member profile
    const { error: memberError } = await supabase.from("members").insert({
      id: authData.user.id,
      email: validatedData.email,
      full_name: validatedData.fullName,
      division_id: validatedData.divisionId,
      role: "user", // Default role for new members
      is_active: true,
      phone_number: validatedData.phoneNumber,
      employee_id: validatedData.employeeId,
    });

    if (memberError) throw new AuthError(memberError.message);

    return { user: authData.user };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AuthError("Invalid input data");
    }
    if (error instanceof AuthError) {
      throw error;
    }
    throw new AuthError("An unexpected error occurred");
  }
}

export async function login(input: LoginInput) {
  try {
    // Validate input
    const validatedData = loginSchema.parse(input);

    // Sign in user
    const { data, error } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    });

    if (error) throw new AuthError(error.message);
    if (!data.user) throw new AuthError("Login failed");

    // Update last login
    await supabase.from("members").update({ last_login: new Date().toISOString() }).eq("id", data.user.id);

    return { user: data.user };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AuthError("Invalid input data");
    }
    if (error instanceof AuthError) {
      throw error;
    }
    throw new AuthError("An unexpected error occurred");
  }
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new AuthError(error.message);
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw new AuthError(error.message);
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (error) throw new AuthError(error.message);
}

export async function updateProfile(updates: Partial<Database["public"]["Tables"]["members"]["Update"]>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthError("No user found");

  const { error } = await supabase.from("members").update(updates).eq("id", user.id);

  if (error) throw new AuthError(error.message);
}
