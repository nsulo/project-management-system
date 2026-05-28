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
      <div className="p-10">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex">

      <Sidebar role="admin" />

      <main className="flex-1 min-h-screen bg-gray-100 p-6 md:p-10 pt-24 md:pt-10">

        {/* HEADER */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

          <div>

            <h1 className="text-4xl font-bold text-blue-600">

              Admin Dashboard

            </h1>

            <p className="text-gray-600 mt-2">

              Welcome back to ADE Project Management System

            </p>

          </div>

          <div className="flex items-center gap-4">

            <div className="bg-white px-5 py-3 rounded-xl shadow text-sm text-gray-600">

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

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 mb-10">

          <DashboardCard
            title="Projects"
            value={stats.projects}
            icon={
              <FolderKanban
                className="text-blue-600"
              />
            }
          />

          <DashboardCard
            title="Completed"
            value={stats.completed}
            icon={
              <ClipboardCheck
                className="text-green-600"
              />
            }
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
          />

          <DashboardCard
            title="Clients"
            value={stats.clients}
            icon={
              <Users
                className="text-purple-600"
              />
            }
          />

          <DashboardCard
            title="Reports"
            value={stats.reports}
            icon={
              <FileText
                className="text-orange-600"
              />
            }
          />

        </div>

        {/* CHARTS */}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-10">

          <div className="bg-white p-6 rounded-2xl shadow">

            <h2 className="text-2xl font-bold text-blue-600 mb-6">

              Monthly Projects

            </h2>

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
                      8,
                      8,
                      0,
                      0,
                    ]}
                  />

                </BarChart>

              </ResponsiveContainer>

            </div>

          </div>

          <div className="bg-white p-6 rounded-2xl shadow">

            <h2 className="text-2xl font-bold text-blue-600 mb-6">

              Project Status

            </h2>

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

        <div className="bg-white rounded-2xl shadow p-6">

          <div className="flex items-center gap-3 mb-6">

            <Activity className="text-blue-600" />

            <h2 className="text-2xl font-bold text-blue-600">

              Recent Projects

            </h2>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead>

                <tr className="border-b text-left">

                  <th className="pb-3">
                    Project
                  </th>

                  <th className="pb-3">
                    Status
                  </th>

                  <th className="pb-3">
                    Created
                  </th>

                </tr>

              </thead>

              <tbody>

                {recentProjects.map(
                  (project) => (

                    <tr
                      key={project.id}
                      className="border-b hover:bg-gray-50 transition"
                    >

                      <td className="py-4 font-medium">

                        {project.title}

                      </td>

                      <td className="py-4">

                        <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700">

                          {project.status}

                        </span>

                      </td>

                      <td className="py-4 text-gray-500">

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
}: any) {

  return (
    <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition-all">

      <div className="flex items-center justify-between mb-4">

        <div className="text-3xl">
          {icon}
        </div>

        <h2 className="text-4xl font-bold text-gray-800">

          {value}

        </h2>

      </div>

      <p className="text-gray-600 font-medium">

        {title}

      </p>

    </div>
  );
}