"use client";
import Image from "next/image";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { signIn } from "@/services/auth";

import { getCurrentUserRole } from "@/services/user";

export default function LoginPage() {

  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleLogin(
    e: React.FormEvent
  ) {

    e.preventDefault();

    try {

      setLoading(true);

      const { error } =
        await signIn(
          email,
          password
        );

      if (error) {

        alert(error.message);

        return;
      }

      const role =
        await getCurrentUserRole();

      console.log(
        "ROLE FROM DB:",
        role
      );

      if (!role) {

        alert(
          "No role assigned"
        );

        return;
      }

      switch (role) {

        case "admin":

          router.push("/admin");

          break;

        case "technician":

          router.push(
            "/technician"
          );

          break;

        case "client":

          router.push("/client");

          break;

        default:

          console.log(
            "INVALID ROLE:",
            role
          );

          alert(
            "Invalid role detected"
          );
      }

    }

    catch (err) {

      console.error(err);

      alert(
        "Login failed"
      );
    }

    finally {

      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-6">

      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md"
      >
         <div className="flex justify-center mb-6">

  <Image
    src="/logo.jpeg"
    alt="Ardent Digital Engineering"
    width={180}
    height={180}
    className="rounded-xl"
    priority
  />

</div>
        <h1 className="text-3xl font-bold mb-2 text-center text-blue-600">

          Login

        </h1>

        <p className="text-gray-500 text-center mb-8">

          Access your dashboard

        </p>

        <div className="mb-4">

          <label className="block mb-2 text-sm font-medium">

            Email

          </label>

          <input
            type="email"
            placeholder="Enter email"
            className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={(e) =>
              setEmail(
                e.target.value
              )
            }
            required
          />

        </div>

        <div className="mb-6">

          <label className="block mb-2 text-sm font-medium">

            Password

          </label>

          <input
            type="password"
            placeholder="Enter password"
            className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
            required
          />

        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50"
        >

          {loading
            ? "Logging in..."
            : "Login"}

        </button>

      </form>

    </main>
  );
}