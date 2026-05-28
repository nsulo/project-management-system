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
  Plus,
  X,
  Users,
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
    showCreateModal,
    setShowCreateModal,
  ] = useState(false);

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

    setShowCreateModal(false);

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

  function getStatusColor(
    status: string
  ) {

    if (
      status === "Completed"
    ) {

      return "bg-green-100 text-green-700";
    }

    if (
      status === "In Progress"
    ) {

      return "bg-yellow-100 text-yellow-700";
    }

    if (
      status === "On Hold"
    ) {

      return "bg-red-100 text-red-700";
    }

    return "bg-blue-100 text-blue-700";
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

        {/* HEADER */}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10">

          <div>

            <h1 className="text-4xl font-bold text-blue-600">

              Projects Management

            </h1>

            <p className="text-gray-600 mt-2">

              Create, manage and monitor all projects

            </p>

          </div>

          <button
            onClick={() =>
              setShowCreateModal(
                true
              )
            }
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl flex items-center gap-3 shadow-lg transition-all"
          >

            <Plus size={20} />

            Create Project

          </button>

        </div>

        {/* STATS */}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">

          <StatsCard
            title="Total Projects"
            value={projects.length}
            icon={
              <FolderKanban
                className="text-blue-600"
                size={38}
              />
            }
          />

          <StatsCard
            title="In Progress"
            value={
              inProgressProjects
            }
            icon={
              <Clock3
                className="text-yellow-500"
                size={38}
              />
            }
          />

          <StatsCard
            title="Completed"
            value={
              completedProjects
            }
            icon={
              <CheckCircle2
                className="text-green-600"
                size={38}
              />
            }
          />

          <StatsCard
            title="Pending"
            value={
              pendingProjects
            }
            icon={
              <PauseCircle
                className="text-red-500"
                size={38}
              />
            }
          />

        </div>

        {/* FILTERS */}

        <div className="bg-white rounded-3xl shadow p-6 mb-8">

          <div className="flex flex-col xl:flex-row gap-4 xl:items-center xl:justify-between">

            <div className="flex items-center gap-3 bg-gray-100 px-4 py-3 rounded-2xl w-full xl:w-[400px]">

              <Search
                size={20}
                className="text-gray-500"
              />

              <input
                type="text"
                placeholder="Search projects..."
                className="bg-transparent outline-none w-full"
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
              />

            </div>

            <div className="flex flex-col md:flex-row gap-4">

              <select
                className="border border-gray-200 px-4 py-3 rounded-2xl"
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
                  All Status
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
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-2xl flex items-center justify-center gap-2"
              >

                <Download
                  size={18}
                />

                Export CSV

              </button>

            </div>

          </div>

        </div>

        {/* PROJECT CARDS */}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

          {filteredProjects.map(
            (project: any) => (

              <div
                key={project.id}
                className="bg-white rounded-3xl shadow-lg p-7 hover:shadow-2xl transition-all"
              >

                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 mb-6">

                  <div>

                    <div className="flex items-center gap-3 mb-3">

                      <FolderKanban
                        className="text-blue-600"
                        size={24}
                      />

                      <h2 className="text-2xl font-bold text-gray-800">

                        {
                          project.title
                        }

                      </h2>

                    </div>

                    <p className="text-gray-600 leading-relaxed">

                      {
                        project.description
                      }

                    </p>

                  </div>

                  <span
                    className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${getStatusColor(
                      project.status
                    )}`}
                  >

                    {
                      project.status
                    }

                  </span>

                </div>

                {/* CLIENT */}

                <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-4 mb-6">

                  <Users
                    className="text-blue-600"
                    size={20}
                  />

                  <div>

                    <p className="text-sm text-gray-500">

                      Client

                    </p>

                    <p className="font-semibold text-gray-800">

                      {
                        project
                          .profiles
                          ?.full_name
                      }

                    </p>

                  </div>

                </div>

                {/* PROGRESS */}

                <div className="mb-6">

                  <div className="flex justify-between mb-3">

                    <span className="font-medium text-gray-700">

                      Progress

                    </span>

                    <span className="font-bold text-blue-600">

                      {
                        project.progress || 0
                      }%

                    </span>

                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">

                    <div
                      className="bg-blue-600 h-full transition-all"
                      style={{
                        width: `${
                          project.progress || 0
                        }%`,
                      }}
                    />

                  </div>

                </div>

                {/* CONTRACT */}

                <div className="bg-gray-50 rounded-2xl p-5 mb-6">

                  <h3 className="font-bold text-gray-800 mb-3">

                    Contract Details

                  </h3>

                  <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">

                    {
                      project.contract_details
                    }

                  </p>

                </div>

                {/* ACTIONS */}

                <div className="flex flex-wrap gap-3">

                  <button
                    onClick={() =>
                      startEdit(
                        project
                      )
                    }
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-3 rounded-2xl flex items-center gap-2 transition-all"
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
                    className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-2xl flex items-center gap-2 transition-all"
                  >

                    <Download
                      size={18}
                    />

                    PDF

                  </button>

                  <button
                    onClick={() =>
                      handleDeleteProject(
                        project.id
                      )
                    }
                    className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-2xl flex items-center gap-2 transition-all"
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

        {/* CREATE MODAL */}

        {showCreateModal && (

          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">

            <div className="bg-white w-full max-w-2xl rounded-3xl p-8 relative">

              <button
                onClick={() =>
                  setShowCreateModal(
                    false
                  )
                }
                className="absolute top-5 right-5 text-gray-500 hover:text-black"
              >

                <X size={24} />

              </button>

              <h2 className="text-3xl font-bold text-blue-600 mb-8">

                Create New Project

              </h2>

              <form
                onSubmit={
                  handleCreateProject
                }
                className="space-y-5"
              >

                <input
                  type="text"
                  placeholder="Project title"
                  className="w-full border p-4 rounded-2xl"
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
                  className="w-full border p-4 rounded-2xl"
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
                  rows={5}
                  placeholder="Contract details"
                  className="w-full border p-4 rounded-2xl"
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
                  className="w-full border p-4 rounded-2xl"
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
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-semibold"
                >

                  Create Project

                </button>

              </form>

            </div>

          </div>

        )}

        {/* EDIT MODAL */}

        {editingProject && (

          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">

            <div className="bg-white w-full max-w-2xl rounded-3xl p-8 relative">

              <button
                onClick={() =>
                  setEditingProject(
                    null
                  )
                }
                className="absolute top-5 right-5 text-gray-500 hover:text-black"
              >

                <X size={24} />

              </button>

              <h2 className="text-3xl font-bold text-blue-600 mb-8">

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
                  className="w-full border p-4 rounded-2xl"
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
                  className="w-full border p-4 rounded-2xl"
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
                  rows={5}
                  className="w-full border p-4 rounded-2xl"
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
                  className="w-full border p-4 rounded-2xl"
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

                  <div className="flex justify-between mb-2">

                    <label className="font-medium">

                      Progress

                    </label>

                    <span className="text-blue-600 font-bold">

                      {
                        editProgress
                      }%

                    </span>

                  </div>

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

                </div>

                <div className="flex gap-4 pt-3">

                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-semibold"
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
                    className="flex-1 bg-gray-200 hover:bg-gray-300 py-4 rounded-2xl font-semibold"
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

function StatsCard({
  title,
  value,
  icon,
}: any) {

  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 hover:shadow-2xl transition-all">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-gray-500 font-medium">

            {title}

          </p>

          <h2 className="text-4xl font-bold mt-3 text-gray-800">

            {value}

          </h2>

        </div>

        <div className="bg-gray-100 p-4 rounded-2xl">

          {icon}

        </div>

      </div>

    </div>
  );
}