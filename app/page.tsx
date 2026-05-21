"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type GameStats = {
  id: number;
  created_at: string;
  players: number;
  servers: number;
};

export default function Home() {
  const [stats, setStats] = useState<GameStats | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchStats() {
    const { data, error } = await supabase
      .from("game_stats")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error("Supabase error:", error);
    } else {
      setStats(data);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchStats();

    const interval = setInterval(() => {
      fetchStats();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-6xl font-black text-sky-300">
            Primavera Dashboard
          </h1>
          <p className="mt-3 text-slate-400">
            Roblox server monitor connected to Supabase
          </p>
        </div>

        {loading ? (
          <div className="text-center text-slate-400">Loading data...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-3xl border border-sky-300/30 bg-white/10 p-8 shadow-xl">
              <p className="text-slate-300 text-sm uppercase tracking-widest">
                Players Online
              </p>
              <p className="mt-3 text-6xl font-black text-sky-300">
                {stats?.players ?? 0}
              </p>
            </div>

            <div className="rounded-3xl border border-sky-300/30 bg-white/10 p-8 shadow-xl">
              <p className="text-slate-300 text-sm uppercase tracking-widest">
                Servers Active
              </p>
              <p className="mt-3 text-6xl font-black text-sky-300">
                {stats?.servers ?? 0}
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 text-center text-sm text-slate-500">
          Last update:{" "}
          {stats?.created_at
            ? new Date(stats.created_at).toLocaleString()
            : "-"}
        </div>
      </div>
    </main>
  );
}
