import { createFileRoute, redirect } from "@tanstack/react-router";

// Convenience redirect so /admin lands inside the protected layout
export const Route = createFileRoute("/admin")({
  beforeLoad: () => { throw redirect({ to: "/_authenticated/admin" as any }); },
});
