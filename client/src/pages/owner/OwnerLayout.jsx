import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  LayoutDashboard,
  BedDouble,
  Users,
  Settings as Cog,
  IndianRupee,
} from "lucide-react";

import Shell from "../../components/layout/Shell";
import Spinner from "../../components/ui/Spinner";
import AuthShell from "../../components/layout/AuthShell";
import { usePg } from "../../api/hooks";
import { api } from "../../api/axios";

const nav = [
  { to: "/owner", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/owner/rooms", label: "Rooms", icon: BedDouble },
  { to: "/owner/tenants", label: "Tenants", icon: Users },
  { to: "/owner/rent", label: "Rent", icon: IndianRupee },
  { to: "/owner/settings", label: "Settings", icon: Cog },
];

function CreatePg() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", address: "" });

  const create = useMutation({
    mutationFn: () => api.post("/owner/pg", form),
    onSuccess: () => {
      toast.success("PG created successfully");
      qc.invalidateQueries({ queryKey: ["pg"] });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <AuthShell
      title="Set up your PG"
      subtitle="Your three room types come pre-filled. You can change fees anytime in Settings."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
        className="space-y-5"
      >
        <div>
          <label className="label">PG name</label>
          <input
            className="input"
            required
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />
        </div>

        <div>
          <label className="label">Address</label>
          <input
            className="input"
            value={form.address}
            onChange={(e) =>
              setForm({ ...form, address: e.target.value })
            }
          />
        </div>

        <button
          className="btn-gold w-full"
          disabled={create.isPending}
        >
          {create.isPending ? "Creating..." : "Create my PG"}
        </button>
      </form>
    </AuthShell>
  );
}

export default function OwnerLayout() {
  const { data: pg, isLoading } = usePg();

  if (isLoading) {
    return <Spinner />;
  }

  if (!pg) {
    return <CreatePg />;
  }

  return <Shell nav={nav} subtitle={pg.name} />;
}