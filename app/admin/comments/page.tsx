"use client";

import {
  useEffect,
  useState,
} from "react";

import Sidebar from "@/components/Sidebar";

import { supabase } from "@/lib/supabase";

import {
  MessageSquare,
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

export default function AdminCommentsPage() {

  const [comments, setComments] =
    useState<CommentType[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    fetchComments();

    const channel =
      supabase
        .channel(
          "admin-comments-realtime"
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

  async function fetchComments() {

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
        .order("created_at", {
          ascending: false,
        });

    if (!error && data) {

      setComments(
        data as CommentType[]
      );

      await markCommentsAsRead();
    }

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

        <div className="max-w-6xl mx-auto">

          <div className="bg-white rounded-2xl shadow p-8 mb-8">

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-3">

                <MessageSquare
                  className="text-blue-600"
                  size={34}
                />

                <h1 className="text-4xl font-bold text-blue-600">

                  Project Comments

                </h1>

              </div>

              <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-xl">

                <CheckCheck size={18} />

                All comments marked as read

              </div>

            </div>

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
                  className="bg-white rounded-2xl shadow p-6 border border-gray-100"
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

                    <span className="bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full">

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