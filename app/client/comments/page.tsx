"use client";

import {
  useEffect,
  useState,
} from "react";

import Sidebar from "@/components/Sidebar";

import { supabase } from "@/lib/supabase";

import {
  MessageSquare,
  Send,
  CheckCheck,
} from "lucide-react";

type CommentType = {
  id: number;
  comment: string;
  created_at: string;
  is_read: boolean;
  profiles: {
    full_name: string;
    role: string;
  };
  projects: {
    title: string;
  };
};

export default function ClientCommentsPage() {

  const [comments, setComments] =
    useState<CommentType[]>([]);

  const [projects, setProjects] =
    useState<any[]>([]);

  const [
    selectedProject,
    setSelectedProject,
  ] = useState("");

  const [newComment, setNewComment] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    fetchProjects();

    fetchComments();

    markCommentsAsRead();

    const channel =
      supabase
        .channel(
          "client-comments"
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table:
              "project_comments",
          },
          () => {
            fetchComments();
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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } =
      await supabase
        .from("projects")
        .select("*")
        .eq("client_id", user.id)
        .order("created_at", {
          ascending: false,
        });

    if (error) {

      console.error(error);

      return;
    }

    if (data) {

      setProjects(data);
    }
  }

  async function fetchComments() {

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const {
      data: clientProjects,
      error: projectsError,
    } = await supabase
      .from("projects")
      .select("id")
      .eq("client_id", user.id);

    if (
      projectsError ||
      !clientProjects
    ) {

      console.error(
        projectsError
      );

      setLoading(false);

      return;
    }

    const projectIds =
      clientProjects.map(
        (project) => project.id
      );

    if (
      projectIds.length === 0
    ) {

      setComments([]);

      setLoading(false);

      return;
    }

    const { data, error } =
      await supabase
        .from("project_comments")
        .select(`
          *,
          profiles (
            full_name,
            role
          ),
          projects (
            title
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

    setComments(
      data as CommentType[]
    );

    setLoading(false);
  }

  async function markCommentsAsRead() {

    await supabase
      .from("project_comments")
      .update({
        is_read: true,
      })
      .eq("is_read", false);
  }

  async function handleAddComment(
    e: React.FormEvent
  ) {

    e.preventDefault();

    if (
      !newComment ||
      !selectedProject
    ) {
      return;
    }

    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user) return;

    const { error } =
      await supabase
        .from(
          "project_comments"
        )
        .insert({
          comment: newComment,
          project_id:
            Number(
              selectedProject
            ),
          user_id: user.id,
          is_read: false,
        });

    if (error) {

      alert(error.message);

      return;
    }

    setNewComment("");

    fetchComments();
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

        <div className="max-w-5xl mx-auto">

          <div className="bg-white rounded-2xl shadow p-8 mb-8">

            <div className="flex items-center justify-between flex-wrap gap-4">

              <div className="flex items-center gap-3">

                <MessageSquare
                  className="text-purple-600"
                  size={34}
                />

                <h1 className="text-4xl font-bold text-purple-600">

                  Project Comments

                </h1>

              </div>

              <div className="flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-xl">

                <CheckCheck size={18} />

                Comments synced live

              </div>

            </div>

            <form
              onSubmit={
                handleAddComment
              }
              className="space-y-5 mt-8"
            >

              <div>

                <label className="block mb-2 font-semibold">

                  Select Project

                </label>

                <select
                  value={
                    selectedProject
                  }
                  onChange={(e) =>
                    setSelectedProject(
                      e.target.value
                    )
                  }
                  className="w-full border p-3 rounded-xl"
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
                      </option>

                    )
                  )}

                </select>

              </div>

              <div>

                <label className="block mb-2 font-semibold">

                  Comment

                </label>

                <textarea
                  rows={4}
                  value={newComment}
                  onChange={(e) =>
                    setNewComment(
                      e.target.value
                    )
                  }
                  className="w-full border p-4 rounded-xl"
                  placeholder="Write your comment..."
                />

              </div>

              <button
                type="submit"
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl transition-all"
              >

                <Send size={18} />

                Post Comment

              </button>

            </form>

          </div>

          <div className="space-y-5">

            {comments.length ===
              0 && (

              <div className="bg-white rounded-xl p-8 shadow text-center text-gray-500">

                No comments found

              </div>

            )}

            {comments.map(
              (comment) => (

                <div
                  key={comment.id}
                  className="bg-white rounded-2xl shadow p-6"
                >

                  <div className="flex items-center justify-between mb-4">

                    <div>

                      <h2 className="font-bold text-lg text-gray-800">

                        {
                          comment
                            .profiles
                            ?.full_name
                        }

                      </h2>

                      <div className="text-sm text-gray-500 capitalize">

                        {
                          comment
                            .profiles
                            ?.role
                        }

                      </div>

                    </div>

                    <div className="text-sm text-gray-500">

                      {new Date(
                        comment.created_at
                      ).toLocaleString()}

                    </div>

                  </div>

                  <div className="mb-4">

                    <span className="bg-purple-100 text-purple-700 text-sm px-3 py-1 rounded-full">

                      {
                        comment
                          .projects
                          ?.title
                      }

                    </span>

                  </div>

                  <p className="text-gray-700 leading-relaxed">

                    {comment.comment}

                  </p>

                </div>

              )
            )}

          </div>

        </div>

      </main>

    </div>
  );
}