"use client";

import {
  useEffect,
  useState,
} from "react";

import Sidebar from "@/components/Sidebar";

import { supabase } from "@/lib/supabase";

import {
  Bell,
  Trash2,
  CheckCheck,
} from "lucide-react";

type NotificationType = {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export default function AdminNotificationsPage() {

  const [
    notifications,
    setNotifications,
  ] = useState<
    NotificationType[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [unreadCount, setUnreadCount] =
    useState(0);

  useEffect(() => {

    fetchNotifications();

    const channel =
      supabase
        .channel(
          "admin-notifications"
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
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

    if (!user) {

      setLoading(false);

      return;
    }

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

    if (error) {

      console.error(
        JSON.stringify(
          error,
          null,
          2
        )
      );

      setLoading(false);

      return;
    }

    if (data) {

      setNotifications(data);

      const unread =
        data.filter(
          (item) => !item.is_read
        ).length;

      setUnreadCount(unread);
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

  async function markAllRead() {

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
      )
      .eq("is_read", false);

    fetchNotifications();
  }

  async function deleteNotification(
    id: number
  ) {

    const confirmed =
      confirm(
        "Delete notification?"
      );

    if (!confirmed) return;

    await supabase
      .from("notifications")
      .delete()
      .eq("id", id);

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

      <Sidebar role="admin" />

      <main className="flex-1 min-h-screen bg-gray-100 p-6 md:p-10 pt-24 md:pt-10">

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">

          <div>

            <div className="flex items-center gap-3 mb-2">

              <div className="relative">

                <Bell
                  className="text-blue-600"
                  size={34}
                />

                {unreadCount > 0 && (

                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold min-w-[22px] h-[22px] flex items-center justify-center rounded-full px-1">

                    {unreadCount}

                  </span>

                )}

              </div>

              <h1 className="text-4xl font-bold text-blue-600">

                Notifications

              </h1>

            </div>

            <p className="text-gray-600">

              System activity and updates

            </p>

          </div>

          <button
            onClick={
              markAllRead
            }
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl"
          >

            <CheckCheck
              size={18}
            />

            Mark All Read

          </button>

        </div>

        <div className="space-y-5">

          {notifications.length ===
            0 && (

            <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-500">

              No notifications yet

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
                className={`rounded-2xl shadow p-6 border ${
                  notification.is_read
                    ? "bg-white border-gray-100"
                    : "bg-blue-50 border-blue-200"
                }`}
              >

                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                  <div className="flex-1">

                    <div className="flex items-center gap-3 mb-3">

                      <h2 className="text-xl font-bold text-gray-800">

                        {
                          notification.title
                        }

                      </h2>

                      {!notification.is_read && (

                        <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">

                          New

                        </span>

                      )}

                    </div>

                    <p className="text-gray-700 leading-relaxed">

                      {
                        notification.message
                      }

                    </p>

                    <p className="text-sm text-gray-500 mt-4">

                      {new Date(
                        notification.created_at
                      ).toLocaleString()}

                    </p>

                  </div>

                  <div className="flex items-center gap-3">

                    {!notification.is_read && (

                      <button
                        onClick={() =>
                          markAsRead(
                            notification.id
                          )
                        }
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                      >

                        Mark Read

                      </button>

                    )}

                    <button
                      onClick={() =>
                        deleteNotification(
                          notification.id
                        )
                      }
                      className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-lg"
                    >

                      <Trash2
                        size={18}
                      />

                    </button>

                  </div>

                </div>

              </div>

            )
          )}

        </div>

      </main>

    </div>

  );
}