"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  FolderKanban,
  FileText,
  Clock3,
  CheckCircle2,
  AlertCircle,
  Activity,
  TrendingUp,
  CalendarDays,
  Sparkles,
} from "lucide-react";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

import { supabase } from "@/lib/supabase";

import LogoutButton from "@/components/LogoutButton";

import Sidebar from "@/components/Sidebar";

type ProjectType = {
  id: number;
  title: string;
  description: string;
  contract_details: string;
  status: string;
  progress: number;
  created_at: string;
};

const COLORS = [
  "#9333ea",
  "#eab308",
  "#16a34a",
  "#dc2626",
];

export default function ClientPage() {

  const [projects, setProjects] =
    useState<ProjectType[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [stats, setStats] =
    useState({
      total: 0,
      completed: 0,
      inProgress: 0,
      pending: 0,
      onHold: 0,
    });

  const [
    chartData,
    setChartData,
  ] = useState<any[]>([]);

  useEffect(() => {

    fetchClientProjects();

    const channel =
      supabase
        .channel(
          "client-projects"
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "projects",
          },
          () => {
            fetchClientProjects();
          }
        )
        .subscribe();

    return () => {

      supabase.removeChannel(
        channel
      );
    };

  }, []);

  async function fetchClientProjects() {

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
      data,
      error,
    } = await supabase
      .from("projects")
      .select("*")
      .eq("client_id", user.id)
      .order("created_at", {
        ascending: false,
      });

    if (error) {

      console.error(error);

      setLoading(false);

      return;
    }

    const projectsData =
      (data ||
        []) as ProjectType[];

    setProjects(projectsData);

    const completed =
      projectsData.filter(
        (p) =>
          p.status ===
          "Completed"
      ).length;

    const inProgress =
      projectsData.filter(
        (p) =>
          p.status ===
          "In Progress"
      ).length;

    const pending =
      projectsData.filter(
        (p) =>
          p.status ===
          "Pending"
      ).length;

    const onHold =
      projectsData.filter(
        (p) =>
          p.status ===
          "On Hold"
      ).length;

    setStats({
      total:
        projectsData.length,
      completed,
      inProgress,
      pending,
      onHold,
    });

    setChartData([
      {
        name: "Completed",
        value: completed,
      },
      {
        name: "In Progress",
        value: inProgress,
      },
      {
        name: "Pending",
        value: pending,
      },
      {
        name: "On Hold",
        value: onHold,
      },
    ]);

    setLoading(false);
  }

  function getStatusStyle(
    status: string
  ) {

    switch (status) {

      case "Completed":

        return "bg-green-100 text-green-700 border border-green-200";

      case "In Progress":

        return "bg-yellow-100 text-yellow-700 border border-yellow-200";

      case "On Hold":

        return "bg-red-100 text-red-700 border border-red-200";

      default:

        return "bg-blue-100 text-blue-700 border border-blue-200";
    }
  }

  function getProgressColor(
    progress: number
  ) {

    if (progress >= 100) {

      return "bg-green-600";
    }

    if (progress >= 60) {

      return "bg-purple-600";
    }

    if (progress >= 30) {

      return "bg-yellow-500";
    }

    return "bg-red-500";
  }

  if (loading) {

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">

        <div className="bg-white px-8 py-6 rounded-2xl shadow text-lg font-semibold text-purple-600">

          Loading dashboard...

        </div>

      </div>
    );
  }

  return (
    <div className="flex bg-gray-100">

      <Sidebar role="client" />

      <main className="flex-1 min-h-screen p-6 md:p-10 pt-24 md:pt-10">

        {/* HEADER */}

        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 mb-10">

          <div>

            <div className="flex items-center gap-3 mb-3">

              <Sparkles className="text-purple-600" />

              <span className="bg-purple-100 text-purple-700 px-4 py-1 rounded-full text-sm font-medium">

                Client Portal

              </span>

            </div>

            <h1 className="text-5xl font-bold text-purple-600">

              Client Dashboard

            </h1>

            <p className="text-gray-600 mt-3 text-lg">

              Monitor all project activities in realtime

            </p>

          </div>

          <div className="flex items-center gap-4">

            <div className="bg-white px-5 py-3 rounded-2xl shadow text-sm text-gray-600 flex items-center gap-2">

              <CalendarDays size={18} />

              {new Date().toLocaleDateString(
                "en-US",
                {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }
              )}

            </div>

            <LogoutButton />

          </div>

        </div>

        {/* STATS */}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">

          <StatsCard
            title="Total Projects"
            value={stats.total}
            icon={
              <FolderKanban className="text-purple-600" />
            }
          />

          <StatsCard
            title="In Progress"
            value={stats.inProgress}
            icon={
              <TrendingUp className="text-yellow-500" />
            }
          />

          <StatsCard
            title="Completed"
            value={stats.completed}
            icon={
              <CheckCircle2 className="text-green-600" />
            }
          />

          <StatsCard
            title="Pending"
            value={stats.pending}
            icon={
              <Clock3 className="text-blue-600" />
            }
          />

        </div>

        {/* ANALYTICS */}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-10">

          <div className="xl:col-span-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-8 text-white shadow-xl">

            <div className="flex items-center gap-3 mb-6">

              <Activity />

              <h2 className="text-2xl font-bold">

                Project Overview

              </h2>

            </div>

            <p className="text-purple-100 leading-relaxed text-lg mb-8">

              Your projects are continuously monitored with realtime progress tracking and live updates from technicians and administrators.

            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">

              <div className="bg-white/10 backdrop-blur rounded-2xl p-5">

                <h3 className="text-3xl font-bold">

                  {stats.total}

                </h3>

                <p className="text-purple-100 mt-2">

                  Projects

                </p>

              </div>

              <div className="bg-white/10 backdrop-blur rounded-2xl p-5">

                <h3 className="text-3xl font-bold">

                  {stats.completed}

                </h3>

                <p className="text-purple-100 mt-2">

                  Completed

                </p>

              </div>

              <div className="bg-white/10 backdrop-blur rounded-2xl p-5">

                <h3 className="text-3xl font-bold">

                  {stats.inProgress}

                </h3>

                <p className="text-purple-100 mt-2">

                  Active

                </p>

              </div>

              <div className="bg-white/10 backdrop-blur rounded-2xl p-5">

                <h3 className="text-3xl font-bold">

                  {stats.pending}

                </h3>

                <p className="text-purple-100 mt-2">

                  Pending

                </p>

              </div>

            </div>

          </div>

          {/* CHART */}

          <div className="bg-white rounded-3xl shadow p-6">

            <h2 className="text-2xl font-bold text-purple-600 mb-6">

              Status Analytics

            </h2>

            <div className="h-[320px]">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <PieChart>

                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={110}
                    label
                  >

                    {chartData.map(
                      (
                        entry,
                        index
                      ) => (

                        <Cell
                          key={index}
                          fill={
                            COLORS[
                              index %
                                COLORS.length
                            ]
                          }
                        />

                      )
                    )}

                  </Pie>

                  <Tooltip />

                </PieChart>

              </ResponsiveContainer>

            </div>

          </div>

        </div>

        {/* PROJECTS */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {projects.length ===
            0 && (

            <div className="bg-white p-12 rounded-3xl shadow text-center text-gray-500 lg:col-span-2">

              <FolderKanban
                className="mx-auto mb-4 text-gray-400"
                size={50}
              />

              <h2 className="text-2xl font-bold mb-2">

                No Projects Yet

              </h2>

              <p>

                Your assigned projects will appear here.

              </p>

            </div>

          )}

          {projects.map(
            (
              project
            ) => (

              <div
                key={project.id}
                className="bg-white rounded-3xl shadow hover:shadow-2xl transition-all duration-300 p-7 border border-gray-100"
              >

                {/* TOP */}

                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 mb-6">

                  <div>

                    <div className="flex items-center gap-3 mb-3">

                      <div className="bg-purple-100 p-3 rounded-2xl">

                        <FolderKanban
                          className="text-purple-600"
                          size={22}
                        />

                      </div>

                      <h2 className="text-2xl font-bold text-gray-800">

                        {project.title}

                      </h2>

                    </div>

                    <p className="text-gray-600 leading-relaxed">

                      {
                        project.description
                      }

                    </p>

                  </div>

                  <span
                    className={`px-4 py-2 rounded-full text-sm font-semibold w-fit ${getStatusStyle(
                      project.status
                    )}`}
                  >

                    {project.status}

                  </span>

                </div>

                {/* PROGRESS */}

                <div className="mb-7">

                  <div className="flex justify-between mb-3">

                    <span className="font-semibold text-gray-700">

                      Progress

                    </span>

                    <span className="font-bold text-gray-700">

                      {
                        project.progress ||
                        0
                      }%

                    </span>

                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">

                    <div
                      className={`h-4 rounded-full transition-all duration-700 ${getProgressColor(
                        project.progress ||
                          0
                      )}`}
                      style={{
                        width: `${
                          project.progress ||
                          0
                        }%`,
                      }}
                    />

                  </div>

                </div>

                {/* CONTRACT */}

                <div className="border-t pt-6 mb-6">

                  <div className="flex items-center gap-2 mb-4">

                    <FileText
                      className="text-purple-600"
                      size={20}
                    />

                    <h3 className="font-bold text-gray-800">

                      Contract Details

                    </h3>

                  </div>

                  <p className="text-gray-600 whitespace-pre-wrap text-sm leading-relaxed bg-gray-50 p-4 rounded-2xl">

                    {
                      project.contract_details
                    }

                  </p>

                </div>

                {/* FOOTER */}

                <div className="border-t pt-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                  <div className="flex items-center gap-2 text-sm text-gray-500">

                    <AlertCircle
                      size={16}
                    />

                    Created on{" "}

                    {new Date(
                      project.created_at
                    ).toLocaleDateString()}

                  </div>

                  <div className="bg-purple-100 text-purple-700 px-4 py-2 rounded-xl text-sm font-medium">

                    Live tracking enabled

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
}: any) {

  return (
    <div className="bg-white rounded-3xl shadow hover:shadow-xl transition-all p-6 border border-gray-100">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-gray-500 mb-2 font-medium">

            {title}

          </p>

          <h2 className="text-4xl font-bold text-gray-800">

            {value}

          </h2>

        </div>

        <div className="bg-gray-100 p-4 rounded-2xl text-3xl">

          {icon}

        </div>

      </div>

    </div>
  );
}