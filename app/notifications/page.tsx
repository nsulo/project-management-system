"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Sidebar from "@/components/Sidebar";

import { supabase } from "@/lib/supabase";

import {
  Bell,
  CheckCheck,
  Search,
  Clock3,
  CheckCircle2,
  AlertCircle,
  Activity,
  FolderKanban,
  X,
  Filter,
} from "lucide-react";

type NotificationType = {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

type UserRole =
  | "admin"
  | "technician"
  | "client";

export default function NotificationsPage() {

  const [
    notifications,
    setNotifications,
  ] = useState<
    NotificationType[]
  >([]);

  const [role, setRole] =
    useState<UserRole>(
      "client"
    );

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [
    filter,
    setFilter,
  ] = useState<
    "all" |
    "unread" |
    "read"
  >("all");

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

    setLoading(true);

    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user) {

      setLoading(false);

      return;
    }

    const {
      data: profile,
    } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (
      profile?.role ===
        "admin" ||
      profile?.role ===
        "technician" ||
      profile?.role ===
        "client"
    ) {

      setRole(
        profile.role
      );
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

    setNotifications(
      (prev) =>
        prev.map((n) =>
          n.id === id
            ? {
                ...n,
                is_read: true,
              }
            : n
        )
    );
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

    setNotifications(
      (prev) =>
        prev.map((n) => ({
          ...n,
          is_read: true,
        }))
    );
  }

  const filteredNotifications =
    useMemo(() => {

      return notifications.filter(
        (notification) => {

          const matchesSearch =
            notification.title
              .toLowerCase()
              .includes(
                search.toLowerCase()
              ) ||
            notification.message
              .toLowerCase()
              .includes(
                search.toLowerCase()
              );

          const matchesFilter =
            filter === "all"
              ? true
              : filter ===
                "read"
              ? notification.is_read
              : !notification.is_read;

          return (
            matchesSearch &&
            matchesFilter
          );
        }
      );

    }, [
      notifications,
      search,
      filter,
    ]);

  const unreadCount =
    notifications.filter(
      (n) => !n.is_read
    ).length;

  function getNotificationIcon(
    title: string
  ) {

    const lower =
      title.toLowerCase();

    if (
      lower.includes(
        "project"
      )
    ) {

      return (
        <FolderKanban
          size={22}
        />
      );
    }

    if (
      lower.includes(
        "report"
      )
    ) {

      return (
        <Activity
          size={22}
        />
      );
    }

    if (
      lower.includes(
        "completed"
      )
    ) {

      return (
        <CheckCircle2
          size={22}
        />
      );
    }

    return (
      <Bell size={22} />
    );
  }

  function getNotificationColor(
    title: string
  ) {

    const lower =
      title.toLowerCase();

    if (
      lower.includes(
        "project"
      )
    ) {

      return "bg-blue-100 text-blue-600";
    }

    if (
      lower.includes(
        "report"
      )
    ) {

      return "bg-yellow-100 text-yellow-600";
    }

    if (
      lower.includes(
        "completed"
      )
    ) {

      return "bg-green-100 text-green-600";
    }

    return "bg-purple-100 text-purple-600";
  }

  if (loading) {

    return (
      <div className="flex">

        <Sidebar
          role={role}
        />

        <main className="flex-1 min-h-screen bg-gray-100 p-10">

          <div className="animate-pulse space-y-6">

            <div className="h-20 bg-gray-200 rounded-3xl" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {[...Array(3)].map(
                (_, i) => (

                  <div
                    key={i}
                    className="h-32 bg-gray-200 rounded-3xl"
                  />

                )
              )}

            </div>

            {[...Array(4)].map(
              (_, i) => (

                <div
                  key={i}
                  className="h-40 bg-gray-200 rounded-3xl"
                />

              )
            )}

          </div>

        </main>

      </div>
    );
  }

  return (
    <div className="flex bg-gray-100">

      <Sidebar
        role={role}
      />

      <main className="flex-1 min-h-screen p-6 md:p-10 pt-24 md:pt-10">

        {/* HERO */}

        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-2xl mb-10">

          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">

            <div>

              <div className="flex items-center gap-4 mb-4">

                <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">

                  <Bell size={34} />

                </div>

                <div>

                  <h1 className="text-4xl font-bold">

                    Notifications Center

                  </h1>

                  <p className="text-blue-100 mt-2">

                    Realtime alerts, project updates, and system activity

                  </p>

                </div>

              </div>

            </div>

            <button
              onClick={
                markAllAsRead
              }
              className="bg-white text-blue-700 hover:bg-blue-50 px-6 py-4 rounded-2xl font-semibold flex items-center gap-3 transition-all shadow-lg"
            >

              <CheckCheck
                size={20}
              />

              Mark All Read

            </button>

          </div>

        </div>

        {/* STATS */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">

          <StatsCard
            title="Total Notifications"
            value={
              notifications.length
            }
            icon={
              <Bell className="text-blue-600" />
            }
            bg="bg-blue-50"
          />

          <StatsCard
            title="Unread"
            value={
              unreadCount
            }
            icon={
              <AlertCircle className="text-red-600" />
            }
            bg="bg-red-50"
          />

          <StatsCard
            title="Read"
            value={
              notifications.length -
              unreadCount
            }
            icon={
              <CheckCircle2 className="text-green-600" />
            }
            bg="bg-green-50"
          />

        </div>

        {/* SEARCH + FILTER */}

        <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100 mb-10">

          <div className="flex flex-col xl:flex-row gap-5 xl:items-center xl:justify-between">

            <div className="relative w-full xl:w-[450px]">

              <Search
                size={20}
                className="absolute left-4 top-4 text-gray-400"
              />

              <input
                type="text"
                placeholder="Search notifications..."
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                className="w-full border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all"
              />

            </div>

            <div className="flex items-center gap-3 flex-wrap">

              <div className="flex items-center gap-2 text-gray-500">

                <Filter
                  size={18}
                />

                <span className="font-medium">

                  Filter

                </span>

              </div>

              {[
                {
                  key: "all",
                  label: "All",
                },
                {
                  key: "unread",
                  label: "Unread",
                },
                {
                  key: "read",
                  label: "Read",
                },
              ].map((item) => (

                <button
                  key={item.key}
                  onClick={() =>
                    setFilter(
                      item.key as any
                    )
                  }
                  className={`px-5 py-3 rounded-2xl font-medium transition-all ${
                    filter ===
                    item.key
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                >

                  {item.label}

                </button>

              ))}

            </div>

          </div>

        </div>

        {/* NOTIFICATIONS */}

        <div className="space-y-6">

          {filteredNotifications.length ===
            0 && (

            <div className="bg-white rounded-3xl shadow-lg p-16 text-center">

              <div className="flex justify-center mb-5">

                <X
                  size={60}
                  className="text-gray-300"
                />

              </div>

              <h2 className="text-2xl font-bold text-gray-700 mb-2">

                No Notifications Found

              </h2>

              <p className="text-gray-500">

                You're all caught up

              </p>

            </div>

          )}

          {filteredNotifications.map(
            (
              notification
            ) => (

              <div
                key={
                  notification.id
                }
                className={`bg-white rounded-3xl shadow-lg border overflow-hidden transition-all hover:shadow-2xl ${
                  notification.is_read
                    ? "border-gray-100"
                    : "border-blue-200 ring-2 ring-blue-100"
                }`}
              >

                <div className="p-7">

                  <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">

                    <div className="flex gap-5 flex-1">

                      <div
                        className={`p-4 rounded-2xl h-fit ${getNotificationColor(
                          notification.title
                        )}`}
                      >

                        {getNotificationIcon(
                          notification.title
                        )}

                      </div>

                      <div className="flex-1">

                        <div className="flex items-center gap-3 flex-wrap mb-3">

                          <h2 className="text-2xl font-bold text-gray-800">

                            {
                              notification.title
                            }

                          </h2>

                          {!notification.is_read && (

                            <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-semibold animate-pulse">

                              NEW

                            </span>

                          )}

                        </div>

                        <p className="text-gray-600 leading-relaxed text-[15px]">

                          {
                            notification.message
                          }

                        </p>

                        <div className="flex items-center gap-2 mt-5 text-sm text-gray-400">

                          <Clock3
                            size={16}
                          />

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
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl transition-all flex items-center gap-2 h-fit"
                      >

                        <CheckCheck
                          size={18}
                        />

                        Mark Read

                      </button>

                    )}

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

function StatsCard({
  title,
  value,
  icon,
  bg,
}: any) {

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-7 hover:-translate-y-1 transition-all">

      <div className="flex items-center justify-between mb-5">

        <div
          className={`p-4 rounded-2xl ${bg}`}
        >

          {icon}

        </div>

        <h2 className="text-4xl font-bold text-gray-800">

          {value}

        </h2>

      </div>

      <p className="text-gray-500 font-medium">

        {title}

      </p>

    </div>
  );
}