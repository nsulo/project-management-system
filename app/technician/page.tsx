"use client";

import {
  useEffect,
  useState,
} from "react";

import { v4 as uuidv4 } from "uuid";

import {
  FileText,
  Upload,
  CheckCircle2,
  Clock3,
  FolderKanban,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

import LogoutButton from "@/components/LogoutButton";

import Sidebar from "@/components/Sidebar";

type AssignedProject = {
  id: number;
  projects: {
    id: number;
    title: string;
    description: string;
    contract_details: string;
    status: string;
    progress: number;
  };
};

export default function TechnicianPage() {

  const [projects, setProjects] =
    useState<
      AssignedProject[]
    >([]);

  const [loading, setLoading] =
    useState(true);

  const [
    selectedProject,
    setSelectedProject,
  ] = useState("");

  const [reportText, setReportText] =
    useState("");

  const [progress, setProgress] =
    useState(0);

  const [image, setImage] =
    useState<File | null>(null);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  useEffect(() => {

    fetchAssignedProjects();

    const channel =
      supabase
        .channel(
          "technician-projects"
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table:
              "project_assignments",
          },
          () => {
            fetchAssignedProjects();
          }
        )
        .subscribe();

    return () => {

      supabase.removeChannel(
        channel
      );
    };

  }, []);

  async function fetchAssignedProjects() {

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
      .from(
        "project_assignments"
      )
      .select(`
        id,
        projects (
          id,
          title,
          description,
          contract_details,
          status,
          progress
        )
      `)
      .eq(
        "technician_id",
        user.id
      );

    if (!error && data) {

      setProjects(
  (data ||
    []) as unknown as AssignedProject[]
);
    }

    setLoading(false);
  }

  async function uploadImage() {

    if (!image) return null;

    const fileExt =
      image.name
        .split(".")
        .pop();

    const fileName =
      `${uuidv4()}.${fileExt}`;

    const { error } =
      await supabase.storage
        .from(
          "report-images"
        )
        .upload(
          fileName,
          image
        );

    if (error) {

      alert(error.message);

      return null;
    }

    const { data } =
      supabase.storage
        .from(
          "report-images"
        )
        .getPublicUrl(
          fileName
        );

    return data.publicUrl;
  }

  async function submitReport(
    e: React.FormEvent
  ) {

    e.preventDefault();

    if (
      !selectedProject ||
      !reportText
    ) {

      alert(
        "Please complete the form"
      );

      return;
    }

    setSubmitting(true);

    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user) {

      setSubmitting(false);

      return;
    }

    let imageUrl =
      null;

    if (image) {

      imageUrl =
        await uploadImage();
    }

    const { error } =
      await supabase
        .from("reports")
        .insert({
          project_id:
            Number(
              selectedProject
            ),
          technician_id:
            user.id,
          report_text:
            reportText,
          image_url:
            imageUrl,
        });

    if (error) {

      alert(error.message);

      setSubmitting(false);

      return;
    }

    await supabase
      .from("projects")
      .update({
        progress,
      })
      .eq(
        "id",
        selectedProject
      );

    if (progress >= 100) {

      await supabase
        .from("projects")
        .update({
          status:
            "Completed",
        })
        .eq(
          "id",
          selectedProject
        );
    }

    await supabase
      .from(
        "notifications"
      )
      .insert({
        title:
          "New Technician Report",
        message:
          "A technician submitted a new report.",
        is_read: false,
      });

    alert(
      "Report submitted successfully"
    );

    setSelectedProject("");

    setReportText("");

    setProgress(0);

    setImage(null);

    fetchAssignedProjects();

    setSubmitting(false);
  }

  function getStatusColor(
    status: string
  ) {

    const normalized =
      status.toLowerCase();

    if (
      normalized ===
      "completed"
    ) {

      return "bg-green-100 text-green-700";
    }

    if (
      normalized ===
      "in progress"
    ) {

      return "bg-yellow-100 text-yellow-700";
    }

    return "bg-blue-100 text-blue-700";
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

      <Sidebar role="technician" />

      <main className="flex-1 min-h-screen bg-gray-100 p-6 md:p-10 pt-24 md:pt-10">

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10">

          <div>

            <h1 className="text-4xl font-bold text-green-600">

              Technician Dashboard

            </h1>

            <p className="text-gray-600 mt-2">

              Manage assigned projects and submit progress reports

            </p>

          </div>

          <LogoutButton />

        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

          {/* REPORT FORM */}

          <div className="bg-white rounded-2xl shadow p-8">

            <div className="flex items-center gap-3 mb-6">

              <FileText
                className="text-green-600"
                size={30}
              />

              <h2 className="text-2xl font-bold text-green-600">

                Submit Report

              </h2>

            </div>

            <form
              onSubmit={
                submitReport
              }
              className="space-y-5"
            >

              <div>

                <label className="block mb-2 font-semibold">

                  Select Project

                </label>

                <select
                  className="w-full border p-3 rounded-xl"
                  value={
                    selectedProject
                  }
                  onChange={(e) =>
                    setSelectedProject(
                      e.target.value
                    )
                  }
                >

                  <option value="">
                    Choose project
                  </option>

                  {projects.map(
                    (
                      item
                    ) => (

                      <option
                        key={
                          item.id
                        }
                        value={
                          item
                            .projects
                            ?.id
                        }
                      >
                        {
                          item
                            .projects
                            ?.title
                        }
                      </option>

                    )
                  )}

                </select>

              </div>

              <div>

                <label className="block mb-2 font-semibold">

                  Work Report

                </label>

                <textarea
                  rows={6}
                  className="w-full border p-4 rounded-xl"
                  placeholder="Describe completed work..."
                  value={
                    reportText
                  }
                  onChange={(e) =>
                    setReportText(
                      e.target.value
                    )
                  }
                />

              </div>

              <div>

                <label className="block mb-2 font-semibold">

                  Project Progress %

                </label>

                <input
                  type="number"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) =>
                    setProgress(
                      Number(
                        e.target.value
                      )
                    )
                  }
                  className="w-full border p-3 rounded-xl"
                />

              </div>

              <div>

                <label className="block mb-2 font-semibold">

                  Upload Image

                </label>

                <div className="border-2 border-dashed border-gray-300 rounded-xl p-5">

                  <input
                    type="file"
                    onChange={(e) =>
                      setImage(
                        e.target
                          .files?.[0] ||
                          null
                      )
                    }
                  />

                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-3">

                    <Upload
                      size={16}
                    />

                    Optional project image

                  </div>

                </div>

              </div>

              <button
                type="submit"
                disabled={
                  submitting
                }
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl transition-all disabled:opacity-50"
              >

                {submitting
                  ? "Submitting..."
                  : "Submit Report"}

              </button>

            </form>

          </div>

          {/* PROJECTS */}

          <div className="xl:col-span-2">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {projects.length ===
                0 && (

                <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-500">

                  No assigned projects

                </div>

              )}

              {projects.map(
                (
                  item
                ) => {

                  const project =
                    item.projects;

                  return (
                    <div
                      key={
                        item.id
                      }
                      className="bg-white rounded-2xl shadow p-6"
                    >

                      <div className="flex items-start justify-between gap-4 mb-5">

                        <div>

                          <div className="flex items-center gap-2 mb-2">

                            <FolderKanban
                              className="text-green-600"
                              size={20}
                            />

                            <h2 className="text-2xl font-bold text-gray-800">

                              {
                                project.title
                              }

                            </h2>

                          </div>

                          <p className="text-gray-600">

                            {
                              project.description
                            }

                          </p>

                        </div>

                        <span
                          className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${getStatusColor(
                            project.status
                          )}`}
                        >

                          {
                            project.status
                          }

                        </span>

                      </div>

                      <div className="mb-6">

                        <div className="flex justify-between text-sm mb-2">

                          <span className="font-medium text-gray-700">

                            Progress

                          </span>

                          <span className="font-bold text-green-600">

                            {
                              project.progress || 0
                            }%

                          </span>

                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-3">

                          <div
                            className="bg-green-600 h-3 rounded-full transition-all"
                            style={{
                              width: `${project.progress || 0}%`,
                            }}
                          />

                        </div>

                      </div>

                      <div className="border-t pt-5 mb-5">

                        <h3 className="font-semibold mb-3 text-gray-800">

                          Contract Details

                        </h3>

                        <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">

                          {
                            project.contract_details
                          }

                        </p>

                      </div>

                      <div className="flex items-center gap-2 text-sm text-green-600">

                        {project.status.toLowerCase() ===
                        "completed" ? (

                          <CheckCircle2
                            size={18}
                          />

                        ) : (

                          <Clock3
                            size={18}
                          />

                        )}

                        Live project tracking enabled

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}