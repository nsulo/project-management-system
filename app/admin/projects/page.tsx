"use client";

import {
  useEffect,
  useState,
} from "react";

import jsPDF from "jspdf";

import {
  FolderKanban,
  Clock3,
  CheckCircle2,
  PauseCircle,
  Search,
  Download,
  Pencil,
  Trash2,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

import { logActivity } from "@/lib/logActivity";

import Sidebar from "@/components/Sidebar";

export default function ProjectsPage() {

  const [title, setTitle] =
    useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [
    contractDetails,
    setContractDetails,
  ] = useState("");

  const [clientId, setClientId] =
    useState("");

  const [clients, setClients] =
    useState<any[]>([]);

  const [projects, setProjects] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");

  const [
    editingProject,
    setEditingProject,
  ] = useState<any | null>(
    null
  );

  const [
    editTitle,
    setEditTitle,
  ] = useState("");

  const [
    editDescription,
    setEditDescription,
  ] = useState("");

  const [
    editContractDetails,
    setEditContractDetails,
  ] = useState("");

  const [
    editStatus,
    setEditStatus,
  ] = useState("Pending");

  const [
    editProgress,
    setEditProgress,
  ] = useState(0);

  useEffect(() => {

    fetchClients();

    fetchProjects();

    const channel =
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
            fetchProjects();
          }
        )
        .subscribe();

    return () => {
      supabase.removeChannel(
        channel
      );
    };

  }, []);

  async function fetchClients() {

    const { data } =
      await supabase
        .from("profiles")
        .select("*")
        .eq("role", "client");

    if (data) {
      setClients(data);
    }
  }

  async function fetchProjects() {

    setLoading(true);

    const { data, error } =
      await supabase
        .from("projects")
        .select(`
          *,
          profiles (
            full_name
          )
        `)
        .order("created_at", {
          ascending: false,
        });

    if (!error && data) {

      setProjects(data);
    }

    setLoading(false);
  }

  async function handleCreateProject(
    e: React.FormEvent
  ) {

    e.preventDefault();

    const { error } =
      await supabase
        .from("projects")
        .insert({
          title,
          description,
          contract_details:
            contractDetails,
          client_id: clientId,
          status: "Pending",
          progress: 0,
        });

    if (error) {

      alert(error.message);

      return;
    }

    await supabase
      .from("notifications")
      .insert({
        user_id: clientId,
        title:
          "New Project Created",
        message:
          `Project "${title}" has been created.`,
      });

    await logActivity(
      "Project Created",
      `Created project ${title}`
    );

    setTitle("");
    setDescription("");
    setContractDetails("");
    setClientId("");

    fetchProjects();
  }

  async function handleDeleteProject(
    id: number
  ) {

    const confirmed =
      confirm(
        "Delete this project?"
      );

    if (!confirmed) return;

    const { error } =
      await supabase
        .from("projects")
        .delete()
        .eq("id", id);

    if (error) {

      alert(error.message);

      return;
    }

    fetchProjects();
  }

  function startEdit(
    project: any
  ) {

    setEditingProject(project);

    setEditTitle(project.title);

    setEditDescription(
      project.description
    );

    setEditContractDetails(
      project.contract_details
    );

    setEditStatus(
      project.status
    );

    setEditProgress(
      project.progress || 0
    );
  }

  async function handleUpdateProject(
    e: React.FormEvent
  ) {

    e.preventDefault();

    if (!editingProject)
      return;

    const { error } =
      await supabase
        .from("projects")
        .update({
          title: editTitle,
          description:
            editDescription,
          contract_details:
            editContractDetails,
          status: editStatus,
          progress:
            editProgress,
        })
        .eq(
          "id",
          editingProject.id
        );

    if (error) {

      alert(error.message);

      return;
    }

    await supabase
      .from("notifications")
      .insert({
        user_id:
          editingProject.client_id,
        title:
          "Project Updated",
        message:
          `${editTitle} updated to ${editStatus}`,
      });

    await logActivity(
      "Project Updated",
      `${editTitle} updated`
    );

    setEditingProject(null);

    fetchProjects();
  }

  function generateContractPDF(
    project: any
  ) {

    const doc =
      new jsPDF();

    doc.setFontSize(22);

    doc.text(
      "PROJECT CONTRACT",
      20,
      20
    );

    doc.setFontSize(14);

    doc.text(
      `Title: ${project.title}`,
      20,
      50
    );

    doc.text(
      `Client: ${
        project.profiles
          ?.full_name || ""
      }`,
      20,
      65
    );

    doc.text(
      `Status: ${project.status}`,
      20,
      80
    );

    doc.text(
      `Progress: ${
        project.progress || 0
      }%`,
      20,
      95
    );

    doc.text(
      "Contract Details:",
      20,
      115
    );

    const text =
      doc.splitTextToSize(
        project.contract_details ||
          "",
        170
      );

    doc.text(
      text,
      20,
      130
    );

    doc.save(
      `${project.title}.pdf`
    );
  }

  function exportProjectsCSV() {

    const headers = [
      "Title",
      "Client",
      "Status",
      "Progress",
    ];

    const rows =
      filteredProjects.map(
        (project) => [
          project.title,
          project.profiles
            ?.full_name || "",
          project.status,
          project.progress || 0,
        ]
      );

    const csv =
      [
        headers.join(","),
        ...rows.map((r) =>
          r.join(",")
        ),
      ].join("\n");

    const blob =
      new Blob([csv], {
        type: "text/csv",
      });

    const link =
      document.createElement(
        "a"
      );

    link.href =
      URL.createObjectURL(blob);

    link.download =
      "projects.csv";

    link.click();
  }

  const filteredProjects =
    projects.filter((project) => {

      const matchesSearch =
        project.title
          .toLowerCase()
          .includes(
            search.toLowerCase()
          );

      const matchesStatus =
        statusFilter === "all"
          ? true
          : project.status ===
            statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });

  const completedProjects =
    projects.filter(
      (p) =>
        p.status ===
        "Completed"
    ).length;

  const pendingProjects =
    projects.filter(
      (p) =>
        p.status === "Pending"
    ).length;

  const inProgressProjects =
    projects.filter(
      (p) =>
        p.status ===
        "In Progress"
    ).length;

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

          <div className="bg-white rounded-2xl shadow p-6">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-gray-500">
                  Total Projects
                </p>

                <h2 className="text-4xl font-bold mt-2">

                  {projects.length}

                </h2>

              </div>

              <FolderKanban
                className="text-blue-600"
                size={40}
              />

            </div>

          </div>

          <div className="bg-white rounded-2xl shadow p-6">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-gray-500">
                  In Progress
                </p>

                <h2 className="text-4xl font-bold mt-2">

                  {
                    inProgressProjects
                  }

                </h2>

              </div>

              <Clock3
                className="text-yellow-500"
                size={40}
              />

            </div>

          </div>

          <div className="bg-white rounded-2xl shadow p-6">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-gray-500">
                  Completed
                </p>

                <h2 className="text-4xl font-bold mt-2">

                  {
                    completedProjects
                  }

                </h2>

              </div>

              <CheckCircle2
                className="text-green-600"
                size={40}
              />

            </div>

          </div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          <div className="bg-white rounded-2xl shadow p-6 h-fit">

            <h1 className="text-3xl font-bold text-blue-600 mb-6">

              Create Project

            </h1>

            <form
              onSubmit={
                handleCreateProject
              }
              className="space-y-5"
            >

              <input
                type="text"
                placeholder="Project title"
                className="w-full border p-3 rounded-xl"
                value={title}
                onChange={(e) =>
                  setTitle(
                    e.target.value
                  )
                }
                required
              />

              <textarea
                rows={4}
                placeholder="Description"
                className="w-full border p-3 rounded-xl"
                value={
                  description
                }
                onChange={(e) =>
                  setDescription(
                    e.target.value
                  )
                }
              />

              <textarea
                rows={4}
                placeholder="Contract details"
                className="w-full border p-3 rounded-xl"
                value={
                  contractDetails
                }
                onChange={(e) =>
                  setContractDetails(
                    e.target.value
                  )
                }
              />

              <select
                className="w-full border p-3 rounded-xl"
                value={clientId}
                onChange={(e) =>
                  setClientId(
                    e.target.value
                  )
                }
                required
              >

                <option value="">
                  Select Client
                </option>

                {clients.map(
                  (client) => (

                    <option
                      key={client.id}
                      value={client.id}
                    >
                      {
                        client.full_name
                      }
                    </option>

                  )
                )}

              </select>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl"
              >

                Create Project

              </button>

            </form>

          </div>

          <div className="lg:col-span-2 space-y-6">

            <div className="bg-white rounded-2xl shadow p-6">

              <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">

                <div className="flex items-center gap-3">

                  <Search
                    size={20}
                  />

                  <input
                    type="text"
                    placeholder="Search projects..."
                    className="border p-3 rounded-xl w-full md:w-80"
                    value={search}
                    onChange={(e) =>
                      setSearch(
                        e.target.value
                      )
                    }
                  />

                </div>

                <div className="flex gap-3">

                  <select
                    className="border p-3 rounded-xl"
                    value={
                      statusFilter
                    }
                    onChange={(e) =>
                      setStatusFilter(
                        e.target.value
                      )
                    }
                  >

                    <option value="all">
                      All
                    </option>

                    <option value="Pending">
                      Pending
                    </option>

                    <option value="In Progress">
                      In Progress
                    </option>

                    <option value="Completed">
                      Completed
                    </option>

                    <option value="On Hold">
                      On Hold
                    </option>

                  </select>

                  <button
                    onClick={
                      exportProjectsCSV
                    }
                    className="bg-green-600 text-white px-5 rounded-xl flex items-center gap-2"
                  >

                    <Download
                      size={18}
                    />

                    CSV

                  </button>

                </div>

              </div>

            </div>

            {filteredProjects.map(
              (project: any) => (

                <div
                  key={project.id}
                  className="bg-white rounded-2xl shadow p-6"
                >

                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                    <div>

                      <h2 className="text-2xl font-bold">

                        {
                          project.title
                        }

                      </h2>

                      <p className="text-gray-600 mt-2">

                        {
                          project.description
                        }

                      </p>

                      <p className="text-sm text-gray-500 mt-4">

                        Client:
                        {" "}
                        {
                          project
                            .profiles
                            ?.full_name
                        }

                      </p>

                    </div>

                    <div className="text-right">

                      <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-xl text-sm">

                        {
                          project.status
                        }

                      </span>

                    </div>

                  </div>

                  <div className="mt-6">

                    <div className="flex items-center justify-between mb-2">

                      <p className="font-medium">

                        Progress

                      </p>

                      <p className="text-sm text-gray-500">

                        {
                          project.progress || 0
                        }%

                      </p>

                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">

                      <div
                        className="bg-blue-600 h-full"
                        style={{
                          width: `${
                            project.progress || 0
                          }%`,
                        }}
                      />

                    </div>

                  </div>

                  <div className="flex flex-wrap gap-3 mt-6">

                    <button
                      onClick={() =>
                        startEdit(
                          project
                        )
                      }
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"
                    >

                      <Pencil
                        size={18}
                      />

                      Edit

                    </button>

                    <button
                      onClick={() =>
                        generateContractPDF(
                          project
                        )
                      }
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl"
                    >

                      PDF

                    </button>

                    <button
                      onClick={() =>
                        handleDeleteProject(
                          project.id
                        )
                      }
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl flex items-center gap-2"
                    >

                      <Trash2
                        size={18}
                      />

                      Delete

                    </button>

                  </div>

                </div>

              )
            )}

          </div>

        </div>

        {editingProject && (

          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">

            <div className="bg-white w-full max-w-2xl rounded-2xl p-8">

              <h2 className="text-3xl font-bold mb-6">

                Edit Project

              </h2>

              <form
                onSubmit={
                  handleUpdateProject
                }
                className="space-y-5"
              >

                <input
                  type="text"
                  className="w-full border p-3 rounded-xl"
                  value={
                    editTitle
                  }
                  onChange={(e) =>
                    setEditTitle(
                      e.target.value
                    )
                  }
                />

                <textarea
                  rows={4}
                  className="w-full border p-3 rounded-xl"
                  value={
                    editDescription
                  }
                  onChange={(e) =>
                    setEditDescription(
                      e.target.value
                    )
                  }
                />

                <textarea
                  rows={4}
                  className="w-full border p-3 rounded-xl"
                  value={
                    editContractDetails
                  }
                  onChange={(e) =>
                    setEditContractDetails(
                      e.target.value
                    )
                  }
                />

                <select
                  className="w-full border p-3 rounded-xl"
                  value={
                    editStatus
                  }
                  onChange={(e) =>
                    setEditStatus(
                      e.target.value
                    )
                  }
                >

                  <option value="Pending">
                    Pending
                  </option>

                  <option value="In Progress">
                    In Progress
                  </option>

                  <option value="Completed">
                    Completed
                  </option>

                  <option value="On Hold">
                    On Hold
                  </option>

                </select>

                <div>

                  <label className="block mb-2 font-medium">

                    Progress %
                  </label>

                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={
                      editProgress
                    }
                    onChange={(e) =>
                      setEditProgress(
                        Number(
                          e.target.value
                        )
                      )
                    }
                    className="w-full"
                  />

                  <div className="text-sm text-gray-500 mt-1">

                    {
                      editProgress
                    }%

                  </div>

                </div>

                <div className="flex gap-4">

                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl"
                  >

                    Save Changes

                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setEditingProject(
                        null
                      )
                    }
                    className="flex-1 bg-gray-300 p-3 rounded-xl"
                  >

                    Cancel

                  </button>

                </div>

              </form>

            </div>

          </div>

        )}

      </main>

    </div>
  );
}