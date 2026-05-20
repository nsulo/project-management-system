"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {

  useEffect(() => {
    async function testConnection() {
      const { data, error } = await supabase
        .from("test")
        .select("*");

      console.log("DATA:", data);
      console.log("ERROR:", error);
    }

    testConnection();
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-10 rounded-xl shadow-lg text-center">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">
          Supabase Connected
        </h1>

        <p className="text-gray-600">
          Project Management System
        </p>
      </div>
    </main>
  );
}