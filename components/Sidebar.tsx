"use client";

import Image from "next/image";
import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import { usePathname } from "next/navigation";

import {
  Menu,
  X,
  LayoutDashboard,
  FolderKanban,
  Users,
  FileText,
  Bell,
  Settings,
  ClipboardList,
  FolderOpen,
  BarChart3,
  MessageSquare,
  History,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type SidebarProps = {
  role: "admin" | "technician" | "client";
};

export default function Sidebar({
  role,
}: SidebarProps) {

  const [open, setOpen] =
    useState(false);

  const pathname =
    usePathname();

  const [
    unreadCount,
    setUnreadCount,
  ] = useState(0);

  const [
    unreadCommentsCount,
    setUnreadCommentsCount,
  ] = useState(0);

  useEffect(() => {

    fetchUnreadNotifications();

    fetchUnreadComments();

    const notificationsChannel =
      supabase
        .channel(
          "sidebar-notifications"
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
            fetchUnreadNotifications();
          }
        )
        .subscribe();

    const commentsChannel =
      supabase
        .channel(
          "sidebar-comments"
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table:
              "project_comments",
          },
          () => {
            fetchUnreadComments();
          }
        )
        .subscribe();

    return () => {

      supabase.removeChannel(
        notificationsChannel
      );

      supabase.removeChannel(
        commentsChannel
      );
    };

  }, []);

  async function fetchUnreadNotifications() {

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    let query =
      supabase
        .from("notifications")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("is_read", false);

    if (role !== "admin") {

      query =
        query.eq(
          "user_id",
          user.id
        );
    }

    const {
      count,
      error,
    } = await query;

    if (!error && count) {

      setUnreadCount(count);
    }
    else {

      setUnreadCount(0);
    }
  }

  async function fetchUnreadComments() {

    const {
      count,
      error,
    } = await supabase
      .from("project_comments")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("is_read", false);

    if (!error && count) {

      setUnreadCommentsCount(
        count
      );
    }
    else {

      setUnreadCommentsCount(0);
    }
  }

  function navClass(
    href: string,
    color: string
  ) {

    const active =
      pathname === href;

    return `
      flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all
      ${
        active
          ? `${color} text-white shadow-lg`
          : "hover:bg-gray-100 text-gray-700"
      }
    `;
  }

  function NotificationBadge() {

    if (unreadCount === 0)
      return null;

    return (
      <span className="bg-red-500 text-white text-xs font-bold min-w-[22px] h-[22px] rounded-full flex items-center justify-center px-2">

        {unreadCount}

      </span>
    );
  }

  function CommentsBadge() {

    if (
      unreadCommentsCount === 0
    )
      return null;

    return (
      <span className="bg-orange-500 text-white text-xs font-bold min-w-[22px] h-[22px] rounded-full flex items-center justify-center px-2">

        {unreadCommentsCount}

      </span>
    );
  }

  return (
    <>
      {/* Mobile Top Bar */}

      <div className="md:hidden fixed top-0 left-0 right-0 bg-white shadow z-50 flex items-center justify-between p-4">

        <div className="flex items-center gap-3">

          <Image
            src="/logo.png"
            alt="ADE Logo"
            width={40}
            height={40}
            className="rounded-lg"
          />

          <h2 className="text-lg font-bold text-blue-600">

            ADE PMS

          </h2>

        </div>

        <button
          onClick={() =>
            setOpen(!open)
          }
        >

          {open ? (
            <X size={28} />
          ) : (
            <Menu size={28} />
          )}

        </button>

      </div>

      {/* Overlay */}

      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() =>
            setOpen(false)
          }
        />
      )}

      {/* Sidebar */}

      <aside
        className={`
          fixed md:static top-0 left-0 z-40
          w-64 min-h-screen bg-white shadow-xl p-6
          transform transition-transform duration-300
          overflow-y-auto
          ${
            open
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
          }
        `}
      >

        {/* Logo Section */}

        <div className="flex flex-col items-center mb-10 mt-10 md:mt-0">

          <Image
            src="/logo.png"
            alt="ADE Logo"
            width={120}
            height={120}
            className="rounded-2xl shadow-md"
            priority
          />

          <h2 className="text-2xl font-extrabold text-blue-600 mt-4 text-center">

            ADE PMS

          </h2>

          <p className="text-gray-500 text-sm text-center">

            Project Management System

          </p>

        </div>

        <nav className="space-y-3">

          {/* ADMIN */}

          {role === "admin" && (
            <>

              <Link
                href="/admin"
                className={navClass(
                  "/admin",
                  "bg-blue-600"
                )}
              >
                <div className="flex items-center gap-3">

                  <LayoutDashboard size={20} />
                  Dashboard

                </div>
              </Link>

              <Link
                href="/admin/users"
                className={navClass(
                  "/admin/users",
                  "bg-blue-600"
                )}
              >
                <div className="flex items-center gap-3">

                  <Users size={20} />
                  Users

                </div>
              </Link>

              <Link
                href="/admin/projects"
                className={navClass(
                  "/admin/projects",
                  "bg-blue-600"
                )}
              >
                <div className="flex items-center gap-3">

                  <FolderKanban size={20} />
                  Projects

                </div>
              </Link>

              <Link
                href="/admin/assignments"
                className={navClass(
                  "/admin/assignments",
                  "bg-blue-600"
                )}
              >
                <div className="flex items-center gap-3">

                  <ClipboardList size={20} />
                  Assignments

                </div>
              </Link>

              <Link
                href="/admin/reports"
                className={navClass(
                  "/admin/reports",
                  "bg-blue-600"
                )}
              >
                <div className="flex items-center gap-3">

                  <FileText size={20} />
                  Reports

                </div>
              </Link>

              <Link
                href="/admin/files"
                className={navClass(
                  "/admin/files",
                  "bg-blue-600"
                )}
              >
                <div className="flex items-center gap-3">

                  <FolderOpen size={20} />
                  Files

                </div>
              </Link>

              <Link
                href="/admin/comments"
                className={navClass(
                  "/admin/comments",
                  "bg-blue-600"
                )}
              >
                <div className="flex items-center gap-3">

                  <MessageSquare size={20} />
                  Comments

                </div>

                <CommentsBadge />
              </Link>

              <Link
                href="/admin/notifications"
                className={navClass(
                  "/admin/notifications",
                  "bg-blue-600"
                )}
              >
                <div className="flex items-center gap-3">

                  <Bell size={20} />
                  Notifications

                </div>

                <NotificationBadge />
              </Link>

              <Link
                href="/admin/analytics"
                className={navClass(
                  "/admin/analytics",
                  "bg-blue-600"
                )}
              >
                <div className="flex items-center gap-3">

                  <BarChart3 size={20} />
                  Analytics

                </div>
              </Link>

              <Link
                href="/admin/activity"
                className={navClass(
                  "/admin/activity",
                  "bg-blue-600"
                )}
              >
                <div className="flex items-center gap-3">

                  <History size={20} />
                  Activity Logs

                </div>
              </Link>

              <Link
                href="/settings"
                className={navClass(
                  "/settings",
                  "bg-blue-600"
                )}
              >
                <div className="flex items-center gap-3">

                  <Settings size={20} />
                  Settings

                </div>
              </Link>

            </>
          )}

          {/* TECHNICIAN */}

          {role === "technician" && (
            <>

              <Link
                href="/technician"
                className={navClass(
                  "/technician",
                  "bg-green-600"
                )}
              >
                <div className="flex items-center gap-3">

                  <LayoutDashboard size={20} />
                  Dashboard

                </div>
              </Link>

              <Link
                href="/technician/reports"
                className={navClass(
                  "/technician/reports",
                  "bg-green-600"
                )}
              >
                <div className="flex items-center gap-3">

                  <FileText size={20} />
                  Submit Reports

                </div>
              </Link>

              <Link
                href="/technician/files"
                className={navClass(
                  "/technician/files",
                  "bg-green-600"
                )}
              >
                <div className="flex items-center gap-3">

                  <FolderOpen size={20} />
                  Files

                </div>
              </Link>

              <Link
                href="/technician/comments"
                className={navClass(
                  "/technician/comments",
                  "bg-green-600"
                )}
              >
                <div className="flex items-center gap-3">

                  <MessageSquare size={20} />
                  Comments

                </div>

                <CommentsBadge />
              </Link>

              <Link
                href="/technician/notifications"
                className={navClass(
                  "/technician/notifications",
                  "bg-green-600"
                )}
              >
                <div className="flex items-center gap-3">

                  <Bell size={20} />
                  Notifications

                </div>

                <NotificationBadge />
              </Link>

              <Link
                href="/settings"
                className={navClass(
                  "/settings",
                  "bg-green-600"
                )}
              >
                <div className="flex items-center gap-3">

                  <Settings size={20} />
                  Settings

                </div>
              </Link>

            </>
          )}

          {/* CLIENT */}

          {role === "client" && (
            <>

              <Link
                href="/client"
                className={navClass(
                  "/client",
                  "bg-purple-600"
                )}
              >
                <div className="flex items-center gap-3">

                  <LayoutDashboard size={20} />
                  Dashboard

                </div>
              </Link>

              <Link
                href="/client/reports"
                className={navClass(
                  "/client/reports",
                  "bg-purple-600"
                )}
              >
                <div className="flex items-center gap-3">

                  <FileText size={20} />
                  Progress Reports

                </div>
              </Link>

              <Link
                href="/client/files"
                className={navClass(
                  "/client/files",
                  "bg-purple-600"
                )}
              >
                <div className="flex items-center gap-3">

                  <FolderOpen size={20} />
                  Files

                </div>
              </Link>

              <Link
                href="/client/comments"
                className={navClass(
                  "/client/comments",
                  "bg-purple-600"
                )}
              >
                <div className="flex items-center gap-3">

                  <MessageSquare size={20} />
                  Comments

                </div>

                <CommentsBadge />
              </Link>

              <Link
                href="/client/notifications"
                className={navClass(
                  "/client/notifications",
                  "bg-purple-600"
                )}
              >
                <div className="flex items-center gap-3">

                  <Bell size={20} />
                  Notifications

                </div>

                <NotificationBadge />
              </Link>

              <Link
                href="/settings"
                className={navClass(
                  "/settings",
                  "bg-purple-600"
                )}
              >
                <div className="flex items-center gap-3">

                  <Settings size={20} />
                  Settings

                </div>
              </Link>

            </>
          )}

        </nav>

      </aside>
    </>
  );
}