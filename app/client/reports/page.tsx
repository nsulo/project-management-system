"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  FileText,
  ImageIcon,
  Clock3,
} from "lucide-react";

import Sidebar from "@/components/Sidebar";

import { supabase } from "@/lib/supabase";

type ReportType = {
  id: number;
  report_text: string;
  image_url: string | null;
  created_at: string;
  projects: {
    title: string;
  };
  profiles: {
    full_name: string;
  };
};

export default function ClientReportsPage() {

  const [reports, setReports] =
    useState<ReportType[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    fetchReports();

    const channel =
      supabase
        .channel(
          "client-reports"
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

    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user) {

      setLoading(false);

      return;
    }

    const {
      data: projects,
    } = await supabase
      .from("projects")
      .select("id")
      .eq("client_id", user.id);

    const projectIds =
      projects?.map(
        (project) => project.id
      ) || [];

    if (projectIds.length === 0) {

      setReports([]);

      setLoading(false);

      return;
    }

    const {
      data,
      error,
    } = await supabase
      .from("reports")
      .select(`
        *,
        projects (
          title
        ),
        profiles (
          full_name
        )
      `)
      .in(
        "project_id",
        projectIds
      )
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

  if (loading) {

    return (
      <div className="p-10">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex">

      <Sidebar role="client" />

      <main className="flex-1 min-h-screen bg-gray-100 p-6 md:p-10 pt-24 md:pt-10">

        <div className="mb-10">

          <div className="flex items-center gap-3 mb-3">

            <FileText
              className="text-purple-600"
              size={34}
            />

            <h1 className="text-4xl font-bold text-purple-600">

              Project Reports

            </h1>

          </div>

          <p className="text-gray-600">

            View technician updates and progress reports

          </p>

        </div>

        <div className="space-y-6">

          {reports.length ===
            0 && (

            <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-500">

              No reports available yet

            </div>

          )}

          {reports.map(
            (report) => (

              <div
                key={report.id}
                className="bg-white rounded-2xl shadow p-7"
              >

                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 mb-5">

                  <div>

                    <h2 className="text-2xl font-bold text-gray-800 mb-2">

                      {
                        report.projects
                          ?.title
                      }

                    </h2>

                    <p className="text-gray-500">

                      Technician:{" "}

                      <span className="font-medium">

                        {
                          report.profiles
                            ?.full_name
                        }

                      </span>

                    </p>

                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500">

                    <Clock3
                      size={16}
                    />

                    {new Date(
                      report.created_at
                    ).toLocaleString()}

                  </div>

                </div>

                <div className="bg-gray-50 rounded-xl p-5 mb-5">

                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">

                    {
                      report.report_text
                    }

                  </p>

                </div>

                {report.image_url && (

                  <div>

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