"use client";

import { supabase } from "@/lib/supabase";

export async function getCurrentUserRole() {

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  console.log(
    "AUTH USER:",
    user
  );

  if (authError || !user) {

    console.log(
      "AUTH ERROR:",
      authError
    );

    return null;
  }

  const {
    data,
    error,
  } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  console.log(
    "PROFILE DATA:",
    data
  );

  console.log(
    "PROFILE ERROR:",
    error
  );

  if (error || !data) {

    return null;
  }

  return data.role;
}