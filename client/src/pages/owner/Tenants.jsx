import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api } from "../../api/axios";

function PendingRow({ t, rooms }) {
  const qc = useQueryClient();
  const [roomId, setRoomId] = useState("");

  const done = () => {
    qc.invalidateQueries({ queryKey: ["tenants"] });
    qc.invalidateQueries({ queryKey: ["rooms"] });
  };

  const approve = useMutation({
    mutationFn: () =>
      api.post(`/owner/tenants/${t._id}/approve`, { roomId }),
    onSuccess: () => {
      toast.success(`${t.name} approved`);
      done();
    },
    onError: (e) => toast.error(e.message),
  });

  const reject = useMutation({
    mutationFn: () => api.post(`/owner/tenants/${t._id}/reject`),
    onSuccess: () => {
      toast.success(`${t.name} rejected`);
      done();
    },
    onError: (e) => toast.error(e.message),
  });

  const free = rooms.filter((r) => r.occupied < r.beds);

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-ink-900/5 py-4 last:border-0">
      <div className="min-w-40 flex-1">
        <div className="font-semibold">{t.name}</div>
        <div className="text-xs text-ink-900/50">
          {t.email}
          {t.phone ? ` · ${t.phone}` : ""}
        </div>
      </div>

      <select
        className="input w-auto"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
      >
        <option value="">Assign room…</option>
        {free.map((r) => (
          <option key={r._id} value={r._id}>
            Room {r.number} ({r.beds - r.occupied} free)
          </option>
        ))}
      </select>

      <button
        className="btn-gold"
        disabled={!roomId || approve.isPending}
        onClick={() => approve.mutate()}
      >
        {approve.isPending ? "Approving..." : "Approve"}
      </button>

      <button
        className="btn-ghost"
        disabled={reject.isPending}
        onClick={() => reject.mutate()}
      >
        {reject.isPending ? "Rejecting..." : "Reject"}
      </button>
    </div>
  );
}

function InviteCard() {
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["invite"],
    queryFn: async () => (await api.get("/owner/pg/invite")).data,
  });

  const rotate = useMutation({
    mutationFn: () => api.post("/owner/pg/invite/rotate"),
    onSuccess: () => {
      toast.success("New QR generated. The old one stops working.");
      qc.invalidateQueries({ queryKey: ["invite"] });
    },
    onError: (e) => toast.error(e.message),
  });

  if (!data) return null;

  return (
    <div className="card flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
      <img
        src={data.qr}
        alt="Join QR code"
        className="h-40 w-40 rounded-xl ring-1 ring-ink-900/10"
      />

      <div className="flex-1">
        <h2 className="text-lg font-extrabold">Invite tenants</h2>

        <p className="mt-1 text-sm text-ink-900/60">
          Tenants scan this QR or open the link, create an account and send a
          join request. Nobody enters without your approval.
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className="btn-ghost"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(data.link);
                toast.success("Link copied");
              } catch {
                toast.error("Could not copy the link");
              }
            }}
          >
            Copy link
          </button>

          <button
            className="btn-ghost"
            disabled={rotate.isPending}
            onClick={() =>
              confirm("The old QR will stop working. Continue?") &&
              rotate.mutate()
            }
          >
            {rotate.isPending ? "Resetting..." : "Reset QR"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Tenants() {
  const qc = useQueryClient();

  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => (await api.get("/owner/rooms")).data,
  });

  const {
    data: tenants = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["tenants"],
    queryFn: async () => (await api.get("/owner/tenants")).data,
    refetchInterval: 10000,
  });

  const remove = useMutation({
    mutationFn: (id) => api.post(`/owner/tenants/${id}/remove`),
    onSuccess: () => {
      toast.success("Tenant marked as left");
      qc.invalidateQueries({ queryKey: ["tenants"] });
      qc.invalidateQueries({ queryKey: ["rooms"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const pending = tenants.filter((t) => t.status === "pending");
  const active = tenants.filter((t) => t.status === "active");

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-extrabold">Tenants</h1>

      <InviteCard />

      {isLoading && (
        <p className="text-sm text-ink-900/50">Loading tenants...</p>
      )}

      {isError && (
        <p className="text-sm text-red-600">
          Could not load tenants: {error?.message || "Unknown error"}
        </p>
      )}

      {!isLoading && !isError && (
        <>
          {pending.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-extrabold">
                Join requests ({pending.length})
              </h2>

              {pending.map((t) => (
                <PendingRow key={t._id} t={t} rooms={rooms} />
              ))}
            </div>
          )}

          <div className="card">
            <h2 className="text-lg font-extrabold">
              Current tenants ({active.length})
            </h2>

            {active.length === 0 && (
              <p className="mt-3 text-sm text-ink-900/50">
                No tenants yet. Share your QR to get started.
              </p>
            )}

            {active.map((t) => (
              <div
                key={t._id}
                className="flex items-center gap-3 border-b border-ink-900/5 py-4 last:border-0"
              >
                <div className="flex-1">
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-xs text-ink-900/50">
                    {t.phone || t.email}
                  </div>
                </div>

                <span className="rounded-full bg-gold-400/30 px-3 py-1 text-xs font-bold">
                  Room {t.room?.number}
                </span>

                <button
                  className="btn-ghost"
                  disabled={remove.isPending}
                  onClick={() =>
                    confirm(`Mark ${t.name} as left?`) && remove.mutate(t._id)
                  }
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}