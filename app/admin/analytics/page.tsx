"use client";

import {
  useEffect,
  useState,
} from "react";

import Sidebar from "@/components/Sidebar";

import { supabase } from "@/lib/supabase";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function AnalyticsPage() {

  const [
    projectStats,
    setProjectStats,
  ] = useState<any[]>([]);

  const [
    statusStats,
    setStatusStats,
  ] = useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    fetchAnalytics();

    const channel =
      supabase
        .channel(
          "analytics-realtime"
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "projects",
          },
          () => {
            fetchAnalytics();
          }
        )
        .subscribe();

    return () => {
      supabase.removeChannel(
        channel
      );
    };

  }, []);

  async function fetchAnalytics() {

    const { data, error } =
      await supabase
        .from("projects")
        .select("*");

    if (!error && data) {

      const monthlyMap:
        any = {};

      const statusMap:
        any = {};

      data.forEach(
        (project: any) => {

          const month =
            new Date(
              project.created_at
            ).toLocaleString(
              "default",
              {
                month: "short",
              }
            );

          monthlyMap[month] =
            (monthlyMap[
              month
            ] || 0) + 1;

          statusMap[
            project.status
          ] =
            (statusMap[
              project.status
            ] || 0) + 1;
        }
      );

      const monthlyData =
        Object.keys(
          monthlyMap
        ).map((key) => ({
          month: key,
          projects:
            monthlyMap[key],
        }));

      const statusData =
        Object.keys(
          statusMap
        ).map((key) => ({
          name: key,
          value:
            statusMap[key],
        }));

      setProjectStats(
        monthlyData
      );

      setStatusStats(
        statusData
      );
    }

    setLoading(false);
  }

  const COLORS = [
    "#2563eb",
    "#16a34a",
    "#9333ea",
    "#ea580c",
  ];

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

        <div className="mb-8">

          <h1 className="text-4xl font-bold text-blue-600">
            Analytics Dashboard
          </h1>

          <p className="text-gray-600 mt-2">
            Monitor system performance in realtime
          </p>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* BAR CHART */}

          <div className="bg-white p-6 rounded-xl shadow">

            <h2 className="text-2xl font-bold mb-6">

              Projects Per Month

            </h2>

            <div className="h-[350px]">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <BarChart
                  data={
                    projectStats
                  }
                >

                  <XAxis dataKey="month" />

                  <YAxis />

                  <Tooltip />

                  <Bar
                    dataKey="projects"
                    fill="#2563eb"
                    radius={[8, 8, 0, 0]}
                  />

                </BarChart>

              </ResponsiveContainer>

            </div>

          </div>

          {/* PIE CHART */}

          <div className="bg-white p-6 rounded-xl shadow">

            <h2 className="text-2xl font-bold mb-6">

              Project Status Distribution

            </h2>

            <div className="h-[350px]">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <PieChart>

                  <Pie
                    data={
                      statusStats
                    }
                    dataKey="value"
                    nameKey="name"
                    outerRadius={120}
                    label
                  >

                    {statusStats.map(
                      (
                        entry,
                        index
                      ) => (

                        <Cell
                          key={`cell-${index}`}
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

      </main>

    </div>
  );
}