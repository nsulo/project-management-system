import { supabase } from "@/lib/supabase";

export async function signIn(
  email: string,
  password: string
) {

  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export async function signOut() {

  // REMOVE ROLE COOKIE

  document.cookie =
    "user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";

  return await supabase.auth.signOut();
}