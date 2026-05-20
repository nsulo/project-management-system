"use client";

import {
  useEffect,
  useState,
} from "react";

import Sidebar from "@/components/Sidebar";

import { supabase } from "@/lib/supabase";

import {
  Activity,
  CalendarDays,
  ShieldCheck,
  Search,
} from "lucide-react";

type ActivityType = {
  id: number;
  action: string;
  details: string;
  created_at: string;
};

export default function ActivityPage() {

  const [activities, setActivities] =
    useState<ActivityType[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  useEffect(() => {

    fetchActivities();

    const channel =
      supabase
        .channel(
          "activity-realtime"
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "activity_logs",
          },
          () => {
            fetchActivities();
          }
        )
        .subscribe();

    return () => {

      supabase.removeChannel(
        channel
      );
    };

  }, []);

  async function fetchActivities() {

    const { data, error } =
      await supabase
        .from("activity_logs")
        .select("*")
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

    if (data) {

      setActivities(data);
    }

    setLoading(false);
  }

  const filteredActivities =
    activities.filter(
      (activity) =>
        activity.action
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          ) ||
        activity.details
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          )
    );

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

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">

          <div>

            <div className="flex items-center gap-3 mb-3">

              <Activity
                className="text-blue-600"
                size={34}
              />

              <h1 className="text-4xl font-bold text-blue-600">

                Activity Logs

              </h1>

            </div>

            <p className="text-gray-600">

              Track important platform actions in realtime

            </p>

          </div>

          <div className="relative w-full lg:w-96">

            <Search
              size={18}
              className="absolute left-4 top-4 text-gray-400"
            />

            <input
              type="text"
              placeholder="Search activity..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              className="w-full border pl-11 pr-4 py-3 rounded-xl"
            />

          </div>

        </div>

        <div className="space-y-5">

          {filteredActivities.length ===
            0 && (

            <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-500">

              No activity logs found

            </div>

          )}

          {filteredActivities.map(
            (activity) => (

              <div
                key={activity.id}
                className="bg-white rounded-2xl shadow p-6 border border-gray-100"
              >

                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                  <div className="flex-1">

                    <div className="flex items-center gap-3 mb-3">

                      <ShieldCheck
                        size={22}
                        className="text-blue-600"
                      />

                      <h2 className="text-xl font-bold text-gray-800">

                        {
                          activity.action
                        }

                      </h2>

                    </div>

                    <p className="text-gray-700 leading-relaxed">

                      {
                        activity.details
                      }

                    </p>

                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500">

                    <CalendarDays
                      size={16}
                    />

                    {new Date(
                      activity.created_at
                    ).toLocaleString()}

                  </div>

                </div>

              </div>

            )
          )}

        </div>

      </main>

    </div>
  );
}