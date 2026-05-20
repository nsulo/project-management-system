"use client";

import {
  useEffect,
  useState,
} from "react";

import Sidebar from "@/components/Sidebar";

import { supabase } from "@/lib/supabase";

import {
  Upload,
  FileText,
  Download,
  Trash2,
} from "lucide-react";

export default function AdminFilesPage() {

  const [projects, setProjects] =
    useState<any[]>([]);

  const [files, setFiles] =
    useState<any[]>([]);

  const [projectId, setProjectId] =
    useState("");

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [uploading, setUploading] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    fetchProjects();

    fetchFiles();

    const channel =
      supabase
        .channel(
          "files-realtime"
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "project_files",
          },
          () => {
            fetchFiles();
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
        .select("*")
        .order("created_at", {
          ascending: false,
        });

    if (!error && data) {
      setProjects(data);
    }
  }

  async function fetchFiles() {

    const { data, error } =
      await supabase
        .from("project_files")
        .select(`
          *,
          projects (
            title
          )
        `)
        .order("created_at", {
          ascending: false,
        });

    if (!error && data) {
      setFiles(data);
    }

    setLoading(false);
  }

  async function handleUpload(
    e: React.FormEvent
  ) {

    e.preventDefault();

    if (!selectedFile) {

      alert("Select a file");

      return;
    }

    if (!projectId) {

      alert("Select a project");

      return;
    }

    setUploading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {

      alert("User not found");

      setUploading(false);

      return;
    }

    const filePath =
      `${Date.now()}-${selectedFile.name}`;

    const { error: uploadError } =
      await supabase.storage
        .from("project-files")
        .upload(
          filePath,
          selectedFile
        );

    if (uploadError) {

      alert(uploadError.message);

      setUploading(false);

      return;
    }

    const {
      data: publicData,
    } = supabase.storage
      .from("project-files")
      .getPublicUrl(
        filePath
      );

    const { error: dbError } =
      await supabase
        .from("project_files")
        .insert({
          project_id: projectId,
          uploaded_by: user.id,
          file_name:
            selectedFile.name,
          file_url:
            publicData.publicUrl,
        });

    if (dbError) {

      alert(dbError.message);

      setUploading(false);

      return;
    }

    alert("File uploaded");

    setSelectedFile(null);

    setProjectId("");

    fetchFiles();

    setUploading(false);
  }

  async function deleteFile(
    file: any
  ) {

    const confirmed =
      confirm(
        "Delete this file?"
      );

    if (!confirmed) return;

    const fileName =
      file.file_url
        .split("/")
        .pop();

    if (fileName) {

      await supabase.storage
        .from("project-files")
        .remove([fileName]);
    }

    const { error } =
      await supabase
        .from("project_files")
        .delete()
        .eq("id", file.id);

    if (error) {

      alert(error.message);

      return;
    }

    alert("File deleted");

    fetchFiles();
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* UPLOAD FORM */}

          <div className="bg-white p-6 rounded-xl shadow h-fit">

            <h1 className="text-3xl font-bold text-blue-600 mb-6">

              Upload File

            </h1>

            <form
              onSubmit={
                handleUpload
              }
              className="space-y-5"
            >

              <div>

                <label className="block mb-2 font-medium">

                  Select Project

                </label>

                <select
                  className="w-full border p-3 rounded-lg"
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
                        key={project.id}
                        value={project.id}
                      >
                        {
                          project.title
                        }
                      </option>

                    )
                  )}

                </select>

              </div>

              <div>

                <label className="block mb-2 font-medium">

                  Choose File

                </label>

                <input
                  type="file"
                  onChange={(e) =>
                    setSelectedFile(
                      e.target
                        .files?.[0] ||
                        null
                    )
                  }
                  className="w-full border p-3 rounded-lg"
                />

              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >

                <Upload size={18} />

                {uploading
                  ? "Uploading..."
                  : "Upload File"}

              </button>

            </form>

          </div>

          {/* FILES LIST */}

          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow">

            <h2 className="text-3xl font-bold text-blue-600 mb-6">

              Project Files

            </h2>

            <div className="space-y-4">

              {files.length === 0 && (

                <div className="text-center text-gray-500 py-10">

                  No files uploaded yet

                </div>

              )}

              {files.map(
                (file: any) => (

                  <div
                    key={file.id}
                    className="border rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  >

                    <div className="flex items-center gap-4">

                      <div className="bg-blue-100 p-3 rounded-lg">

                        <FileText
                          className="text-blue-600"
                          size={24}
                        />

                      </div>

                      <div>

                        <h3 className="font-bold text-lg">

                          {
                            file.file_name
                          }

                        </h3>

                        <p className="text-gray-500 text-sm">

                          Project:
                          {" "}
                          {
                            file.projects
                              ?.title
                          }

                        </p>

                        <p className="text-gray-400 text-xs mt-1">

                          {new Date(
                            file.created_at
                          ).toLocaleString()}

                        </p>

                      </div>

                    </div>

                    <div className="flex gap-3">

                      <a
                        href={
                          file.file_url
                        }
                        target="_blank"
                        className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                      >

                        <Download
                          size={18}
                        />

                        Download

                      </a>

                      <button
                        onClick={() =>
                          deleteFile(
                            file
                          )
                        }
                        className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
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

        </div>

      </main>

    </div>
  );
}