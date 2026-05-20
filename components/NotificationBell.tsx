"use client";

import {
  Bell,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

export default function NotificationBell() {

  const [
    notifications,
    setNotifications,
  ] = useState<any[]>([]);

  const [open, setOpen] =
    useState(false);

  useEffect(() => {

    fetchNotifications();

    setupRealtime();

  }, []);

  async function fetchNotifications() {

    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user) return;

    const { data } =
      await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

    if (data) {
      setNotifications(data);
    }
  }

  async function setupRealtime() {

    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user) return;

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
            filter:
              `user_id=eq.${user.id}`,
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
  }

  const unreadCount =
    notifications.filter(
      (n) => !n.is_read
    ).length;

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

  return (
    <div className="relative">

      <button
        onClick={() =>
          setOpen(!open)
        }
        className="relative"
      >

        <Bell size={28} />

        {unreadCount > 0 && (

          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full">

            {unreadCount}

          </span>

        )}

      </button>

      {open && (

        <div className="absolute right-0 mt-4 w-80 bg-white shadow-xl rounded-xl p-4 z-50">

          <h2 className="text-xl font-bold mb-4">
            Notifications
          </h2>

          <div className="space-y-3 max-h-96 overflow-y-auto">

            {notifications.length === 0 && (

              <p className="text-gray-500">
                No notifications
              </p>

            )}

            {notifications.map(
              (notification) => (

                <div
                  key={
                    notification.id
                  }
                  className={`border p-3 rounded-lg cursor-pointer ${
                    notification.is_read
                      ? "bg-gray-50"
                      : "bg-blue-50"
                  }`}
                  onClick={() =>
                    markAsRead(
                      notification.id
                    )
                  }
                >

                  <h3 className="font-bold">
                    {
                      notification.title
                    }
                  </h3>

                  <p className="text-sm text-gray-600">
                    {
                      notification.message
                    }
                  </p>

                </div>

              )
            )}

          </div>

        </div>

      )}

    </div>
  );
}