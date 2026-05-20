"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  CheckCircle,
  Trash2,
  UserPlus,
  Wrench,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

import { logActivity } from "@/lib/logActivity";

import Sidebar from "@/components/Sidebar";

type ProjectType = {
  id: number;
  title: string;
  status: string;
};

type TechnicianType = {
  id: string;
  full_name: string;
};

type AssignmentType = {
  id: number;
  created_at: string;
  project_id: number;
  technician_id: string;

  projects: {
    id: number;
    title: string;
  };

  technician: {
    full_name: string;
  };
};

export default function AssignmentsPage() {

  const [projects, setProjects] =
    useState<ProjectType[]>([]);

  const [
    technicians,
    setTechnicians,
  ] = useState<
    TechnicianType[]
  >([]);

  const [
    assignments,
    setAssignments,
  ] = useState<
    AssignmentType[]
  >([]);

  const [projectId, setProjectId] =
    useState("");

  const [
    technicianId,
    setTechnicianId,
  ] = useState("");

  const [loading, setLoading] =
    useState(true);

  const [assigning, setAssigning] =
    useState(false);

  useEffect(() => {

    fetchProjects();

    fetchTechnicians();

    fetchAssignments();

    const channel =
      supabase
        .channel(
          "assignments-realtime"
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
            fetchAssignments();
          }
        )
        .subscribe();

    return () => {

      supabase.removeChannel(
        channel
      );
    };

  }, []);

  async function fetchProjects() {

    const { data, error } =
      await supabase
        .from("projects")
        .select(`
          id,
          title,
          status
        `)
        .order("created_at", {
          ascending: false,
        });

    if (error) {

      console.error(error);

      return;
    }

    setProjects(
      data || []
    );
  }

  async function fetchTechnicians() {

    const { data, error } =
      await supabase
        .from("profiles")
        .select(`
          id,
          full_name
        `)
        .eq(
          "role",
          "technician"
        )
        .order("full_name", {
          ascending: true,
        });

    if (error) {

      console.error(error);

      return;
    }

    setTechnicians(
      data || []
    );
  }

  async function fetchAssignments() {

    const { data, error } =
      await supabase
        .from(
          "project_assignments"
        )
        .select(`
          id,
          created_at,
          project_id,
          technician_id,

          projects:project_id (
            id,
            title
          ),

          technician:technician_id (
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

    setAssignments(
      data as AssignmentType[]
    );

    setLoading(false);
  }

  async function handleAssign(
    e: React.FormEvent
  ) {

    e.preventDefault();

    if (
      !projectId ||
      !technicianId
    ) {

      alert(
        "Please select project and technician"
      );

      return;
    }

    setAssigning(true);

    const {
      data: existingAssignment,
    } = await supabase
      .from(
        "project_assignments"
      )
      .select("id")
      .eq(
        "project_id",
        projectId
      )
      .eq(
        "technician_id",
        technicianId
      )
      .maybeSingle();

    if (
      existingAssignment
    ) {

      alert(
        "This technician is already assigned to this project"
      );

      setAssigning(false);

      return;
    }

    const { error } =
      await supabase
        .from(
          "project_assignments"
        )
        .insert({
          project_id:
            Number(projectId),
          technician_id:
            technicianId,
        });

    if (error) {

      alert(error.message);

      setAssigning(false);

      return;
    }

    const selectedProject =
      projects.find(
        (project) =>
          String(project.id) ===
          projectId
      );

    const selectedTechnician =
      technicians.find(
        (technician) =>
          technician.id ===
          technicianId
      );

    await supabase
      .from("notifications")
      .insert({
        user_id:
          technicianId,
        title:
          "New Project Assigned",
        message:
          `You were assigned to "${selectedProject?.title}"`,
      });

    await logActivity(
      "Technician Assigned",
      `${selectedTechnician?.full_name} assigned to ${selectedProject?.title}`
    );

    alert(
      "Technician assigned successfully"
    );

    setProjectId("");

    setTechnicianId("");

    fetchAssignments();

    setAssigning(false);
  }

  async function removeAssignment(
    assignmentId: number
  ) {

    const confirmed =
      confirm(
        "Remove this assignment?"
      );

    if (!confirmed) return;

    const { error } =
      await supabase
        .from(
          "project_assignments"
        )
        .delete()
        .eq(
          "id",
          assignmentId
        );

    if (error) {

      alert(error.message);

      return;
    }

    alert(
      "Assignment removed"
    );

    fetchAssignments();
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

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

          {/* ASSIGN FORM */}

          <div className="bg-white p-8 rounded-2xl shadow h-fit">

            <div className="flex items-center gap-3 mb-6">

              <UserPlus
                className="text-blue-600"
                size={32}
              />

              <h1 className="text-3xl font-bold text-blue-600">

                Assign Technician

              </h1>

            </div>

            <form
              onSubmit={
                handleAssign
              }
              className="space-y-5"
            >

              <div>

                <label className="block mb-2 font-semibold">

                  Select Project

                </label>

                <select
                  className="w-full border p-3 rounded-xl"
                  value={projectId}
                  onChange={(e) =>
                    setProjectId(
                      e.target.value
                    )
                  }
                >

                  <option value="">
                    Choose project
                  </option>

                  {projects.map(
                    (project) => (

                      <option
                        key={
                          project.id
                        }
                        value={
                          project.id
                        }
                      >
                        {project.title}
                        {" • "}
                        {
                          project.status
                        }
                      </option>

                    )
                  )}

                </select>

              </div>

              <div>

                <label className="block mb-2 font-semibold">

                  Select Technician

                </label>

                <select
                  className="w-full border p-3 rounded-xl"
                  value={
                    technicianId
                  }
                  onChange={(e) =>
                    setTechnicianId(
                      e.target.value
                    )
                  }
                >

                  <option value="">
                    Choose technician
                  </option>

                  {technicians.map(
                    (
                      technician
                    ) => (

                      <option
                        key={
                          technician.id
                        }
                        value={
                          technician.id
                        }
                      >
                        {
                          technician.full_name
                        }
                      </option>

                    )
                  )}

                </select>

              </div>

              <button
                type="submit"
                disabled={
                  assigning
                }
                className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl transition-all disabled:opacity-50"
              >

                {assigning
                  ? "Assigning..."
                  : "Assign Technician"}

              </button>

            </form>

          </div>

          {/* ASSIGNMENT HISTORY */}

          <div className="xl:col-span-2 bg-white rounded-2xl shadow overflow-hidden">

            <div className="p-6 border-b">

              <div className="flex items-center gap-3">

                <Wrench
                  className="text-green-600"
                  size={28}
                />

                <h2 className="text-3xl font-bold text-blue-600">

                  Assignment History

                </h2>

              </div>

            </div>

            {assignments.length ===
              0 ? (

              <div className="p-10 text-center text-gray-500">

                No assignments yet

              </div>

            ) : (

              <div className="space-y-5 p-6">

                {assignments.map(
                  (
                    assignment
                  ) => (

                    <div
                      key={
                        assignment.id
                      }
                      className="border rounded-2xl p-6 hover:shadow-md transition-all"
                    >

                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                        <div>

                          <h3 className="text-2xl font-bold text-gray-800">

                            {
                              assignment
                                .projects
                                ?.title
                            }

                          </h3>

                          <div className="flex items-center gap-2 mt-3 text-gray-600">

                            <Wrench
                              size={16}
                            />

                            <span>

                              {
                                assignment
                                  .technician
                                  ?.full_name
                              }

                            </span>

                          </div>

                          <div className="flex items-center gap-2 mt-2 text-sm text-green-600">

                            <CheckCircle
                              size={16}
                            />

                            <span>

                              Assigned

                            </span>

                          </div>

                          <p className="text-sm text-gray-500 mt-3">

                            Assigned on{" "}
                            {new Date(
                              assignment.created_at
                            ).toLocaleString()}

                          </p>

                        </div>

                        <button
                          onClick={() =>
                            removeAssignment(
                              assignment.id
                            )
                          }
                          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl h-fit"
                        >

                          <Trash2
                            size={18}
                          />

                          Remove

                        </button>

                      </div>

                    </div>

                  )
                )}

              </div>

            )}

          </div>

        </div>

      </main>

    </div>
  );
}