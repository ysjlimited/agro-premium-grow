import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — YSJ Limited Management Portal" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  // Sign out any stale session on landing here so login is always fresh.
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("ysj-active-session");
    }
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      sessionStorage.setItem("ysj-active-session", "1");
      navigate({ to: "/admin" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e293b] flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white mb-6">
          <ArrowLeft size={14}/> Back to site
        </Link>
        <div className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur p-8 shadow-2xl">
          <h1 className="font-display text-2xl font-bold text-white">YSJ Management Portal</h1>
          <p className="text-sm text-white/60 mt-1">Staff sign-in. Login is required on every visit.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/30"
            />
            <input
              type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/30"
            />
            <button
              type="submit" disabled={busy}
              className="w-full rounded-xl bg-emerald-500 text-white font-semibold py-2.5 text-sm hover:bg-emerald-400 disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              {busy && <Loader2 size={14} className="animate-spin"/>} Sign in
            </button>
          </form>
        </div>
        <p className="mt-6 text-center text-xs text-white/40">
          New staff accounts are created by the Main Admin from Staff Roster.
        </p>
      </div>
    </div>
  );
}
