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
} from "lucide-react";

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
    });

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

    setStats({
      total:
        projectsData.length,

      completed:
        projectsData.filter(
          (p) =>
            p.status ===
            "Completed"
        ).length,

      inProgress:
        projectsData.filter(
          (p) =>
            p.status ===
            "In Progress"
        ).length,

      pending:
        projectsData.filter(
          (p) =>
            p.status ===
            "Pending"
        ).length,
    });

    setLoading(false);
  }

  function getStatusStyle(
    status: string
  ) {

    switch (status) {

      case "Completed":

        return "bg-green-100 text-green-700";

      case "In Progress":

        return "bg-yellow-100 text-yellow-700";

      case "On Hold":

        return "bg-red-100 text-red-700";

      default:

        return "bg-blue-100 text-blue-700";
    }
  }

  function getProgressColor(
    progress: number
  ) {

    if (progress >= 100) {

      return "bg-green-600";
    }

    if (progress >= 60) {

      return "bg-blue-600";
    }

    if (progress >= 30) {

      return "bg-yellow-500";
    }

    return "bg-red-500";
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

        {/* HEADER */}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10">

          <div>

            <h1 className="text-4xl font-bold text-purple-600">

              Client Dashboard

            </h1>

            <p className="text-gray-600 mt-2">

              Track your projects and monitor realtime progress

            </p>

          </div>

          <LogoutButton />

        </div>

        {/* STATS */}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">

          <div className="bg-white rounded-2xl shadow p-6">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-gray-500 mb-2">

                  Total Projects

                </p>

                <h2 className="text-4xl font-bold text-purple-600">

                  {stats.total}

                </h2>

              </div>

              <FolderKanban
                className="text-purple-600"
                size={34}
              />

            </div>

          </div>

          <div className="bg-white rounded-2xl shadow p-6">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-gray-500 mb-2">

                  In Progress

                </p>

                <h2 className="text-4xl font-bold text-yellow-600">

                  {stats.inProgress}

                </h2>

              </div>

              <Activity
                className="text-yellow-600"
                size={34}
              />

            </div>

          </div>

          <div className="bg-white rounded-2xl shadow p-6">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-gray-500 mb-2">

                  Completed

                </p>

                <h2 className="text-4xl font-bold text-green-600">

                  {stats.completed}

                </h2>

              </div>

              <CheckCircle2
                className="text-green-600"
                size={34}
              />

            </div>

          </div>

          <div className="bg-white rounded-2xl shadow p-6">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-gray-500 mb-2">

                  Pending

                </p>

                <h2 className="text-4xl font-bold text-blue-600">

                  {stats.pending}

                </h2>

              </div>

              <Clock3
                className="text-blue-600"
                size={34}
              />

            </div>

          </div>

        </div>

        {/* PROJECTS */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {projects.length ===
            0 && (

            <div className="bg-white p-10 rounded-2xl shadow text-center text-gray-500 lg:col-span-2">

              No projects assigned yet

            </div>

          )}

          {projects.map(
            (
              project
            ) => (

              <div
                key={project.id}
                className="bg-white rounded-2xl shadow p-7"
              >

                {/* TOP */}

                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 mb-6">

                  <div>

                    <div className="flex items-center gap-3 mb-3">

                      <FolderKanban
                        className="text-purple-600"
                        size={24}
                      />

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
                    className={`px-4 py-2 rounded-full text-sm font-medium w-fit ${getStatusStyle(
                      project.status
                    )}`}
                  >

                    {project.status}

                  </span>

                </div>

                {/* PROGRESS */}

                <div className="mb-7">

                  <div className="flex justify-between mb-2">

                    <span className="font-semibold text-gray-700">

                      Project Progress

                    </span>

                    <span className="font-bold text-gray-700">

                      {
                        project.progress ||
                        0
                      }
                      %

                    </span>

                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">

                    <div
                      className={`h-4 rounded-full transition-all duration-500 ${getProgressColor(
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

                  <div className="flex items-center gap-2 mb-3">

                    <FileText
                      className="text-purple-600"
                      size={20}
                    />

                    <h3 className="font-bold text-gray-800">

                      Contract Details

                    </h3>

                  </div>

                  <p className="text-gray-600 whitespace-pre-wrap text-sm leading-relaxed">

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

                  <div className="text-sm font-medium text-purple-600">

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