"use client";

import {
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import {
  FolderKanban,
  Users,
  Wrench,
  ClipboardCheck,
  FileText,
  Activity,
} from "lucide-react";

import Sidebar from "@/components/Sidebar";

import LogoutButton from "@/components/LogoutButton";

import { supabase } from "@/lib/supabase";

import { checkRole } from "@/lib/checkRole";

const COLORS = [
  "#2563eb",
  "#16a34a",
  "#ca8a04",
  "#dc2626",
];

export default function AdminDashboard() {

  const router =
    useRouter();

  const [loading, setLoading] =
    useState(true);

  const [stats, setStats] =
    useState({
      projects: 0,
      technicians: 0,
      clients: 0,
      reports: 0,
      completed: 0,
    });

  const [
    monthlyProjects,
    setMonthlyProjects,
  ] = useState<any[]>([]);

  const [
    statusData,
    setStatusData,
  ] = useState<any[]>([]);

  const [
    recentProjects,
    setRecentProjects,
  ] = useState<any[]>([]);

  useEffect(() => {

    async function protectPage() {

      const allowed =
        await checkRole("admin");

      if (!allowed) {

        router.push("/login");

        return;
      }

      fetchDashboardData();
    }

    protectPage();

    const projectsChannel =
      supabase
        .channel(
          "admin-projects"
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "projects",
          },
          () => {
            fetchDashboardData();
          }
        )
        .subscribe();

    const reportsChannel =
      supabase
        .channel(
          "admin-reports"
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "reports",
          },
          () => {
            fetchDashboardData();
          }
        )
        .subscribe();

    return () => {

      supabase.removeChannel(
        projectsChannel
      );

      supabase.removeChannel(
        reportsChannel
      );
    };

  }, []);

  async function fetchDashboardData() {

    setLoading(true);

    const {
      data: projectsData,
    } = await supabase
      .from("projects")
      .select("*")
      .order(
        "created_at",
        { ascending: false }
      );

    const {
      data: profilesData,
    } = await supabase
      .from("profiles")
      .select("*");

    const {
      data: reportsData,
    } = await supabase
      .from("reports")
      .select("*");

    const allProjects =
      projectsData || [];

    const allProfiles =
      profilesData || [];

    const completedProjects =
      allProjects.filter(
        (p) =>
          p.status ===
          "Completed"
      ).length;

    setStats({
      projects:
        allProjects.length,

      technicians:
        allProfiles.filter(
          (p) =>
            p.role ===
            "technician"
        ).length,

      clients:
        allProfiles.filter(
          (p) =>
            p.role ===
            "client"
        ).length,

      reports:
        reportsData?.length || 0,

      completed:
        completedProjects,
    });

    setRecentProjects(
      allProjects.slice(0, 5)
    );

    const groupedMonths: any =
      {};

    allProjects.forEach(
      (project) => {

        const month =
          new Date(
            project.created_at
          ).toLocaleString(
            "default",
            {
              month: "short",
            }
          );

        if (
          !groupedMonths[
            month
          ]
        ) {

          groupedMonths[
            month
          ] = 0;
        }

        groupedMonths[
          month
        ] += 1;
      }
    );

    setMonthlyProjects(

      Object.keys(
        groupedMonths
      ).map((month) => ({
        month,
        projects:
          groupedMonths[
            month
          ],
      }))
    );

    const statuses = [
      "Pending",
      "In Progress",
      "Completed",
      "On Hold",
    ];

    setStatusData(

      statuses.map(
        (status) => ({
          name: status,
          value:
            allProjects.filter(
              (p) =>
                p.status ===
                status
            ).length,
        })
      )
    );

    setLoading(false);
  }

  if (loading) {

    return (
      <div className="flex">

        <Sidebar role="admin" />

        <main className="flex-1 min-h-screen bg-gray-100 flex items-center justify-center">

          <div className="bg-white px-8 py-6 rounded-2xl shadow-lg">

            <p className="text-lg font-semibold text-blue-600 animate-pulse">

              Loading dashboard...

            </p>

          </div>

        </main>

      </div>
    );
  }

  return (
    <div className="flex">

      <Sidebar role="admin" />

      <main className="flex-1 min-h-screen bg-gray-100 p-6 md:p-10 pt-24 md:pt-10">

        {/* HEADER */}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-10">

          <div>

            <h1 className="text-4xl md:text-5xl font-extrabold text-blue-600 tracking-tight">

              Admin Dashboard

            </h1>

            <p className="text-gray-600 mt-3 text-lg">

              Welcome back to ADE Project Management System

            </p>

          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">

            <div className="bg-white px-5 py-3 rounded-2xl shadow text-sm text-gray-600 border">

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

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-6 mb-10">

          <DashboardCard
            title="Projects"
            value={stats.projects}
            icon={
              <FolderKanban
                className="text-blue-600"
              />
            }
            bg="bg-blue-50"
          />

          <DashboardCard
            title="Completed"
            value={stats.completed}
            icon={
              <ClipboardCheck
                className="text-green-600"
              />
            }
            bg="bg-green-50"
          />

          <DashboardCard
            title="Technicians"
            value={
              stats.technicians
            }
            icon={
              <Wrench
                className="text-yellow-500"
              />
            }
            bg="bg-yellow-50"
          />

          <DashboardCard
            title="Clients"
            value={stats.clients}
            icon={
              <Users
                className="text-purple-600"
              />
            }
            bg="bg-purple-50"
          />

          <DashboardCard
            title="Reports"
            value={stats.reports}
            icon={
              <FileText
                className="text-orange-600"
              />
            }
            bg="bg-orange-50"
          />

        </div>

        {/* CHARTS */}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-10">

          {/* MONTHLY PROJECTS */}

          <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100">

            <div className="flex items-center justify-between mb-6">

              <div>

                <h2 className="text-2xl font-bold text-blue-600">

                  Monthly Projects

                </h2>

                <p className="text-gray-500 text-sm mt-1">

                  Projects created over time

                </p>

              </div>

            </div>

            <div className="h-[350px]">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <BarChart
                  data={
                    monthlyProjects
                  }
                >

                  <XAxis
                    dataKey="month"
                  />

                  <YAxis />

                  <Tooltip />

                  <Bar
                    dataKey="projects"
                    fill="#2563eb"
                    radius={[
                      10,
                      10,
                      0,
                      0,
                    ]}
                  />

                </BarChart>

              </ResponsiveContainer>

            </div>

          </div>

          {/* STATUS */}

          <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100">

            <div className="mb-6">

              <h2 className="text-2xl font-bold text-blue-600">

                Project Status

              </h2>

              <p className="text-gray-500 text-sm mt-1">

                Current project distribution

              </p>

            </div>

            <div className="h-[350px]">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <PieChart>

                  <Pie
                    data={
                      statusData
                    }
                    dataKey="value"
                    nameKey="name"
                    outerRadius={
                      120
                    }
                    label
                  >

                    {statusData.map(
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

        {/* RECENT PROJECTS */}

        <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">

          <div className="flex items-center gap-3 mb-6">

            <div className="bg-blue-100 p-3 rounded-xl">

              <Activity className="text-blue-600" />

            </div>

            <div>

              <h2 className="text-2xl font-bold text-blue-600">

                Recent Projects

              </h2>

              <p className="text-gray-500 text-sm">

                Latest project activity

              </p>

            </div>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead>

                <tr className="border-b text-left text-gray-600">

                  <th className="pb-4 font-semibold">
                    Project
                  </th>

                  <th className="pb-4 font-semibold">
                    Status
                  </th>

                  <th className="pb-4 font-semibold">
                    Created
                  </th>

                </tr>

              </thead>

              <tbody>

                {recentProjects.map(
                  (project) => (

                    <tr
                      key={project.id}
                      className="border-b hover:bg-gray-50 transition-all"
                    >

                      <td className="py-5 font-semibold text-gray-800">

                        {project.title}

                      </td>

                      <td className="py-5">

                        <span
                          className={`
                            px-4 py-2 rounded-full text-sm font-semibold
                            ${
                              project.status === "Completed"
                                ? "bg-green-100 text-green-700"
                                : project.status === "In Progress"
                                ? "bg-blue-100 text-blue-700"
                                : project.status === "Pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }
                          `}
                        >

                          {project.status}

                        </span>

                      </td>

                      <td className="py-5 text-gray-500">

                        {new Date(
                          project.created_at
                        ).toLocaleDateString()}

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

      </main>

    </div>
  );
}

function DashboardCard({
  title,
  value,
  icon,
  bg,
}: any) {

  return (
    <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">

      <div className="flex items-center justify-between mb-5">

        <div className={`${bg} p-4 rounded-2xl`}>

          <div className="text-3xl">
            {icon}
          </div>

        </div>

        <h2 className="text-4xl font-extrabold text-gray-800">

          {value}

        </h2>

      </div>

      <p className="text-gray-600 font-semibold text-lg">

        {title}

      </p>

    </div>
  );
}