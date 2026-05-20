import { NextRequest } from "next/server";

import { createClient } from "@supabase/supabase-js";

const supabase =
  createClient(
    process.env
      .NEXT_PUBLIC_SUPABASE_URL!,
    process.env
      .NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

export async function GET(
  request: NextRequest
) {

  try {

    const authHeader =
      request.headers.get(
        "Authorization"
      );

    if (!authHeader) {

      return Response.json(
        {
          error:
            "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const token =
      authHeader.replace(
        "Bearer ",
        ""
      );

    const {
      data: { user },
      error: authError,
    } =
      await supabase.auth
        .getUser(token);

    if (
      authError ||
      !user
    ) {

      return Response.json(
        {
          error:
            "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const {
      data: profile,
      error: profileError,
    } =
      await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (
      profileError ||
      !profile
    ) {

      return Response.json(
        {
          error:
            "Profile not found",
        },
        {
          status: 404,
        }
      );
    }

    return Response.json(
      profile
    );

  } catch {

    return Response.json(
      {
        error:
          "Server error",
      },
      {
        status: 500,
      }
    );
  }
}