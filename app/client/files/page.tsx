"use client";

import {
  useEffect,
  useState,
} from "react";

import Sidebar from "@/components/Sidebar";

import { supabase } from "@/lib/supabase";

import {
  FileText,
  Download,
} from "lucide-react";

export default function ClientFilesPage() {

  const [files, setFiles] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    fetchFiles();

    const channel =
      supabase
        .channel(
          "client-files"
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

  async function fetchFiles() {

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } =
      await supabase
        .from("project_files")
        .select(`
          *,
          projects (
            id,
            title,
            client_id
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

        <div className="mb-8">

          <h1 className="text-4xl font-bold text-purple-600">

            Project Documents

          </h1>

          <p className="text-gray-600 mt-2">

            Access your contracts and files

          </p>

        </div>

        <div className="space-y-5">

          {files.length === 0 && (

            <div className="bg-white p-10 rounded-xl shadow text-center text-gray-500">

              No files available

            </div>

          )}

          {files.map(
            (file: any) => (

              <div
                key={file.id}
                className="bg-white p-6 rounded-xl shadow flex flex-col md:flex-row md:items-center md:justify-between gap-5"
              >

                <div className="flex items-center gap-4">

                  <div className="bg-purple-100 p-3 rounded-lg">

                    <FileText
                      className="text-purple-600"
                      size={24}
                    />

                  </div>

                  <div>

                    <h2 className="text-xl font-bold">

                      {
                        file.file_name
                      }

                    </h2>

                    <p className="text-gray-500">

                      Project:
                      {" "}
                      {
                        file.projects
                          ?.title
                      }

                    </p>

                    <p className="text-gray-400 text-sm mt-1">

                      {new Date(
                        file.created_at
                      ).toLocaleString()}

                    </p>

                  </div>

                </div>

                <a
                  href={file.file_url}
                  target="_blank"
                  className="bg-purple-600 text-white px-5 py-3 rounded-lg flex items-center gap-2 w-fit"
                >

                  <Download
                    size={18}
                  />

                  Download

                </a>

              </div>

            )
          )}

        </div>

      </main>

    </div>
  );
}