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
} from "lucide-react";

type ReportType = {
  id: number;
  report_text: string;
  image_url: string | null;
  created_at: string;
  projects: {
    title: string;
    status: string;
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

    const { data, error } =
      await supabase
        .from("reports")
        .select(`
          *,
          projects (
            title,
            status
          ),
          profiles (
            full_name
          )
        `)
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

      setReports(
        data as ReportType[]
      );
    }

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

          return (
            project.includes(
              value
            ) ||
            technician.includes(
              value
            ) ||
            text.includes(
              value
            )
          );
        }
      );

    }, [reports, search]);

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

              <FileText
                className="text-blue-600"
                size={34}
              />

              <h1 className="text-4xl font-bold text-blue-600">

                Technician Reports

              </h1>

            </div>

            <p className="text-gray-600">

              Monitor technician field activity in realtime

            </p>

          </div>

          <button
            onClick={
              exportCSV
            }
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl transition-all"
          >

            <Download
              size={18}
            />

            Export CSV

          </button>

        </div>

        <div className="bg-white rounded-2xl shadow p-5 mb-8">

          <div className="relative">

            <Search
              size={18}
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
              className="w-full border rounded-xl py-3 pl-11 pr-4"
            />

          </div>

        </div>

        <div className="space-y-6">

          {filteredReports.length ===
            0 && (

            <div className="bg-white p-10 rounded-2xl shadow text-center text-gray-500">

              No reports found

            </div>

          )}

          {filteredReports.map(
            (report) => (

              <div
                key={report.id}
                className="bg-white rounded-2xl shadow p-6"
              >

                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 mb-5">

                  <div>

                    <h2 className="text-2xl font-bold text-gray-800">

                      {
                        report.projects
                          ?.title
                      }

                    </h2>

                    <div className="mt-2 text-gray-500">

                      Technician:
                      {" "}

                      <span className="font-medium text-gray-700">

                        {
                          report.profiles
                            ?.full_name
                        }

                      </span>

                    </div>

                  </div>

                  <div className="flex flex-col items-start lg:items-end gap-3">

                    <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-xl text-sm font-medium">

                      {
                        report.projects
                          ?.status
                      }

                    </span>

                    <div className="text-sm text-gray-500">

                      {new Date(
                        report.created_at
                      ).toLocaleString()}

                    </div>

                  </div>

                </div>

                <div className="bg-gray-50 rounded-2xl p-5">

                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">

                    {
                      report.report_text
                    }

                  </p>

                </div>

                {report.image_url && (

                  <div className="mt-6">

                    <div className="flex items-center gap-2 mb-3 text-gray-700 font-medium">

                      <ImageIcon
                        size={18}
                      />

                      Attached Image

                    </div>

                    <img
                      src={
                        report.image_url
                      }
                      alt="Report"
                      className="w-full max-h-[500px] object-cover rounded-2xl border"
                    />

                  </div>

                )}

              </div>

            )
          )}

        </div>

      </main>

    </div>
  );
}