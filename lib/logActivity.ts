import { supabase } from "./supabase";

export async function logActivity(
  action: string,
  details: string
) {

  try {

    await supabase
      .from("activity_logs")
      .insert({
        action,
        details,
      });

  } catch (error) {

    console.error(
      "Activity log error:",
      error
    );
  }
}