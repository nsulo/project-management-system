"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Sidebar from "@/components/Sidebar";

import { supabase } from "@/lib/supabase";

import {
  FileText,
  Download,
  Search,
  Image as ImageIcon,
  Activity,
  CheckCircle2,
  Clock3,
  AlertCircle,
  X,
  Eye,
  CalendarDays,
  User2,
  FolderKanban,
  TrendingUp,
} from "lucide-react";

type ReportType = {
  id: number;
  report_text: string;
  image_url: string | null;
  created_at: string;

  projects: {
    title: string;
    status: string;
    progress?: number;
  } | null;

  profiles: {
    full_name: string;
  } | null;
};

export default function AdminReportsPage() {

  const [reports, setReports] =
    useState<ReportType[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [
    selectedStatus,
    setSelectedStatus,
  ] = useState("All");

  const [
    previewImage,
    setPreviewImage,
  ] = useState<string | null>(
    null
  );

  useEffect(() => {

    fetchReports();

    const channel =
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
            fetchReports();
          }
        )
        .subscribe();

    return () => {

      supabase.removeChannel(
        channel
      );
    };

  }, []);

  async function fetchReports() {

    setLoading(true);

    const { data, error } =
      await supabase
        .from("reports")
        .select(`
          *,
          projects (
            title,
            status,
            progress
          ),
          profiles (
            full_name
          )
        `)
        .order("created_at", {
          ascending: false,
        });

    if (error) {

      console.error(error);

      setLoading(false);

      return;
    }

    setReports(
      (data ||
        []) as ReportType[]
    );

    setLoading(false);
  }

  function exportCSV() {

    const headers = [
      "Project",
      "Technician",
      "Status",
      "Report",
      "Submitted",
    ];

    const rows =
      filteredReports.map(
        (report) => [

          report.projects
            ?.title || "",

          report.profiles
            ?.full_name || "",

          report.projects
            ?.status || "",

          report.report_text
            .replace(/\n/g, " ")
            .replace(/,/g, " "),

          new Date(
            report.created_at
          ).toLocaleString(),
        ]
      );

    const csv =
      [
        headers.join(","),

        ...rows.map((row) =>
          row.join(",")
        ),
      ].join("\n");

    const blob =
      new Blob(
        [csv],
        {
          type:
            "text/csv;charset=utf-8;",
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href = url;

    link.download =
      "technician-reports.csv";

    link.click();
  }

  const filteredReports =
    useMemo(() => {

      return reports.filter(
        (report) => {

          const project =
            report.projects?.title?.toLowerCase() ||
            "";

          const technician =
            report.profiles?.full_name?.toLowerCase() ||
            "";

          const text =
            report.report_text?.toLowerCase() ||
            "";

          const value =
            search.toLowerCase();

          const matchesSearch =
            project.includes(
              value
            ) ||
            technician.includes(
              value
            ) ||
            text.includes(
              value
            );

          const matchesStatus =
            selectedStatus ===
            "All"
              ? true
              : report.projects
                  ?.status ===
                selectedStatus;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );

    }, [
      reports,
      search,
      selectedStatus,
    ]);

  const totalReports =
    reports.length;

  const completedReports =
    reports.filter(
      (r) =>
        r.projects?.status ===
        "Completed"
    ).length;

  const inProgressReports =
    reports.filter(
      (r) =>
        r.projects?.status ===
        "In Progress"
    ).length;

  const pendingReports =
    reports.filter(
      (r) =>
        r.projects?.status ===
        "Pending"
    ).length;

  function getStatusStyle(
    status?: string
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
    progress = 0
  ) {

    if (progress >= 100) {

      return "bg-green-600";
    }

    if (progress >= 70) {

      return "bg-blue-600";
    }

    if (progress >= 40) {

      return "bg-yellow-500";
    }

    return "bg-red-500";
  }

  if (loading) {

    return (
      <div className="flex">

        <Sidebar role="admin" />

        <main className="flex-1 min-h-screen bg-gray-100 p-10">

          <div className="animate-pulse space-y-6">

            <div className="h-16 bg-gray-200 rounded-2xl" />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

              {[...Array(4)].map(
                (_, i) => (

                  <div
                    key={i}
                    className="h-36 bg-gray-200 rounded-2xl"
                  />

                )
              )}

            </div>

            {[...Array(3)].map(
              (_, i) => (

                <div
                  key={i}
                  className="h-72 bg-gray-200 rounded-2xl"
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

      <Sidebar role="admin" />

      <main className="flex-1 min-h-screen p-6 md:p-10 pt-24 md:pt-10">

        {/* HEADER */}

        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl mb-10">

          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">

            <div>

              <div className="flex items-center gap-4 mb-4">

                <div className="bg-white/20 p-4 rounded-2xl">

                  <FileText size={34} />

                </div>

                <div>

                  <h1 className="text-4xl font-bold">

                    Technician Reports

                  </h1>

                  <p className="text-blue-100 mt-2">

                    Realtime monitoring of technician field activity and project progress

                  </p>

                </div>

              </div>

            </div>

            <button
              onClick={
                exportCSV
              }
              className="bg-white text-blue-700 hover:bg-blue-50 px-6 py-4 rounded-2xl font-semibold flex items-center gap-3 transition-all shadow-lg"
            >

              <Download size={20} />

              Export Reports

            </button>

          </div>

        </div>

        {/* ANALYTICS */}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">

          <StatCard
            title="Total Reports"
            value={
              totalReports
            }
            icon={
              <FileText className="text-blue-600" />
            }
            color="blue"
          />

          <StatCard
            title="Completed"
            value={
              completedReports
            }
            icon={
              <CheckCircle2 className="text-green-600" />
            }
            color="green"
          />

          <StatCard
            title="In Progress"
            value={
              inProgressReports
            }
            icon={
              <Activity className="text-yellow-600" />
            }
            color="yellow"
          />

          <StatCard
            title="Pending"
            value={
              pendingReports
            }
            icon={
              <Clock3 className="text-red-600" />
            }
            color="red"
          />

        </div>

        {/* SEARCH + FILTERS */}

        <div className="bg-white rounded-3xl shadow-lg p-6 mb-10 border border-gray-100">

          <div className="flex flex-col xl:flex-row gap-5 xl:items-center xl:justify-between">

            <div className="relative w-full xl:w-[450px]">

              <Search
                size={20}
                className="absolute left-4 top-4 text-gray-400"
              />

              <input
                type="text"
                placeholder="Search reports, projects, technicians..."
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                className="w-full border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all"
              />

            </div>

            <div className="flex flex-wrap gap-3">

              {[
                "All",
                "Pending",
                "In Progress",
                "Completed",
                "On Hold",
              ].map((status) => (

                <button
                  key={status}
                  onClick={() =>
                    setSelectedStatus(
                      status
                    )
                  }
                  className={`px-5 py-3 rounded-2xl font-medium transition-all ${
                    selectedStatus ===
                    status
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                >

                  {status}

                </button>

              ))}

            </div>

          </div>

        </div>

        {/* REPORTS */}

        <div className="space-y-8">

          {filteredReports.length ===
            0 && (

            <div className="bg-white rounded-3xl shadow-lg p-16 text-center">

              <div className="flex justify-center mb-5">

                <AlertCircle
                  size={60}
                  className="text-gray-300"
                />

              </div>

              <h2 className="text-2xl font-bold text-gray-700 mb-2">

                No Reports Found

              </h2>

              <p className="text-gray-500">

                Try adjusting your search or filters

              </p>

            </div>

          )}

          {filteredReports.map(
            (report) => (

              <div
                key={report.id}
                className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300"
              >

                {/* TOP */}

                <div className="p-8 border-b border-gray-100">

                  <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">

                    <div className="flex-1">

                      <div className="flex items-center gap-3 mb-4">

                        <div className="bg-blue-100 p-3 rounded-2xl">

                          <FolderKanban
                            className="text-blue-600"
                            size={22}
                          />

                        </div>

                        <div>

                          <h2 className="text-3xl font-bold text-gray-800">

                            {
                              report.projects
                                ?.title
                            }

                          </h2>

                          <div className="flex items-center gap-2 mt-2 text-gray-500">

                            <User2 size={16} />

                            <span>

                              {
                                report.profiles
                                  ?.full_name
                              }

                            </span>

                          </div>

                        </div>

                      </div>

                      {/* PROGRESS */}

                      <div className="mt-6">

                        <div className="flex items-center justify-between mb-2">

                          <p className="text-sm font-semibold text-gray-700">

                            Project Progress

                          </p>

                          <p className="text-sm font-bold text-gray-700">

                            {
                              report.projects
                                ?.progress || 0
                            }%

                          </p>

                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">

                          <div
                            className={`h-4 rounded-full transition-all duration-700 ${getProgressColor(
                              report.projects
                                ?.progress || 0
                            )}`}
                            style={{
                              width: `${
                                report.projects
                                  ?.progress || 0
                              }%`,
                            }}
                          />

                        </div>

                      </div>

                    </div>

                    <div className="flex flex-col items-start xl:items-end gap-4">

                      <span
                        className={`px-5 py-3 rounded-2xl text-sm font-semibold ${getStatusStyle(
                          report.projects
                            ?.status
                        )}`}
                      >

                        {
                          report.projects
                            ?.status
                        }

                      </span>

                      <div className="flex items-center gap-2 text-sm text-gray-500">

                        <CalendarDays
                          size={16}
                        />

                        {new Date(
                          report.created_at
                        ).toLocaleString()}

                      </div>

                    </div>

                  </div>

                </div>

                {/* REPORT */}

                <div className="p-8">

                  <div className="bg-gray-50 border border-gray-100 rounded-3xl p-6">

                    <div className="flex items-center gap-2 mb-4">

                      <TrendingUp
                        className="text-blue-600"
                        size={20}
                      />

                      <h3 className="font-bold text-gray-800">

                        Technician Report

                      </h3>

                    </div>

                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">

                      {
                        report.report_text
                      }

                    </p>

                  </div>

                  {/* IMAGE */}

                  {report.image_url && (

                    <div className="mt-8">

                      <div className="flex items-center justify-between mb-4">

                        <div className="flex items-center gap-2">

                          <ImageIcon
                            className="text-blue-600"
                            size={20}
                          />

                          <h3 className="font-semibold text-gray-800">

                            Attached Image

                          </h3>

                        </div>

                        <button
                          onClick={() =>
                            setPreviewImage(
                              report.image_url
                            )
                          }
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-all"
                        >

                          <Eye
                            size={16}
                          />

                          Preview

                        </button>

                      </div>

                      <img
                        src={
                          report.image_url
                        }
                        alt="Report"
                        className="w-full max-h-[420px] object-cover rounded-3xl border border-gray-200"
                      />

                    </div>

                  )}

                </div>

              </div>

            )
          )}

        </div>

        {/* IMAGE MODAL */}

        {previewImage && (

          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50">

            <div className="relative w-full max-w-5xl">

              <button
                onClick={() =>
                  setPreviewImage(
                    null
                  )
                }
                className="absolute -top-14 right-0 bg-white text-black p-3 rounded-full hover:scale-110 transition-all"
              >

                <X size={22} />

              </button>

              <img
                src={previewImage}
                alt="Preview"
                className="w-full max-h-[85vh] object-contain rounded-3xl"
              />

            </div>

          </div>

        )}

      </main>

    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: any) {

  const bgMap: any = {
    blue: "bg-blue-50",
    green: "bg-green-50",
    yellow: "bg-yellow-50",
    red: "bg-red-50",
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-7 hover:-translate-y-1 transition-all">

      <div className="flex items-center justify-between mb-5">

        <div
          className={`p-4 rounded-2xl ${bgMap[color]}`}
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