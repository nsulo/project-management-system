"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  UserCircle2,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

import Sidebar from "@/components/Sidebar";

export default function SettingsPage() {

  const [user, setUser] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [fullName, setFullName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [avatarFile, setAvatarFile] =
    useState<File | null>(null);

  const [avatarUrl, setAvatarUrl] =
    useState("");

  const [role, setRole] =
    useState<
      "admin" |
      "technician" |
      "client"
    >("client");

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {

    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user) return;

    setUser(user);

    setEmail(
      user.email || ""
    );

    const { data } =
      await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    if (data) {

      setFullName(
        data.full_name || ""
      );

      setAvatarUrl(
        data.avatar_url || ""
      );

      setRole(data.role);
    }

    setLoading(false);
  }

  async function uploadAvatar() {

    if (!avatarFile || !user)
      return null;

    const fileExt =
      avatarFile.name
        .split(".")
        .pop();

    const fileName =
      `${user.id}-${Date.now()}.${fileExt}`;

    const { error } =
      await supabase.storage
        .from("avatars")
        .upload(
          fileName,
          avatarFile,
          {
            upsert: true,
          }
        );

    if (error) {
      alert(error.message);
      return null;
    }

    const {
      data: publicUrlData,
    } =
      supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  }

  async function handleUpdateProfile(
    e: React.FormEvent
  ) {

    e.preventDefault();

    setSaving(true);

    let uploadedAvatarUrl =
      avatarUrl;

    if (avatarFile) {

      const uploaded =
        await uploadAvatar();

      if (uploaded) {

        uploadedAvatarUrl =
          uploaded;
      }
    }

    const { error } =
      await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          avatar_url:
            uploadedAvatarUrl,
        })
        .eq("id", user.id);

    if (error) {

      alert(error.message);

      setSaving(false);

      return;
    }

    if (password) {

      const {
        error: passwordError,
      } =
        await supabase.auth
          .updateUser({
            password,
          });

      if (passwordError) {

        alert(
          passwordError.message
        );

        setSaving(false);

        return;
      }
    }

    alert(
      "Profile updated successfully"
    );

    setPassword("");

    setSaving(false);

    fetchProfile();
  }

  if (loading) {

    return (
      <div className="p-10">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex">

      <Sidebar role={role} />

      <main className="flex-1 min-h-screen bg-gray-100 p-6 md:p-10 pt-24 md:pt-10">

        <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow">

          <div className="mb-8">

            <h1 className="text-4xl font-bold text-blue-600">
              Account Settings
            </h1>

            <p className="text-gray-600 mt-2">
              Manage your profile information
            </p>

          </div>

          <form
            onSubmit={
              handleUpdateProfile
            }
            className="space-y-6"
          >

            <div className="flex flex-col items-center">

              {avatarUrl ? (

                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 mb-4"
                />

              ) : (

                <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center mb-4">

                  <UserCircle2
                    size={70}
                    className="text-gray-500"
                  />

                </div>

              )}

              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setAvatarFile(
                    e.target.files?.[0] ||
                    null
                  )
                }
              />

            </div>

            <div>

              <label className="block mb-2 font-medium">
                Full Name
              </label>

              <input
                type="text"
                className="w-full border p-3 rounded-xl"
                value={fullName}
                onChange={(e) =>
                  setFullName(
                    e.target.value
                  )
                }
              />

            </div>

            <div>

              <label className="block mb-2 font-medium">
                Email Address
              </label>

              <input
                type="email"
                value={email}
                disabled
                className="w-full border p-3 rounded-xl bg-gray-100"
              />

            </div>

            <div>

              <label className="block mb-2 font-medium">
                Account Role
              </label>

              <input
                type="text"
                value={role}
                disabled
                className="w-full border p-3 rounded-xl bg-gray-100 capitalize"
              />

            </div>

            <div>

              <label className="block mb-2 font-medium">
                New Password
              </label>

              <input
                type="password"
                className="w-full border p-3 rounded-xl"
                placeholder="Leave empty if unchanged"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
              />

            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 text-white p-4 rounded-xl hover:bg-blue-700 transition-all font-semibold"
            >

              {saving
                ? "Saving..."
                : "Save Changes"}

            </button>

          </form>

        </div>

      </main>

    </div>
  );
}