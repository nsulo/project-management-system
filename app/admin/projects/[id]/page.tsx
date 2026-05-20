"use client";

import {
  useEffect,
  useState,
} from "react";

import { useParams } from "next/navigation";

import Sidebar from "@/components/Sidebar";

import { supabase } from "@/lib/supabase";

export default function ProjectChatPage() {

  const params = useParams();

  const projectId =
    params.id;

  const [project, setProject] =
    useState<any>(null);

  const [comments, setComments] =
    useState<any[]>([]);

  const [comment, setComment] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    fetchProject();

    fetchComments();

    const channel =
      supabase
        .channel(
          "project-comments"
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

  async function fetchProject() {

    const { data } =
      await supabase
        .from("projects")
        .select(`
          *,
          profiles (
            full_name
          )
        `)
        .eq("id", projectId)
        .single();

    if (data) {
      setProject(data);
    }
  }

  async function fetchComments() {

    const { data } =
      await supabase
        .from("project_comments")
        .select(`
          *,
          profiles (
            full_name,
            avatar_url,
            role
          )
        `)
        .eq(
          "project_id",
          projectId
        )
        .order("created_at", {
          ascending: true,
        });

    if (data) {
      setComments(data);
    }

    setLoading(false);
  }

  async function sendComment(
    e: React.FormEvent
  ) {

    e.preventDefault();

    if (!comment.trim())
      return;

    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user) return;

    const { error } =
      await supabase
        .from("project_comments")
        .insert({
          project_id:
            Number(projectId),
          user_id: user.id,
          comment,
        });

    if (error) {
      alert(error.message);
      return;
    }

    setComment("");
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

        <div className="bg-white p-8 rounded-2xl shadow">

          <div className="mb-8">

            <h1 className="text-4xl font-bold text-blue-600">

              {project?.title}

            </h1>

            <p className="text-gray-600 mt-2">

              {
                project?.description
              }

            </p>

          </div>

          <div className="space-y-5 mb-8 max-h-[500px] overflow-y-auto">

            {comments.map(
              (item: any) => (

                <div
                  key={item.id}
                  className="flex gap-4 bg-gray-50 p-4 rounded-xl"
                >

                  {item.profiles
                    ?.avatar_url ? (

                    <img
                      src={
                        item
                          .profiles
                          ?.avatar_url
                      }
                      alt="Avatar"
                      className="w-12 h-12 rounded-full object-cover"
                    />

                  ) : (

                    <div className="w-12 h-12 rounded-full bg-gray-300" />

                  )}

                  <div className="flex-1">

                    <div className="flex items-center gap-3 mb-2">

                      <h2 className="font-bold">

                        {
                          item
                            .profiles
                            ?.full_name
                        }

                      </h2>

                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">

                        {
                          item
                            .profiles
                            ?.role
                        }

                      </span>

                    </div>

                    <p className="text-gray-700">

                      {
                        item.comment
                      }

                    </p>

                    <div className="text-xs text-gray-500 mt-2">

                      {new Date(
                        item.created_at
                      ).toLocaleString()}

                    </div>

                  </div>

                </div>

              )
            )}

          </div>

          <form
            onSubmit={sendComment}
            className="flex gap-4"
          >

            <input
              type="text"
              placeholder="Write a comment..."
              className="flex-1 border p-4 rounded-xl"
              value={comment}
              onChange={(e) =>
                setComment(
                  e.target.value
                )
              }
            />

            <button
              type="submit"
              className="bg-blue-600 text-white px-6 rounded-xl hover:bg-blue-700"
            >
              Send
            </button>

          </form>

        </div>

      </main>

    </div>
  );
}