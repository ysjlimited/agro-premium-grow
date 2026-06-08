import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
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

  const signInWithGoogle = async () => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
      if (result.redirected) {
        return;
      }
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

          <div className="mt-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-white/40">or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <button
            onClick={signInWithGoogle}
            disabled={busy}
            className="mt-4 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white hover:bg-white/10 disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            <svg className="size-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.19 3.33v2.77h3.55c2.08-1.92 3.28-4.74 3.28-8.11z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.55-2.77c-.98.66-2.23 1.06-3.73 1.06-2.87 0-5.3-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.86-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>
        </div>
        <p className="mt-6 text-center text-xs text-white/40">
          New staff accounts are created by the Main Admin from Staff Roster.
        </p>
      </div>
    </div>
  );
}
