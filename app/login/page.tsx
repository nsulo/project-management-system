"use client";

import Image from "next/image";
import {
  useEffect,
  useState,
} from "react";

import {
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

import { signIn } from "@/services/auth";
import { getCurrentUserRole } from "@/services/user";

export default function LoginPage() {
  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [showSplash, setShowSplash] =
    useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    return () =>
      clearTimeout(timer);
  }, []);

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
        setLoading(false);
        return;
      }

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            1000
          )
      );

      const role =
        await getCurrentUserRole();

      if (!role) {
        alert(
          "No role assigned"
        );

        setLoading(false);
        return;
      }

      document.cookie =
        `user-role=${role}; path=/`;

      if (role === "admin") {
        window.location.href =
          "/admin";
      } else if (
        role === "technician"
      ) {
        window.location.href =
          "/technician";
      } else if (
        role === "client"
      ) {
        window.location.href =
          "/client";
      } else {
        alert(
          "Invalid role detected"
        );
      }
    } catch (err) {
      console.error(err);

      alert(
        "Login failed"
      );
    } finally {
      setLoading(false);
    }
  }

  if (showSplash) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-900 via-blue-700 to-indigo-900 flex items-center justify-center">
        {/* Background Effects */}
        <div className="absolute top-20 left-20 h-72 w-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse" />

        <div className="absolute bottom-20 right-20 h-96 w-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />

        <div className="text-center z-10 animate-fadeIn">
          <div className="flex justify-center mb-8">
            <div className="bg-white p-5 rounded-3xl shadow-2xl">
              <Image
                src="/logo.jpeg"
                alt="ADE"
                width={140}
                height={140}
                className="rounded-2xl"
                priority
              />
            </div>
          </div>

          <h1 className="text-5xl font-bold text-white mb-3">
            ADE Project Management
          </h1>

          <p className="text-blue-100 text-lg mb-8">
            Ardent Digital Engineering
          </p>

          <div className="flex items-center justify-center gap-3 text-white">
            <Loader2
              className="animate-spin"
              size={22}
            />

            <span>
              Loading System...
            </span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex items-center justify-center p-6">

      {/* Background Blobs */}
      <div className="absolute top-0 left-0 h-80 w-80 bg-blue-400/20 rounded-full blur-3xl" />

      <div className="absolute bottom-0 right-0 h-96 w-96 bg-indigo-500/20 rounded-full blur-3xl" />

      <div className="w-full max-w-md z-10">

        <form
          onSubmit={handleLogin}
          className="backdrop-blur-xl bg-white/80 border border-white/40 rounded-3xl shadow-2xl p-8"
        >
          <div className="flex justify-center mb-6">
            <Image
              src="/logo.jpeg"
              alt="ADE"
              width={120}
              height={120}
              className="rounded-2xl shadow-lg"
              priority
            />
          </div>

          <h1 className="text-4xl font-bold text-center text-blue-700 mb-2">
            Welcome Back
          </h1>

          <p className="text-center text-gray-500 mb-8">
            Sign in to continue
          </p>

          <div className="mb-5">
            <label className="block text-sm font-medium mb-2">
              Email Address
            </label>

            <input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
              className="w-full rounded-2xl border border-gray-300 p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              required
            />
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium mb-2">
              Password
            </label>

            <div className="relative">
              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter password"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                className="w-full rounded-2xl border border-gray-300 p-4 pr-14 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                required
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                className="absolute right-4 top-4 text-gray-500"
              >
                {showPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading && (
              <Loader2
                size={20}
                className="animate-spin"
              />
            )}

            {loading
              ? "Logging in..."
              : "Login"}
          </button>
        </form>
      </div>
    </main>
  );
}