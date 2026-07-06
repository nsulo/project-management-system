import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {

  try {

    const {
      id,
      full_name,
      email,
      role,
    } = await req.json();

    // Update auth email
    const { error: authError } =
      await admin.auth.admin.updateUserById(
        id,
        {
          email,
        }
      );

    if (authError) {

      return NextResponse.json(
        {
          error: authError.message,
        },
        {
          status: 400,
        }
      );

    }

    // Update profile
    const { error: profileError } =
      await admin
        .from("profiles")
        .update({
          full_name,
          email,
          role,
        })
        .eq("id", id);

    if (profileError) {

      return NextResponse.json(
        {
          error: profileError.message,
        },
        {
          status: 400,
        }
      );

    }

    return NextResponse.json({
      success: true,
    });

  }

  catch {

    return NextResponse.json(
      {
        error: "Unexpected server error",
      },
      {
        status: 500,
      }
    );

  }

}