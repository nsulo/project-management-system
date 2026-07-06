"use client";

import {
  useEffect,
  useState,
} from "react";

import Sidebar from "@/components/Sidebar";

import { supabase } from "@/lib/supabase";

import { logActivity } from "@/lib/logActivity";

type UserType = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at?: string;
};

export default function AdminUsersPage() {

  const [users, setUsers] =
    useState<UserType[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [fullName, setFullName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [role, setRole] =
    useState("client");

  const [
    creating,
    setCreating,
  ] = useState(false);

  const [
    editingUser,
    setEditingUser,
  ] = useState<UserType | null>(
    null
  );

  const [
    editFullName,
    setEditFullName,
  ] = useState("");

  const [
  editEmail,
  setEditEmail,
] = useState("");

  const [
    editRole,
    setEditRole,
  ] = useState("client");

  const [
    updating,
    setUpdating,
  ] = useState(false);

  useEffect(() => {

    fetchUsers();

    const channel =
      supabase
        .channel(
          "admin-users-realtime"
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "profiles",
          },
          () => {
            fetchUsers();
          }
        )
        .subscribe();

    return () => {

      supabase.removeChannel(
        channel
      );
    };

  }, []);

  async function fetchUsers() {

    setLoading(true);

    const { data, error } =
      await supabase
        .from("profiles")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

    if (error) {

      console.error(error);

      setLoading(false);

      return;
    }

    setUsers(data || []);

    setLoading(false);
  }

  async function handleCreateUser(
    e: React.FormEvent
  ) {

    e.preventDefault();

    if (
      !fullName ||
      !email ||
      !password
    ) {

      alert(
        "Please complete all fields"
      );

      return;
    }

    try {

      setCreating(true);

      const { data, error } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name:
                fullName,
              role,
            },
          },
        });

      if (error) {

        alert(error.message);

        setCreating(false);

        return;
      }

      if (data.user) {

        await supabase
          .from("profiles")
          .upsert({
            id: data.user.id,
            full_name:
              fullName,
            email,
            role,
          });

        await logActivity(
          "User Created",
          `Created ${role}: ${fullName}`
        );
      }

      alert(
        "User created successfully"
      );

      setFullName("");
      setEmail("");
      setPassword("");
      setRole("client");

      fetchUsers();

    } catch (err) {

      console.error(err);

    } finally {

      setCreating(false);
    }
  }

  function startEdit(
    user: UserType
  ) {

    setEditingUser(user);

    setEditFullName(
      user.full_name
    );

    setEditRole(user.role);
  }

  async function handleUpdateUser(
    e: React.FormEvent
  ) {

    e.preventDefault();

    if (!editingUser) return;

    try {

      setUpdating(true);

      const { error } =
        await supabase
          .from("profiles")
          .update({
            full_name:
              editFullName,
            role: editRole,
          })
          .eq(
            "id",
            editingUser.id
          );

      if (error) {

        alert(error.message);

        setUpdating(false);

        return;
      }

      await logActivity(
        "User Updated",
        `Updated user: ${editFullName}`
      );

      alert(
        "User updated successfully"
      );

      setEditingUser(null);

      fetchUsers();

    } catch (err) {

      console.error(err);

    } finally {

      setUpdating(false);
    }
  }

  async function handleDeleteUser(
    id: string,
    name: string
  ) {

    const confirmed =
      confirm(
        `Delete ${name}?`
      );

    if (!confirmed) return;

    const { error } =
      await supabase
        .from("profiles")
        .delete()
        .eq("id", id);

    if (error) {

      alert(error.message);

      return;
    }

    await logActivity(
      "User Deleted",
      `Deleted user: ${name}`
    );

    fetchUsers();
  }

  const filteredUsers =
    users.filter((user) =>
      user.full_name
        ?.toLowerCase()
        .includes(
          search.toLowerCase()
        ) ||
      user.email
        ?.toLowerCase()
        .includes(
          search.toLowerCase()
        ) ||
      user.role
        ?.toLowerCase()
        .includes(
          search.toLowerCase()
        )
    );

  if (loading) {

    return (
      <div className="p-10">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex">

      <Sidebar role="admin" />

      <main className="flex-1 min-h-screen bg-gray-100 p-6 md:p-10 pt-24 md:pt-10">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* CREATE USER */}

          <div className="bg-white p-6 rounded-2xl shadow h-fit">

            <h1 className="text-3xl font-bold text-blue-600 mb-6">

              Create User

            </h1>

            <form
              onSubmit={
                handleCreateUser
              }
              className="space-y-5"
            >

              <div>

                <label className="block mb-2 font-medium">

                  Full Name

                </label>

                <input
                  type="text"
                  value={fullName}
                  onChange={(e) =>
                    setFullName(
                      e.target.value
                    )
                  }
                  className="w-full border p-3 rounded-xl"
                  placeholder="Enter full name"
                />

              </div>

              <div>

                <label className="block mb-2 font-medium">

                  Email

                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(
                      e.target.value
                    )
                  }
                  className="w-full border p-3 rounded-xl"
                  placeholder="Enter email"
                />

              </div>

              <div>

                <label className="block mb-2 font-medium">

                  Password

                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
                  }
                  className="w-full border p-3 rounded-xl"
                  placeholder="Enter password"
                />

              </div>

              <div>

                <label className="block mb-2 font-medium">

                  Role

                </label>

                <select
                  value={role}
                  onChange={(e) =>
                    setRole(
                      e.target.value
                    )
                  }
                  className="w-full border p-3 rounded-xl"
                >

                  <option value="admin">
                    Admin
                  </option>

                  <option value="technician">
                    Technician
                  </option>

                  <option value="client">
                    Client
                  </option>

                </select>

              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl disabled:opacity-50"
              >

                {creating
                  ? "Creating..."
                  : "Create User"}

              </button>

            </form>

          </div>

          {/* USERS TABLE */}

          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

              <h2 className="text-3xl font-bold text-blue-600">

                System Users

              </h2>

              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                className="border p-3 rounded-xl w-full md:w-80"
              />

            </div>

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead>

                  <tr className="border-b">

                    <th className="text-left p-4">
                      Name
                    </th>

                    <th className="text-left p-4">
                      Email
                    </th>

                    <th className="text-left p-4">
                      Role
                    </th>

                    <th className="text-left p-4">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredUsers.length ===
                    0 && (

                    <tr>

                      <td
                        colSpan={4}
                        className="text-center p-10 text-gray-500"
                      >

                        No users found

                      </td>

                    </tr>

                  )}

                  {filteredUsers.map(
                    (user) => (

                      <tr
                        key={user.id}
                        className="border-b hover:bg-gray-50"
                      >

                        <td className="p-4 font-medium">

                          {
                            user.full_name
                          }

                        </td>

                        <td className="p-4 text-gray-600">

                          {user.email}

                        </td>

                        <td className="p-4">

                          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full capitalize text-sm">

                            {user.role}

                          </span>

                        </td>

                        <td className="p-4">

                          <div className="flex gap-3">

                            <button
                              onClick={() =>
                                startEdit(
                                  user
                                )
                              }
                              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg"
                            >

                              Edit

                            </button>

                            <button
                              onClick={() =>
                                handleDeleteUser(
                                  user.id,
                                  user.full_name
                                )
                              }
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                            >

                              Delete

                            </button>

                          </div>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          </div>

        </div>

        {/* EDIT MODAL */}

        {editingUser && (

          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">

            <div className="bg-white w-full max-w-xl rounded-2xl p-8">

              <h2 className="text-3xl font-bold mb-6">

                Edit User

              </h2>

              <form
                onSubmit={
                  handleUpdateUser
                }
                className="space-y-5"
              >

                <div>

                  <label className="block mb-2 font-medium">

                    Full Name

                  </label>

                  <input
                    type="text"
                    value={
                      editFullName
                    }
                    onChange={(e) =>
                      setEditFullName(
                        e.target.value
                      )
                    }
                    className="w-full border p-3 rounded-xl"
                  />

                </div>

                <div>

                  <label className="block mb-2 font-medium">

                    Role

                  </label>

                  <select
                    value={editRole}
                    onChange={(e) =>
                      setEditRole(
                        e.target.value
                      )
                    }
                    className="w-full border p-3 rounded-xl"
                  >

                    <option value="admin">
                      Admin
                    </option>

                    <option value="technician">
                      Technician
                    </option>

                    <option value="client">
                      Client
                    </option>

                  </select>

                </div>

                <div className="flex gap-4 pt-4">

                  <button
                    type="submit"
                    disabled={updating}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl disabled:opacity-50"
                  >

                    {updating
                      ? "Saving..."
                      : "Save Changes"}

                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setEditingUser(
                        null
                      )
                    }
                    className="flex-1 bg-gray-300 hover:bg-gray-400 p-3 rounded-xl"
                  >

                    Cancel

                  </button>

                </div>

              </form>

            </div>

          </div>

        )}

      </main>

    </div>
  );
}