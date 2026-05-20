"use client";

import {
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

export default function ActivityTimeline() {

  const [
    activities,
    setActivities,
  ] = useState<any[]>([]);

  useEffect(() => {

    fetchActivities();

    const channel =
      supabase
        .channel(
          "activities-realtime"
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "activities",
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

    const { data } =
      await supabase
        .from("activities")
        .select(`
          *,
          profiles (
            full_name
          )
        `)
        .order("created_at", {
          ascending: false,
        })
        .limit(10);

    if (data) {
      setActivities(data);
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow mt-10">

      <h2 className="text-2xl font-bold mb-6">
        Recent Activity
      </h2>

      <div className="space-y-5">

        {activities.length === 0 && (

          <p className="text-gray-500">
            No activity yet
          </p>

        )}

        {activities.map(
          (activity) => (

            <div
              key={activity.id}
              className="border-l-4 border-blue-600 pl-4"
            >

              <h3 className="font-bold">

                {activity.action}

              </h3>

              <p className="text-gray-600">

                {activity.details}

              </p>

              <p className="text-sm text-gray-400 mt-1">

                By:
                {" "}
                {
                  activity.profiles
                    ?.full_name
                }
                {" "}
                •
                {" "}
                {new Date(
                  activity.created_at
                ).toLocaleString()}

              </p>

            </div>

          )
        )}

      </div>

    </div>
  );
}