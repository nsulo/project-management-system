import { supabase } from "./supabase";

export async function checkRole(
  allowedRole: string
) {

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { data, error } =
    await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

  if (error || !data) {
    return false;
  }

  return (
    data.role === allowedRole
  );
}