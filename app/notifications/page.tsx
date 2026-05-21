"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  Bell,
  CheckCheck,
} from "lucide-react";

import Sidebar from "@/components/Sidebar";

import { supabase } from "@/lib/supabase";

type NotificationType = {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export default function NotificationsPage() {

  const [
    notifications,
    setNotifications,
  ] = useState<
    NotificationType[]
  >([]);

  const [role, setRole] =
  useState<"admin" | "technician" | "client">("client");

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    fetchNotifications();

    const channel =
      supabase
        .channel(
          "notifications-realtime"
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table:
              "notifications",
          },
          () => {
            fetchNotifications();
          }
        )
        .subscribe();

    return () => {

      supabase.removeChannel(
        channel
      );
    };

  }, []);

  async function fetchNotifications() {

    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user) return;

    const {
      data: profile,
    } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    setRole(
      profile?.role || ""
    );

    const { data, error } =
      await supabase
        .from("notifications")
        .select("*")
        .or(
          `user_id.eq.${user.id},user_id.is.null`
        )
        .order("created_at", {
          ascending: false,
        });

    if (!error && data) {

      setNotifications(data);
    }

    setLoading(false);
  }

  async function markAsRead(
    id: number
  ) {

    await supabase
      .from("notifications")
      .update({
        is_read: true,
      })
      .eq("id", id);

    fetchNotifications();
  }

  async function markAllAsRead() {

    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user) return;

    await supabase
      .from("notifications")
      .update({
        is_read: true,
      })
      .or(
        `user_id.eq.${user.id},user_id.is.null`
      );

    fetchNotifications();
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

      <Sidebar
  role={
    role as
      | "admin"
      | "technician"
      | "client"
  }
/>

      <main className="flex-1 min-h-screen bg-gray-100 p-6 md:p-10 pt-24 md:pt-10">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

          <div>

            <h1 className="text-4xl font-bold text-blue-600">

              Notifications

            </h1>

            <p className="text-gray-600 mt-2">

              Realtime alerts and updates

            </p>

          </div>

          <button
            onClick={
              markAllAsRead
            }
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700"
          >

            <CheckCheck
              size={18}
            />

            Mark all as read

          </button>

        </div>

        <div className="space-y-5">

          {notifications.length ===
            0 && (

            <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-500">

              No notifications found

            </div>

          )}

          {notifications.map(
            (
              notification
            ) => (

              <div
                key={
                  notification.id
                }
                className={`bg-white rounded-2xl shadow p-6 border-l-4 ${
                  notification.is_read
                    ? "border-gray-300"
                    : "border-blue-600"
                }`}
              >

                <div className="flex items-start justify-between gap-4">

                  <div className="flex items-start gap-4">

                    <div
                      className={`p-3 rounded-xl ${
                        notification.is_read
                          ? "bg-gray-100"
                          : "bg-blue-100"
                      }`}
                    >

                      <Bell
                        className={`${
                          notification.is_read
                            ? "text-gray-500"
                            : "text-blue-600"
                        }`}
                        size={22}
                      />

                    </div>

                    <div>

                      <h2 className="text-xl font-bold">

                        {
                          notification.title
                        }

                      </h2>

                      <p className="text-gray-600 mt-2">

                        {
                          notification.message
                        }

                      </p>

                      <div className="text-sm text-gray-400 mt-3">

                        {new Date(
                          notification.created_at
                        ).toLocaleString()}

                      </div>

                    </div>

                  </div>

                  {!notification.is_read && (

                    <button
                      onClick={() =>
                        markAsRead(
                          notification.id
                        )
                      }
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                    >

                      Mark Read

                    </button>

                  )}

                </div>

              </div>

            )
          )}

        </div>

      </main>

    </div>
  );
}