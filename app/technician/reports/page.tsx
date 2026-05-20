"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  FileText,
  Trash2,
  Clock3,
  ImageIcon,
  Pencil,
  Save,
  X,
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
};

export default function TechnicianReportsPage() {

  const [reports, setReports] =
    useState<ReportType[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [
    editingId,
    setEditingId,
  ] = useState<number | null>(
    null
  );

  const [
    editedText,
    setEditedText,
  ] = useState("");

  const [
    saving,
    setSaving,
  ] = useState(false);

  useEffect(() => {

    fetchReports();

    const channel =
      supabase
        .channel(
          "technician-reports"
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
      data,
      error,
    } = await supabase
      .from("reports")
      .select(`
        *,
        projects (
          title
        )
      `)
      .eq(
        "technician_id",
        user.id
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

  function startEditing(
    report: ReportType
  ) {

    setEditingId(report.id);

    setEditedText(
      report.report_text
    );
  }

  function cancelEditing() {

    setEditingId(null);

    setEditedText("");
  }

  async function saveReport(
    id: number
  ) {

    if (!editedText.trim()) {

      alert(
        "Report text cannot be empty"
      );

      return;
    }

    setSaving(true);

    const { error } =
      await supabase
        .from("reports")
        .update({
          report_text:
            editedText,
        })
        .eq("id", id);

    if (error) {

      alert(error.message);

      setSaving(false);

      return;
    }

    setReports((prev) =>
      prev.map((report) =>
        report.id === id
          ? {
              ...report,
              report_text:
                editedText,
            }
          : report
      )
    );

    setEditingId(null);

    setEditedText("");

    setSaving(false);

    alert(
      "Report updated successfully"
    );
  }

  async function deleteReport(
    id: number
  ) {

    const confirmed =
      confirm(
        "Delete this report?"
      );

    if (!confirmed) return;

    const { error } =
      await supabase
        .from("reports")
        .delete()
        .eq("id", id);

    if (error) {

      alert(error.message);

      return;
    }

    setReports((prev) =>
      prev.filter(
        (report) =>
          report.id !== id
      )
    );
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

        <div className="mb-10">

          <div className="flex items-center gap-3 mb-3">

            <FileText
              className="text-green-600"
              size={34}
            />

            <h1 className="text-4xl font-bold text-green-600">

              My Reports

            </h1>

          </div>

          <p className="text-gray-600">

            Review, edit and manage submitted reports

          </p>

        </div>

        <div className="space-y-6">

          {reports.length ===
            0 && (

            <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-500">

              No reports submitted yet

            </div>

          )}

          {reports.map(
            (report) => (

              <div
                key={report.id}
                className="bg-white rounded-2xl shadow p-7"
              >

                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-5 mb-5">

                  <div>

                    <h2 className="text-2xl font-bold text-gray-800 mb-2">

                      {
                        report.projects
                          ?.title
                      }

                    </h2>

                    <div className="flex items-center gap-2 text-sm text-gray-500">

                      <Clock3
                        size={16}
                      />

                      {new Date(
                        report.created_at
                      ).toLocaleString()}

                    </div>

                  </div>

                  <div className="flex items-center gap-3 flex-wrap">

                    {editingId ===
                    report.id ? (

                      <>
                        <button
                          onClick={() =>
                            saveReport(
                              report.id
                            )
                          }
                          disabled={
                            saving
                          }
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl disabled:opacity-50"
                        >

                          <Save
                            size={18}
                          />

                          {saving
                            ? "Saving..."
                            : "Save"}

                        </button>

                        <button
                          onClick={
                            cancelEditing
                          }
                          className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-xl"
                        >

                          <X
                            size={18}
                          />

                          Cancel

                        </button>
                      </>

                    ) : (

                      <>
                        <button
                          onClick={() =>
                            startEditing(
                              report
                            )
                          }
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl"
                        >

                          <Pencil
                            size={18}
                          />

                          Edit

                        </button>

                        <button
                          onClick={() =>
                            deleteReport(
                              report.id
                            )
                          }
                          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl"
                        >

                          <Trash2
                            size={18}
                          />

                          Delete

                        </button>
                      </>

                    )}

                  </div>

                </div>

                <div className="bg-gray-50 rounded-xl p-5 mb-5">

                  {editingId ===
                  report.id ? (

                    <textarea
                      rows={6}
                      value={
                        editedText
                      }
                      onChange={(e) =>
                        setEditedText(
                          e.target
                            .value
                        )
                      }
                      className="w-full border rounded-xl p-4 outline-none focus:ring-2 focus:ring-green-500"
                    />

                  ) : (

                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">

                      {
                        report.report_text
                      }

                    </p>

                  )}

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