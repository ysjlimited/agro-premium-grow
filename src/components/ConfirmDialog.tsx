import { useState, type ReactNode } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

export function ConfirmDialog({
  open, title, description, confirmLabel = "Delete", busy, onCancel, onConfirm,
}: {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-5">
      <div className="w-full max-w-md rounded-2xl bg-[#1e293b] border border-rose-500/30 p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-500/15 text-rose-300">
            <AlertTriangle size={18}/>
          </span>
          <div className="flex-1">
            <h3 className="font-display text-lg font-bold text-white">{title}</h3>
            <div className="mt-1 text-sm text-slate-300">{description}</div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onCancel} disabled={busy}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/5">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-rose-500 hover:bg-rose-400 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {busy && <Loader2 size={14} className="animate-spin"/>} {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useConfirm() {
  const [state, setState] = useState<{ open: boolean; title: string; description: ReactNode; onConfirm: () => void; confirmLabel?: string } | null>(null);
  return {
    confirm: (opts: { title: string; description: ReactNode; confirmLabel?: string; onConfirm: () => void }) =>
      setState({ open: true, ...opts }),
    close: () => setState(null),
    node: state ? (
      <ConfirmDialog
        open={state.open}
        title={state.title}
        description={state.description}
        confirmLabel={state.confirmLabel}
        onCancel={() => setState(null)}
        onConfirm={() => { state.onConfirm(); setState(null); }}
      />
    ) : null,
  };
}
