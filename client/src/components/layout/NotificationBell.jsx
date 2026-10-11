import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { api } from "../../api/axios";
import { timeAgo } from "../../lib/format";

export default function NotificationBell() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const box = useRef(null);
  const [open, setOpen] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ["notifications"] });

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => (await api.get("/notifications")).data,
    refetchInterval: 20000,
  });
  const readAll = useMutation({ mutationFn: () => api.post("/notifications/read"), onSuccess: refresh });
  const readOne = useMutation({ mutationFn: (id) => api.post(`/notifications/${id}/read`), onSuccess: refresh });

  useEffect(() => {
    const close = (e) => box.current && !box.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const go = (n) => {
    setOpen(false);
    if (!n.read) readOne.mutate(n.id);
    if (n.link) nav(n.link);
  };
  const unread = data?.unread ?? 0;

  return (
    <div ref={box} className="relative">
      <button onClick={() => setOpen(!open)} className="relative grid h-11 w-11 place-items-center rounded-full bg-white shadow ring-1 ring-ink-900/10 transition hover:bg-sand-50">
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-gold-500 px-1 text-[11px] font-extrabold text-ink-950">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-[22rem] max-w-[88vw] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-ink-900/10">
          <div className="flex items-center justify-between border-b border-ink-900/5 px-4 py-3">
            <div className="font-extrabold">Notifications</div>
            {unread > 0 && <button className="text-xs font-semibold text-gold-500" onClick={() => readAll.mutate()}>Mark all read</button>}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {!data || data.items.length === 0 ? (
              <div className="p-8 text-center text-sm text-ink-900/50">You're all caught up.</div>
            ) : (
              data.items.map((n) => (
                <button key={n.id} onClick={() => go(n)} className={`block w-full border-b border-ink-900/5 px-4 py-3 text-left last:border-0 hover:bg-sand-50 ${n.read ? "" : "bg-gold-400/10"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm font-bold">{n.title}</div>
                    <div className="shrink-0 text-[11px] text-ink-900/40">{timeAgo(n.at)}</div>
                  </div>
                  {n.body && <div className="mt-0.5 line-clamp-2 text-xs text-ink-900/60">{n.body}</div>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}